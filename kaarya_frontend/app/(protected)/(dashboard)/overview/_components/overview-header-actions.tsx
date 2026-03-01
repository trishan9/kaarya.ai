"use client";

import * as React from "react";
import { Bell, CalendarDays, Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePreset = { label: string; value: string };

type LanguageOption = { label: string; code: string };

const datePresets: DatePreset[] = [
  { label: "December 2, 2025", value: "dec-2-2025" },
  { label: "Last 7 days", value: "last-7" },
  { label: "Last 30 days", value: "last-30" },
  { label: "This quarter", value: "quarter" },
];

const languageOptions: LanguageOption[] = [
  { label: "English", code: "EN" },
  { label: "Nepali", code: "NP" },
  { label: "Hindi", code: "HI" },
  { label: "Spanish", code: "ES" },
];

export function OverviewHeaderActions() {
  const router = useRouter();
  const [hasUnread, setHasUnread] = React.useState(true);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<DatePreset>(
    datePresets[0]
  );
  const [language, setLanguage] = React.useState<LanguageOption>(
    languageOptions[0]
  );

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative h-9 w-9 rounded-lg border-border bg-card text-muted-foreground hover:bg-accent"
          >
            <Bell className="h-4 w-4" />
            {hasUnread ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            ) : null}
            <span className="sr-only">Open notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => router.push("/notifications")}>
            View all notifications
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setHasUnread(false)}>
            Mark all as read
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => router.push("/settings/notifications")}
          >
            Notification settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 gap-2 rounded-lg border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {selectedDate.label}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Date range
            </p>
            <div className="space-y-1">
              {datePresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant="ghost"
                  className={cn(
                    "h-8 w-full justify-between rounded-md px-2 text-xs",
                    preset.value === selectedDate.value &&
                      "bg-muted text-foreground"
                  )}
                  onClick={() => {
                    setSelectedDate(preset);
                    setDateOpen(false);
                  }}
                >
                  {preset.label}
                  {preset.value === selectedDate.value ? (
                    <Check className="h-3 w-3" />
                  ) : null}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 gap-2 rounded-lg border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
              {language.code}
            </span>
            {language.label}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Language</DropdownMenuLabel>
          {languageOptions.map((option) => (
            <DropdownMenuItem
              key={option.code}
              onSelect={() => setLanguage(option)}
              className="flex items-center justify-between"
            >
              {option.label}
              {option.code === language.code ? (
                <Check className="h-4 w-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
