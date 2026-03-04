import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "./Container";

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,130,255,0.08)_0%,transparent_100%)]" />

      <div className="pointer-events-none absolute left-0 top-0 hidden w-80 lg:block">
        <div className="absolute -left-12 top-20 h-64 w-64 rounded-full bg-primary/[0.04] blur-2xl" />
        <div className="absolute -left-16 top-28 h-48 w-48 rounded-full border border-primary/[0.06]" />
        <div className="absolute left-32 top-20 h-2.5 w-2.5 rounded-full bg-primary/15" />
        <div className="absolute left-14 top-80 h-16 w-16 rounded-full border border-dashed border-slate-200/70" />
        <div className="absolute left-44 top-56 h-1.5 w-1.5 rounded-full bg-slate-300/80" />
        <div className="absolute left-48 top-60 h-1 w-1 rounded-full bg-slate-300/50" />
        <div className="absolute left-42 top-62 h-1 w-1 rounded-full bg-slate-300/50" />
        <svg className="absolute left-2 top-[400px] text-slate-200/80" width="140" height="60" fill="none">
          <path d="M0 30Q35 0 70 30T140 30" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute left-36 top-[340px] text-primary/10" width="16" height="16" fill="none">
          <path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="pointer-events-none absolute right-0 top-0 hidden w-80 lg:block">
        <div className="absolute -right-12 top-32 h-56 w-56 rounded-full bg-blue-400/[0.04] blur-2xl" />
        <div className="absolute -right-12 top-36 h-40 w-40 rounded-full border border-blue-400/[0.06]" />
        <div className="absolute right-36 top-24 h-3 w-3 rounded-full bg-primary/10" />
        <div className="absolute right-20 top-[340px] h-14 w-14 rounded-full border border-dashed border-slate-200/70" />
        <div className="absolute right-48 top-64 h-1.5 w-1.5 rounded-full bg-slate-300/80" />
        <div className="absolute right-52 top-68 h-1 w-1 rounded-full bg-slate-300/50" />
        <svg className="absolute right-2 top-[440px] text-slate-200/80" width="140" height="60" fill="none">
          <path d="M0 30Q35 60 70 30T140 30" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="absolute right-40 top-[290px] text-primary/10" width="14" height="14" fill="none">
          <path d="M7 0L14 7L7 14L0 7Z" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

      <Container className="relative pb-24 pt-20 text-center lg:pt-32">
        <h1 className="animate-fade-in-up mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
          Your career,{" "}
          <span className="relative whitespace-nowrap">
            <svg
              aria-hidden="true"
              viewBox="0 0 418 42"
              className="absolute left-0 top-2/3 h-[0.58em] w-full fill-primary/15"
              preserveAspectRatio="none"
            >
              <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
            </svg>
            <span className="relative text-primary">powered by AI,</span>
          </span>{" "}
          managed by Kaarya.
        </h1>

        <p className="animate-fade-in-up animation-delay-150 mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-500">
          Candidates start free, unlock Pro for unlimited interview practice,
          and recruiters or colleges get full platform access in their own
          workspaces.
        </p>

        <div className="animate-fade-in-up animation-delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="group px-8 text-base">
            <Link href="/sign-up">
              Get started free
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
            <Link href="#pricing">See pricing</Link>
          </Button>
        </div>

        <div className="animate-fade-in animation-delay-500 mx-auto mt-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Trusted by candidates, recruiters, and colleges
          </span>
          {["Google", "Microsoft", "Amazon", "Infosys", "TCS"].map((company) => (
            <span
              key={company}
              className="text-base font-semibold text-slate-300 transition-colors duration-200 hover:text-slate-400"
            >
              {company}
            </span>
          ))}
        </div>

        <div className="animate-fade-in-up animation-delay-700 relative mx-auto mt-16 max-w-5xl">
          <div className="absolute -inset-x-8 -top-8 bottom-0 rounded-3xl bg-linear-to-b from-primary/6 to-transparent" />
          <div className="relative overflow-hidden rounded-xl border border-slate-200/60 shadow-xl shadow-slate-900/5">
            <Image
              src="/Overview.png"
              alt="Kaarya dashboard overview"
              width={1920}
              height={1080}
              unoptimized
              className="w-full"
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-white to-transparent" />
          </div>
        </div>
      </Container>
    </div>
  );
}
