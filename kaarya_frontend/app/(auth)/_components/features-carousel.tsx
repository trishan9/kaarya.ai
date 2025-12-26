"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const AUTOPLAY_INTERVAL = 5500;

const FEATURES = [
  {
    title: "Find Your Perfect Job Match",
    description:
      "Our dashboard streamlines your career journey with personalized job recommendations, AI-powered mock interviews, intelligent resume creation and evaluation, and more to help you stand out with confidence.",
    image: "/Overview.png",
    alt: "Dashboard showing personalized job matches and insights",
  },
  {
    title: "AI-Powered Mock Interviews",
    description:
      "Simulate real interviews, get instant feedback, and track readiness with every practice session.",
    image: "/Interviews.png",
    alt: "Mock interview session with live feedback",
  },
  {
    title: "Intelligent Resume Builder",
    description:
      "Curate bullet points, tailor keywords, and export polished resumes crafted for each application.",
    image: "/Resume.png",
    alt: "Resume builder with tailored recommendations",
  },
];

export function FeatureCarousel() {
  const [index, setIndex] = useState(0);
  const currentFeature = FEATURES[index];

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % FEATURES.length),
      AUTOPLAY_INTERVAL
    );

    return () => clearInterval(timer);
  }, [index]);

  return (
    <div className="relative overflow-hidden px-8 py-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -left-6 h-48 w-48 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(59,130,246,0.12) 1px, transparent 1px), linear-gradient(0deg, rgba(59,130,246,0.12) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 text-primary/10"
        animate={{ rotate: 6 }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
      >
        <Sparkles className="h-full w-full" />
      </motion.div>

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Product Highlights
            </span>
            <div className="h-px flex-1 bg-linear-to-r from-primary/30 via-muted to-transparent" />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            {FEATURES.map((feature, i) => (
              <motion.button
                key={feature.title}
                onClick={() => setIndex(i)}
                whileHover={{ y: -1, scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                className={`group flex-1 rounded-lg border px-3 py-2 text-left transition-colors ${
                  i === index
                    ? "border-primary/40 bg-white shadow-sm"
                    : "border-transparent bg-muted/30 hover:border-primary/30"
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                  <span className={i === index ? "text-primary" : undefined}>
                    {feature.title}
                  </span>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  {i === index ? (
                    <motion.div
                      className="h-full w-full rounded-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: AUTOPLAY_INTERVAL / 1000,
                        ease: "linear",
                      }}
                    />
                  ) : i < index ? (
                    <div className="h-full w-full rounded-full bg-primary/50" />
                  ) : (
                    <div className="h-full w-full rounded-full bg-muted" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="md:pr-4"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                {currentFeature.title}
              </h2>
              <p className="text-lg leading-relaxed text-slate-700">
                {currentFeature.description}
              </p>
            </motion.div>

            <Image
              src={currentFeature.image}
              alt={currentFeature.alt}
              width={1920}
              height={1080}
              className="w-full object-cover self-end rounded-3xl"
              priority={index === 0}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
