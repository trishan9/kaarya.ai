"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TipsCardProps = {
  title: string;
  description: string;
};

export function TipsCard({ title, description }: TipsCardProps) {
  const router = useRouter();

  return (
    <Card className="gap-4 border-0 bg-[#0b67c2] p-5 text-white shadow-sm">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold leading-tight">
          {title}
          <Sparkles className="ml-2 inline h-4 w-4 text-yellow-200" />
        </h3>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <ArrowUpRight className="h-4 w-4" />
              <span className="sr-only">Open tips actions</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="h-9 w-full justify-start text-sm"
                onClick={() => router.push("/resources")}
              >
                Read curated tips
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-full justify-start text-sm"
                onClick={() => router.push("/blogs")}
              >
                Explore blogs
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-xs text-white/80">{description}</p>
    </Card>
  );
}
