"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileHeader() {
  return (
    <div className="flex items-center gap-4">
      <Link href="/overview">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Link>

      <h1 className="text-2xl font-semibold">Profile Settings</h1>
    </div>
  );
}
