import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import z from 'zod';
import { ApiError } from 'src/common/errors/api-error';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { asyncHandler } from 'src/common/utils/async-handler';
import { PAYMENT_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import {
  CreateStripePortalSessionDTO,
  CreateStripeCheckoutSessionDTO,
  TCreateStripePortalSessionDTO,
  TCreateStripeCheckoutSessionDTO,
  TVerifyStripeCheckoutSessionDTO,
  VerifyStripeCheckoutSessionDTO,
} from 'src/dtos/payments/stripe-payment.dto';
import { PaymentService } from 'src/services/payment.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';

@ApiTags('Payment')
@Controller({
  path: ROUTES.PAYMENT.BASE,
  version: '1',
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post(ROUTES.PAYMENT.STRIPE_CHECKOUT_SESSION)
  @ApiOperation({
    summary: 'Create Stripe checkout session',
    description:
      'Creates a hosted Stripe checkout session to upgrade current user from Free to Pro.',
  })
  @HttpCode(HttpStatus.OK)
  async createStripeCheckoutSession(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TCreateStripeCheckoutSessionDTO,
  ) {
    return asyncHandler(async () => {
      const parsedPayload = CreateStripeCheckoutSessionDTO.safeParse(payload ?? {});
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.paymentService.createStripeCheckoutSession(
        request.user.id,
        parsedPayload.data,
      );
      return buildSuccessResponse(
        data,
        PAYMENT_MESSAGES.STRIPE_CHECKOUT_SESSION_CREATED,
      );
    });
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post(ROUTES.PAYMENT.STRIPE_PORTAL_SESSION)
  @ApiOperation({
    summary: 'Create Stripe billing portal session',
    description:
      'Creates a hosted Stripe customer portal session for billing management.',
  })
  @HttpCode(HttpStatus.OK)
  async createStripePortalSession(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TCreateStripePortalSessionDTO,
  ) {
    return asyncHandler(async () => {
      const parsedPayload = CreateStripePortalSessionDTO.safeParse(payload ?? {});
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.paymentService.createStripePortalSession(
        request.user.id,
        parsedPayload.data,
      );
      return buildSuccessResponse(
        data,
        PAYMENT_MESSAGES.STRIPE_PORTAL_SESSION_CREATED,
      );
    });
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post(ROUTES.PAYMENT.STRIPE_VERIFY_SESSION)
  @ApiOperation({
    summary: 'Verify Stripe checkout session',
    description:
      'Verifies successful Stripe checkout session and unlocks Pro plan for current user.',
  })
  @HttpCode(HttpStatus.OK)
  async verifyStripeCheckoutSession(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TVerifyStripeCheckoutSessionDTO,
  ) {
    return asyncHandler(async () => {
      const parsedPayload = VerifyStripeCheckoutSessionDTO.safeParse(payload);
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.paymentService.verifyStripeCheckoutSession(
        request.user.id,
        parsedPayload.data.sessionId,
      );
      return buildSuccessResponse(data, PAYMENT_MESSAGES.STRIPE_SESSION_VERIFIED);
    });
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get(ROUTES.PAYMENT.BILLING_SUMMARY)
  @ApiOperation({
    summary: 'Get billing summary',
    description:
      'Returns current plan, interview usage, remaining limits and invoice history.',
  })
  @HttpCode(HttpStatus.OK)
  async getBillingSummary(@Request() request: { user: TAuthenticatedUser }) {
    return asyncHandler(async () => {
      const data = await this.paymentService.getBillingSummary(request.user.id);
      return buildSuccessResponse(data, PAYMENT_MESSAGES.BILLING_SUMMARY_FETCHED);
    });
  }
}
