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
    <Card className="gap-4 border-0 bg-[#00629F] p-5 text-white shadow-sm">
      <div className="flex items-start justify-between">
        <h3 className="text-2xl leading-tight">
          {title}
          <Sparkles className="ml-2 inline h-4 w-4 text-yellow-200" />
        </h3>

        <button className="flex h-9 p-2 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/15">
          <ArrowUpRight className="size-5" />
        </button>
      </div>
      <p className="text-sm text-white/80">{description}</p>
    </Card>
  );
}
