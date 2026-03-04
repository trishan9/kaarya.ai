import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "./Container";

function CheckIcon({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-5 w-5 flex-none", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Plan({
  name,
  price,
  period,
  description,
  href,
  ctaLabel,
  features,
  featured = false,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  href: string;
  ctaLabel: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl p-8 transition-all duration-300",
        featured
          ? "bg-linear-to-br from-primary via-blue-600 to-sky-600 shadow-2xl shadow-primary/20 lg:scale-105"
          : "border border-slate-700/50 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/60",
      )}
    >
      {featured ? (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold text-primary">
            Current Upgrade
          </span>
        </div>
      ) : null}

      <div>
        <h3
          className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            featured ? "text-blue-100" : "text-slate-400",
          )}
        >
          {name}
        </h3>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight text-white">
            {price}
          </span>
          {period ? (
            <span
              className={cn(
                "text-sm",
                featured ? "text-blue-200" : "text-slate-500",
              )}
            >
              {period}
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            "mt-4 text-sm leading-relaxed",
            featured ? "text-blue-100" : "text-slate-400",
          )}
        >
          {description}
        </p>
      </div>

      <div
        className={cn(
          "my-8 h-px",
          featured ? "bg-white/20" : "bg-slate-700/50",
        )}
      />

      <ul role="list" className="flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <CheckIcon
              className={cn(
                "mt-0.5",
                featured ? "text-blue-200" : "text-primary",
              )}
            />
            <span
              className={cn(
                "text-sm",
                featured ? "text-white" : "text-slate-300",
              )}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        size="lg"
        className={cn(
          "mt-8 w-full text-sm font-semibold",
          featured
            ? "bg-white text-primary hover:bg-slate-100"
            : "border border-slate-600 bg-transparent text-white hover:border-primary/60 hover:bg-primary/10",
        )}
      >
        <Link href={href}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}

export function Pricing({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className="relative overflow-hidden bg-slate-900 py-20 sm:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,130,255,0.08)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-slate-700/50 to-transparent" />

      <Container className="relative">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Pricing built for the current product.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Candidates can stay on Free or upgrade to Pro with Stripe. Recruiter
            and college accounts currently get full workspace access without a
            separate Pro payment.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-start gap-6 lg:max-w-none lg:grid-cols-3">
          <Plan
            name="Free"
            price="NPR 0"
            description="For candidates getting started with resumes, job discovery, and limited interview practice."
            href="/sign-up"
            ctaLabel="Start free"
            features={[
              "AI resume builder",
              "Job exploration and saved jobs",
              "Career dashboard and profile tracking",
              "Up to 5 interview sessions per month",
            ]}
          />

          <Plan
            featured
            name="Pro"
            price="NPR 1,499"
            period="/month"
            description="Unlock unlimited mock interview practice and upgrade your candidate workflow with Stripe-managed billing."
            href={isLoggedIn ? "/payment/checkout" : "/sign-up"}
            ctaLabel={isLoggedIn ? "Upgrade to Pro" : "Start with Pro"}
            features={[
              "Everything in Free",
              "Unlimited interview sessions",
              "Priority AI feedback flow",
              "Stripe billing portal and invoices",
            ]}
          />

          <Plan
            name="Recruiter and College"
            price="Included"
            description="Recruiters and colleges currently use the platform with full workspace capabilities after account setup."
            href="/sign-up"
            ctaLabel="Create workspace"
            features={[
              "Post and manage jobs",
              "Track applicants and interviews",
              "Dedicated workspace access",
              "No separate Pro billing required right now",
            ]}
          />
        </div>
      </Container>
    </section>
  );
}
