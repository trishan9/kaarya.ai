"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

const features = [
  {
    title: "Dashboard Overview",
    description:
      "Get a bird's-eye view of your career progress — track applications, upcoming interviews, profile strength, and personalized recommendations all in one place.",
    image: "/Overview.png",
  },
  {
    title: "AI Resume Builder",
    description:
      "Generate ATS-optimized resumes tailored to specific job descriptions. Our AI analyzes your experience and crafts compelling resumes that get you noticed.",
    image: "/Resume.png",
  },
  {
    title: "Smart Interview Prep",
    description:
      "Practice with AI-powered mock interviews customized to your target role and company. Get real-time feedback on your answers and improve with each session.",
    image: "/Interviews.png",
  },
];

export function PrimaryFeatures() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <section
      id="features"
      aria-label="Features for accelerating your career"
      className="relative overflow-hidden bg-linear-to-br from-slate-900 via-primary to-blue-600 pb-28 pt-20 sm:py-32"
    >
      {/* Subtle noise texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />

      <Container className="relative">
        <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
          <h2 className="text-3xl font-medium text-white sm:text-4xl md:text-5xl">
            Everything you need to land your dream role.
          </h2>

          <p className="mt-6 text-lg tracking-tight text-white/70">
            AI-powered tools that work together to give you an unfair advantage
            in your job search.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 items-center gap-y-2 pt-10 sm:gap-y-6 md:mt-20 lg:grid-cols-12 lg:pt-0">
          <div className="-mx-4 flex overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0 lg:col-span-5">
            <div className="relative z-10 flex gap-x-4 whitespace-nowrap px-4 sm:mx-auto sm:px-0 lg:mx-0 lg:block lg:gap-x-0 lg:gap-y-1 lg:whitespace-normal">
              {features.map((feature, featureIndex) => (
                <div
                  key={feature.title}
                  className={cn(
                    "group relative cursor-pointer rounded-full px-4 py-1 transition-all duration-300 lg:rounded-l-xl lg:rounded-r-none lg:p-6",
                    selectedIndex === featureIndex
                      ? "bg-white/10 shadow-lg shadow-black/10 ring-1 ring-inset ring-white/15 backdrop-blur-sm lg:bg-white/10"
                      : "hover:bg-white/5"
                  )}
                  onClick={() => setSelectedIndex(featureIndex)}
                >
                  <h3>
                    <button
                      className={cn(
                        "text-lg font-medium transition-colors duration-200 focus:outline-none",
                        selectedIndex === featureIndex
                          ? "text-white"
                          : "text-white/60 hover:text-white/90"
                      )}
                    >
                      <span className="absolute inset-0 rounded-full lg:rounded-l-xl lg:rounded-r-none" />
                      {feature.title}
                    </button>
                  </h3>

                  <p
                    className={cn(
                      "mt-2 hidden text-sm transition-colors duration-200 lg:block lg:text-[15px]",
                      selectedIndex === featureIndex
                        ? "text-white/90"
                        : "text-white/40 group-hover:text-white/60"
                    )}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            {features.map((feature, featureIndex) => (
              <div
                key={feature.title}
                className={cn(
                  "transition-all duration-500",
                  selectedIndex === featureIndex
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none absolute opacity-0 translate-y-4"
                )}
              >
                <div className="relative sm:px-6 lg:hidden">
                  <div className="absolute -inset-x-4 bottom-[-4.25rem] top-[-6.5rem] bg-white/5 ring-1 ring-inset ring-white/10 sm:inset-x-0 sm:rounded-t-xl" />
                  <p className="relative mx-auto max-w-2xl text-base text-white/80 sm:text-center">
                    {feature.description}
                  </p>
                </div>

                <div className="group/img relative mt-10 w-[45rem] overflow-hidden rounded-xl bg-slate-50 shadow-2xl shadow-black/30 sm:w-auto lg:mt-0 lg:w-[67.8125rem]">
                  <Image
                    className="w-full transition-transform duration-700 group-hover/img:scale-[1.02]"
                    src={feature.image}
                    alt={feature.title}
                    width={1920}
                    height={1080}
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 68vw"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
