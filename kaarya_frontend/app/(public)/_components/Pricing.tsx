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
  features,
  featured = false,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  href: string;
  features: Array<string>;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl p-8 transition-all duration-300",
        featured
          ? "bg-linear-to-br from-primary via-blue-600 to-indigo-600 shadow-2xl shadow-primary/20 lg:scale-105"
          : "border border-slate-700/50 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/60"
      )}
    >
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold text-primary shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      <div>
        <h3
          className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            featured ? "text-blue-100" : "text-slate-400"
          )}
        >
          {name}
        </h3>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight text-white">
            {price}
          </span>
          {period && (
            <span
              className={cn(
                "text-sm",
                featured ? "text-blue-200" : "text-slate-500"
              )}
            >
              {period}
            </span>
          )}
        </div>

        <p
          className={cn(
            "mt-4 text-sm leading-relaxed",
            featured ? "text-blue-100" : "text-slate-400"
          )}
        >
          {description}
        </p>
      </div>

      <div
        className={cn(
          "my-8 h-px",
          featured ? "bg-white/20" : "bg-slate-700/50"
        )}
      />

      <ul role="list" className="flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <CheckIcon
              className={cn(
                "mt-0.5",
                featured ? "text-blue-200" : "text-primary"
              )}
            />
            <span
              className={cn(
                "text-sm",
                featured ? "text-white" : "text-slate-300"
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
            ? "bg-white text-primary shadow-md hover:bg-slate-100"
            : "border border-slate-600 bg-transparent text-white hover:border-primary/60 hover:bg-primary/10"
        )}
      >
        <Link href={href}>
          {featured ? "Get started" : "Start free"}
        </Link>
      </Button>
    </div>
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className="relative overflow-hidden bg-slate-900 py-20 sm:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,130,255,0.08)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-slate-700/50 to-transparent" />

      <Container className="relative">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Simple pricing,{" "}
            <span className="text-slate-400">for everyone.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Whether you&apos;re a job seeker, recruiter, or institution — there&apos;s
            a plan that fits your needs.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-start gap-6 lg:max-w-none lg:grid-cols-3">
          <Plan
            name="Starter"
            price="Free"
            description="Perfect for job seekers just getting started with their career search."
            href="/sign-up"
            features={[
              "AI-powered resume builder",
              "Up to 3 resume versions",
              "Basic job matching",
              "Public portfolio page",
              "Interview prep (5 sessions/month)",
            ]}
          />

          <Plan
            featured
            name="Pro"
            price="$12"
            period="/month"
            description="For serious job seekers who want every advantage in their search."
            href="/sign-up"
            features={[
              "Unlimited resume versions",
              "Advanced AI job matching",
              "Unlimited interview prep",
              "Skill gap analysis",
              "Priority support",
              "Custom portfolio themes",
              "Application tracking dashboard",
            ]}
          />

          <Plan
            name="Enterprise"
            price="$39"
            period="/month"
            description="For recruiters, companies, and institutions managing talent at scale."
            href="/sign-up"
            features={[
              "Everything in Pro",
              "Team workspace management",
              "Bulk candidate screening",
              "Custom branding",
              "API access",
              "Dedicated account manager",
            ]}
          />
        </div>
      </Container>
    </section>
  );
}
