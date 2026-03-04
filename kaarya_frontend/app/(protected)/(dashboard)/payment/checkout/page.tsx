import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  getBillingSummary,
  verifyStripeCheckoutSession,
} from "@/lib/actions/payment-actions";
import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";
import { DashboardHeader } from "../../_components/dashboard-header";
import { HeaderBackButton } from "../../_components/header-back-button";
import { StripeCheckoutButton } from "../_components/stripe-checkout-button";
import { StripePortalButton } from "../_components/stripe-portal-button";

export const metadata: Metadata = {
  title: "Billing | Kaarya.ai",
  description: "Manage your Kaarya billing with Stripe checkout and portal.",
};

const BILLING_ELIGIBLE_ROLES = new Set<Role>([Role.USER, Role.STUDENT, Role.FACULTY]);
const ROLE_LABEL: Record<Role, string> = {
  [Role.ADMIN]: "Admin",
  [Role.RECRUITER]: "Recruiter",
  [Role.COLLEGE]: "College",
  [Role.USER]: "User",
  [Role.STUDENT]: "Student",
  [Role.FACULTY]: "Faculty",
};

const formatNpr = (value: number) => `NPR ${value.toLocaleString("en-NP")}`;

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function PaymentCheckoutPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const params = await searchParams;
  const sessionId = getFirstParam(params.session_id);
  const cancelReason = getFirstParam(params.reason);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const isBillingEligible = BILLING_ELIGIBLE_ROLES.has(user.role);
  const roleLabel = ROLE_LABEL[user.role] ?? "Member";

  const verification =
    isBillingEligible && sessionId
      ? await verifyStripeCheckoutSession(sessionId)
      : null;
  const billingResponse = isBillingEligible ? await getBillingSummary() : null;
  const billing = billingResponse?.success ? billingResponse.data : null;

  const isPro = (billing?.currentPlan ?? user.plan ?? "free") === "pro";
  const currentPlanLabel = isPro ? "Pro" : "Free";
  const currentPrice = billing?.currentPlanPriceNpr ?? (isPro ? 1499 : 0);
  const canUpgrade = isBillingEligible ? (billing?.canUpgrade ?? !isPro) : false;
  const upgradePrice = billing?.nextPlanPriceNpr ?? 1499;
  const usage = billing?.usage;
  const monthlyInterviewLimit = billing?.limits?.monthlyInterviewLimit;
  const interviewsUsed = usage?.interviewsUsed ?? 0;
  const usagePercentage = monthlyInterviewLimit
    ? Math.min(Math.round((interviewsUsed / monthlyInterviewLimit) * 100), 100)
    : 100;
  const verificationSucceeded = Boolean(verification?.success);
  const verificationFailed = Boolean(sessionId && verification && !verification.success);
  const paymentCancelled = Boolean(!sessionId && cancelReason);

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader
          title="Billing"
          leadingAction={(
            <div className="flex items-center gap-3">
              <SidebarTrigger className="border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent" />
              <HeaderBackButton fallbackHref="/overview" label="Back" />
            </div>
          )}
          hideSidebarTrigger
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#00629F]/80 to-[#00629F] px-4 py-8 text-white sm:px-8">
            <div className="pointer-events-none absolute left-0 bottom-0 h-10 w-72 rounded-tr-2xl bg-white/10" />
            <div className="pointer-events-none absolute right-0 top-0 h-12 w-48 rounded-bl-2xl rounded-tr-2xl bg-white/10" />
            <div className="pointer-events-none absolute right-0 top-0 h-22 w-32 rounded-tr-2xl rounded-bl-2xl bg-white/10" />

            <div className="relative z-10 space-y-5">
              <div className="max-w-3xl space-y-2">
                <h2 className="text-2xl font-semibold leading-tight">
                  {isBillingEligible
                    ? isPro
                      ? "Manage your Pro billing in Stripe"
                      : "Upgrade to Pro with Stripe"
                    : `${roleLabel} accounts have full access`}
                </h2>
                <p className="max-w-2xl text-sm text-white/90">
                  {isBillingEligible
                    ? "Use one place to upgrade, manage billing, and view invoices via Stripe portal."
                    : "Billing upgrade is not required for this role in the current release."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                  <div className="text-xs text-white/80">Account</div>
                  <div className="text-xl font-semibold leading-tight">
                    {isBillingEligible ? currentPlanLabel : roleLabel}
                  </div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                  <div className="text-xs text-white/80">Monthly Price</div>
                  <div className="text-xl font-semibold leading-tight">
                    {isBillingEligible ? formatNpr(currentPrice) : "NPR 0"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                  <div className="text-xs text-white/80">Usage Month</div>
                  <div className="text-xl font-semibold leading-tight">
                    {usage?.month ?? "Current"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                  <div className="text-xs text-white/80">Interviews Used</div>
                  <div className="text-xl font-semibold leading-tight">
                    {isBillingEligible ? interviewsUsed : "Unlimited"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {verificationSucceeded ? (
            <Card className="border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-500/10">
              <CardContent className="px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                Payment verified. Pro plan is active now.
                {verification?.data?.invoiceNumber
                  ? ` Invoice: ${verification.data.invoiceNumber}`
                  : ""}
              </CardContent>
            </Card>
          ) : null}

          {verificationFailed ? (
            <Card className="border-amber-300/70 bg-amber-50/80 dark:border-amber-500/40 dark:bg-amber-500/10">
              <CardContent className="px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                Payment completed, but verification failed:{" "}
                {verification?.message ?? "Unknown error."}
              </CardContent>
            </Card>
          ) : null}

          {paymentCancelled ? (
            <Card className="border-border/70 bg-card">
              <CardContent className="px-4 py-3 text-sm text-muted-foreground">
                Stripe checkout was cancelled. No charge was applied.
              </CardContent>
            </Card>
          ) : null}

          {!isBillingEligible ? (
            <Card className="border-border/70 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Full Access Enabled
                </CardTitle>
                <CardDescription>
                  {roleLabel} accounts can use all currently available features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/overview">
                    Go to Overview
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/70 bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Plan Overview
                  </CardTitle>
                  <CardDescription>Current plan and monthly interview usage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Current Plan
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            isPro
                              ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                              : "border-border text-foreground"
                          }
                        >
                          {currentPlanLabel}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">
                          {formatNpr(currentPrice)} / month
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Upgrade
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {canUpgrade
                          ? `Pro - ${formatNpr(upgradePrice)} / month`
                          : "Already on highest tier"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-foreground">Interview usage this month</p>
                      <p className="text-muted-foreground">{usage?.month ?? "Current month"}</p>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {monthlyInterviewLimit
                        ? `${interviewsUsed} of ${monthlyInterviewLimit} used (${billing?.usage?.interviewsRemaining ?? 0} remaining)`
                        : `${interviewsUsed} used, unlimited on Pro`}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border px-4 py-3">
                    <p className="text-sm font-medium text-foreground">What Pro includes</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Unlimited interview sessions
                      </li>
                      <li className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Priority AI feedback flow
                      </li>
                      <li className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Stripe-hosted billing management
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card">
                <CardHeader>
                  <CardTitle>Billing Action</CardTitle>
                  <CardDescription>
                    {canUpgrade
                      ? "Complete checkout in Stripe."
                      : "Manage billing in Stripe customer portal."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 rounded-xl border border-border px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">
                        {canUpgrade ? formatNpr(upgradePrice) : "NPR 0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium text-foreground">NPR 0</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="text-lg font-semibold text-foreground">
                        {canUpgrade ? formatNpr(upgradePrice) : "NPR 0"}
                      </span>
                    </div>
                  </div>

                  {canUpgrade ? (
                    <StripeCheckoutButton disabled={!canUpgrade} />
                  ) : (
                    <StripePortalButton />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {isBillingEligible ? (
            <Card className="border-border/70 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5" />
                  Invoices In Stripe
                </CardTitle>
                <CardDescription>
                  Invoice history and downloadable bills are managed directly in Stripe portal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                  Open Stripe portal to view invoice history, download receipts, and manage payment methods.
                </div>
                <div className="max-w-sm">
                  <StripePortalButton />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
