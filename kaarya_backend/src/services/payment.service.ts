import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PAYMENT_MESSAGES } from 'src/constants/messages.constants';
import { TCreateStripeCheckoutSessionDTO } from 'src/dtos/payments/stripe-payment.dto';
import { ACInterviewSessionRepository } from 'src/repositories/interview-session.repository';
import { UserService } from 'src/services/user.service';
import { AllConfigType } from 'src/types/config.type';
import { UserRole } from 'src/types/user-role.enum';
import { TUser } from 'src/types/user.type';
import { UserPlan } from 'src/types/user-plan.enum';

type TInvoiceStatus = 'paid' | 'failed' | 'refunded';

type TInvoiceRecord = {
  id: string;
  invoiceNumber: string;
  transactionUuid: string;
  amountNpr: number;
  currency: 'NPR';
  paymentProvider: 'stripe' | 'esewa';
  status: TInvoiceStatus;
  planFrom: UserPlan;
  planTo: UserPlan;
  issuedAt: Date;
  paidAt: Date | null;
};

type TUserBilling = {
  autoRenew: boolean;
  stripeCustomerId: string | null;
  invoices: TInvoiceRecord[];
  updatedAt: Date | null;
};

const PRO_PRICE_NPR = 1499;
const FREE_MONTHLY_INTERVIEW_LIMIT = 5;
const STRIPE_NPR_CENTS_MULTIPLIER = 100;
const BILLING_ELIGIBLE_ROLES: readonly UserRole[] = [
  UserRole.USER,
  UserRole.STUDENT,
  UserRole.FACULTY,
];

@Injectable()
export class PaymentService {
  private stripeClient: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userService: UserService,
    private readonly interviewSessionRepository: ACInterviewSessionRepository,
  ) {}

  async createStripeCheckoutSession(
    userId: string,
    payload: TCreateStripeCheckoutSessionDTO,
  ) {
    const user = await this.userService.getUserByIdRaw(userId);
    this.assertBillingEligibleRole(user.role);

    if (user.plan === UserPlan.PRO) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: PAYMENT_MESSAGES.STRIPE_ALREADY_ACTIVE,
      });
    }

    const successPath = this.normalizePath(payload.successPath, '/payment/checkout');
    const cancelPath = this.normalizePath(payload.cancelPath, '/payment/checkout');
    const stripe = this.getStripeClient();
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: customerId,
      metadata: {
        userId: user.id,
        targetPlan: UserPlan.PRO,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'npr',
            unit_amount: PRO_PRICE_NPR * STRIPE_NPR_CENTS_MULTIPLIER,
            product_data: {
              name: 'Kaarya Pro Plan',
              description: 'Unlock Pro interview access',
            },
          },
        },
      ],
      success_url: `${this.getFrontendDomain()}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.getFrontendDomain()}${cancelPath}?reason=cancelled`,
    });

    if (!session.url) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Stripe checkout session URL is missing.',
      });
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      currency: 'NPR' as const,
      amountNpr: PRO_PRICE_NPR,
      plan: UserPlan.PRO,
    };
  }

  async createStripePortalSession(
    userId: string,
    payload: { returnPath: string },
  ) {
    const user = await this.userService.getUserByIdRaw(userId);
    this.assertBillingEligibleRole(user.role);

    const stripe = this.getStripeClient();
    const customerId = await this.getOrCreateStripeCustomer(userId);
    const returnPath = this.normalizePath(payload.returnPath, '/payment/checkout');

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.getFrontendDomain()}${returnPath}`,
    });

    return {
      portalUrl: portalSession.url,
    };
  }

  async verifyStripeCheckoutSession(userId: string, sessionId: string) {
    const stripe = this.getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Payment not completed.',
      });
    }

    if (session.metadata?.userId && session.metadata.userId !== userId) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Payment session does not belong to this user.',
      });
    }

    const user = await this.userService.getUserByIdRaw(userId);
    this.assertBillingEligibleRole(user.role);

    const billing = this.normalizeBilling(
      (user as unknown as { billing?: unknown }).billing,
    );
    const alreadyPro = user.plan === UserPlan.PRO;

    const existingInvoice = billing.invoices.find(
      (invoice) => invoice.transactionUuid === session.id,
    );

    let invoiceNumber: string | null = existingInvoice?.invoiceNumber ?? null;
    const sessionCustomerId =
      typeof session.customer === 'string' ? session.customer : null;
    const nextStripeCustomerId = sessionCustomerId ?? billing.stripeCustomerId;

    if (!existingInvoice) {
      const paidAt = new Date();
      const invoice = this.buildInvoice({
        transactionUuid: session.id,
        amountNpr: PRO_PRICE_NPR,
        planFrom: alreadyPro ? UserPlan.PRO : UserPlan.FREE,
        planTo: UserPlan.PRO,
        paidAt,
      });

      invoiceNumber = invoice.invoiceNumber;
      await this.userService.updateUserRaw(user.id, {
        plan: UserPlan.PRO,
        billing: {
          autoRenew: billing.autoRenew,
          stripeCustomerId: nextStripeCustomerId,
          invoices: [invoice, ...billing.invoices].slice(0, 100),
          updatedAt: paidAt,
        },
      } as Partial<TUser>);
    } else if (!alreadyPro || nextStripeCustomerId !== billing.stripeCustomerId) {
      await this.userService.updateUserRaw(user.id, {
        plan: UserPlan.PRO,
        billing: {
          autoRenew: billing.autoRenew,
          stripeCustomerId: nextStripeCustomerId,
          invoices: billing.invoices,
          updatedAt: new Date(),
        },
      } as Partial<TUser>);
    }

    return {
      plan: UserPlan.PRO,
      unlocked: !alreadyPro,
      sessionId: session.id,
      invoiceNumber,
      amountNpr: PRO_PRICE_NPR,
      currency: 'NPR' as const,
    };
  }

  async getBillingSummary(userId: string) {
    const user = await this.userService.getUserByIdRaw(userId);
    const isBillingEligible = this.isBillingEligibleRole(user.role);
    const billing = this.normalizeBilling(
      (user as unknown as { billing?: unknown }).billing,
    );

    if (!isBillingEligible) {
      return {
        currentPlan: UserPlan.PRO,
        currentPlanLabel: `${this.getRoleLabel(user.role)} access`,
        currentPlanPriceNpr: 0,
        nextPlan: null,
        nextPlanLabel: null,
        nextPlanPriceNpr: null,
        canUpgrade: false,
        currency: 'NPR' as const,
        usage: {
          month: this.getCurrentMonthStamp(),
          interviewsUsed: 0,
          interviewsRemaining: null,
        },
        limits: {
          monthlyInterviewLimit: null,
        },
        plans: [
          {
            id: UserPlan.FREE,
            label: 'Free',
            monthlyPriceNpr: 0,
            monthlyInterviewLimit: FREE_MONTHLY_INTERVIEW_LIMIT,
          },
          {
            id: UserPlan.PRO,
            label: 'Pro',
            monthlyPriceNpr: PRO_PRICE_NPR,
            monthlyInterviewLimit: null,
          },
        ],
        invoices: [],
      };
    }

    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const interviewsUsed =
      await this.interviewSessionRepository.countByUserAndCreatedBetween({
        userId,
        start: monthStart,
        end: monthEnd,
      });

    const isPro = user.plan === UserPlan.PRO;
    const currentPlan = isPro ? UserPlan.PRO : UserPlan.FREE;
    const interviewsRemaining = isPro
      ? null
      : Math.max(FREE_MONTHLY_INTERVIEW_LIMIT - interviewsUsed, 0);

    const invoices = [...billing.invoices]
      .sort((left, right) => right.issuedAt.getTime() - left.issuedAt.getTime())
      .slice(0, 50)
      .map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        transactionUuid: invoice.transactionUuid,
        amountNpr: invoice.amountNpr,
        currency: invoice.currency,
        paymentProvider: invoice.paymentProvider,
        status: invoice.status,
        planFrom: invoice.planFrom,
        planTo: invoice.planTo,
        issuedAt: invoice.issuedAt.toISOString(),
        paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
      }));

    return {
      currentPlan,
      currentPlanLabel: isPro ? 'Pro' : 'Free',
      currentPlanPriceNpr: isPro ? PRO_PRICE_NPR : 0,
      nextPlan: isPro ? null : UserPlan.PRO,
      nextPlanLabel: isPro ? null : 'Pro',
      nextPlanPriceNpr: isPro ? null : PRO_PRICE_NPR,
      canUpgrade: !isPro,
      currency: 'NPR' as const,
      usage: {
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        interviewsUsed,
        interviewsRemaining,
      },
      limits: {
        monthlyInterviewLimit: isPro ? null : FREE_MONTHLY_INTERVIEW_LIMIT,
      },
      plans: [
        {
          id: UserPlan.FREE,
          label: 'Free',
          monthlyPriceNpr: 0,
          monthlyInterviewLimit: FREE_MONTHLY_INTERVIEW_LIMIT,
        },
        {
          id: UserPlan.PRO,
          label: 'Pro',
          monthlyPriceNpr: PRO_PRICE_NPR,
          monthlyInterviewLimit: null,
        },
      ],
      invoices,
    };
  }

  private isBillingEligibleRole(role: unknown): role is UserRole {
    return BILLING_ELIGIBLE_ROLES.includes(role as UserRole);
  }

  private assertBillingEligibleRole(role: unknown) {
    if (this.isBillingEligibleRole(role)) {
      return;
    }

    throw new ApiError({
      statusCode: HttpStatus.BAD_REQUEST,
      message: PAYMENT_MESSAGES.BILLING_NOT_REQUIRED_FOR_ROLE,
    });
  }

  private getRoleLabel(role: unknown) {
    if (role === UserRole.ADMIN) return 'Admin';
    if (role === UserRole.RECRUITER) return 'Recruiter';
    if (role === UserRole.COLLEGE) return 'College';
    return 'Member';
  }

  private getCurrentMonthStamp() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private getStripeClient() {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'STRIPE_SECRET_KEY is missing.',
      });
    }

    this.stripeClient = new Stripe(secretKey);
    return this.stripeClient;
  }

  private async getOrCreateStripeCustomer(userId: string) {
    const stripe = this.getStripeClient();
    const user = await this.userService.getUserByIdRaw(userId);
    const billing = this.normalizeBilling(
      (user as unknown as { billing?: unknown }).billing,
    );

    if (billing.stripeCustomerId) {
      try {
        const existing = await stripe.customers.retrieve(billing.stripeCustomerId);
        if (!('deleted' in existing && existing.deleted)) {
          return existing.id;
        }
      } catch {
        // create a new customer when stored id is invalid/deleted
      }
    }

    const createdCustomer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: {
        userId: user.id,
      },
    });

    await this.userService.updateUserRaw(user.id, {
      billing: {
        autoRenew: billing.autoRenew,
        stripeCustomerId: createdCustomer.id,
        invoices: billing.invoices,
        updatedAt: new Date(),
      },
    } as Partial<TUser>);

    return createdCustomer.id;
  }

  private normalizePath(path: string | undefined, fallback: string) {
    const value = (path ?? fallback).trim();
    if (!value.startsWith('/') || value.startsWith('//')) {
      return fallback;
    }
    return value;
  }

  private buildInvoice(input: {
    transactionUuid: string;
    amountNpr: number;
    planFrom: UserPlan;
    planTo: UserPlan;
    paidAt: Date;
  }): TInvoiceRecord {
    return {
      id: randomUUID(),
      invoiceNumber: this.generateInvoiceNumber(input.paidAt),
      transactionUuid: input.transactionUuid,
      amountNpr: input.amountNpr,
      currency: 'NPR',
      paymentProvider: 'stripe',
      status: 'paid',
      planFrom: input.planFrom,
      planTo: input.planTo,
      issuedAt: input.paidAt,
      paidAt: input.paidAt,
    };
  }

  private normalizeBilling(raw: unknown): TUserBilling {
    if (!raw || typeof raw !== 'object') {
      return {
        autoRenew: false,
        stripeCustomerId: null,
        invoices: [],
        updatedAt: null,
      };
    }

    const data = raw as Record<string, unknown>;
    const invoices = Array.isArray(data.invoices)
      ? data.invoices
          .map((entry) => this.normalizeInvoice(entry))
          .filter((entry): entry is TInvoiceRecord => Boolean(entry))
      : [];

    return {
      autoRenew: data.autoRenew === true,
      stripeCustomerId:
        typeof data.stripeCustomerId === 'string' && data.stripeCustomerId.trim()
          ? data.stripeCustomerId.trim()
          : null,
      invoices,
      updatedAt: this.toDate(data.updatedAt),
    };
  }

  private normalizeInvoice(raw: unknown): TInvoiceRecord | null {
    if (!raw || typeof raw !== 'object') return null;
    const data = raw as Record<string, unknown>;
    const issuedAt = this.toDate(data.issuedAt);
    if (!issuedAt) return null;

    const planFrom = data.planFrom === UserPlan.PRO ? UserPlan.PRO : UserPlan.FREE;
    const planTo = data.planTo === UserPlan.PRO ? UserPlan.PRO : UserPlan.FREE;
    const amountNpr = Number(data.amountNpr);
    if (!Number.isFinite(amountNpr) || amountNpr < 0) return null;

    const invoiceNumber =
      typeof data.invoiceNumber === 'string' && data.invoiceNumber.trim()
        ? data.invoiceNumber.trim()
        : null;
    const transactionUuid =
      typeof data.transactionUuid === 'string' && data.transactionUuid.trim()
        ? data.transactionUuid.trim()
        : null;
    const id =
      typeof data.id === 'string' && data.id.trim() ? data.id.trim() : null;

    if (!invoiceNumber || !transactionUuid || !id) return null;

    return {
      id,
      invoiceNumber,
      transactionUuid,
      amountNpr,
      currency: 'NPR',
      paymentProvider: data.paymentProvider === 'esewa' ? 'esewa' : 'stripe',
      status: this.resolveInvoiceStatus(data.status),
      planFrom,
      planTo,
      issuedAt,
      paidAt: this.toDate(data.paidAt),
    };
  }

  private resolveInvoiceStatus(value: unknown): TInvoiceStatus {
    if (value === 'failed') return 'failed';
    if (value === 'refunded') return 'refunded';
    return 'paid';
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  }

  private generateInvoiceNumber(date: Date) {
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `INV-${stamp}-${suffix}`;
  }

  private getFrontendDomain() {
    return (
      this.configService.get(CONFIG_KEYS.APP.FRONTEND_DOMAIN, {
        infer: true,
      }) ??
      process.env.FRONTEND_DOMAIN ??
      'http://localhost:3001'
    ).replace(/\/+$/, '');
  }
}
