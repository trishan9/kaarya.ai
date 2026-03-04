import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "./Container";

export function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(99,130,255,0.06)_0%,transparent_100%)]" />

      <Container className="relative text-center">
        <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Ready to move faster with{" "}
          <span className="text-primary">Kaarya.ai</span>?
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
          Start on Free as a candidate, upgrade to Pro when you need unlimited
          interview practice, or create a recruiter or college workspace with
          the current full-access model.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="group px-8 text-base">
            <Link href="/sign-up">
              Get started
              <svg
                className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link href="#pricing">View pricing</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
