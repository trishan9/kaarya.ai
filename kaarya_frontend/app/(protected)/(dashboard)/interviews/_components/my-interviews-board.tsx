"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MockInterviewRecommendationsCard,
  type MockInterviewRecommendationsCardProps,
} from "../../interview-hub/_components/mock-interview-recommendations-card";

export type CreateInterviewField = {
  id: string;
  label: string;
  placeholder: string;
  type?: "text" | "number";
  required?: boolean;
};

export type MyInterviewsBoardProps = Pick<
  MockInterviewRecommendationsCardProps,
  | "title"
  | "tabs"
  | "activeTab"
  | "interviewsByTab"
  | "showToolbar"
  | "sortLabel"
  | "filterLabel"
  | "emptyMessage"
  | "gridClassName"
  | "sidePanelData"
> & {
  description: string;
  createButtonLabel: string;
  createDialogTitle: string;
  createDialogDescription: string;
  createFields: CreateInterviewField[];
  notesLabel: string;
  notesPlaceholder: string;
  saveDraftLabel: string;
  publishLabel: string;
};

export function MyInterviewsBoard({
  title,
  description,
  tabs,
  activeTab,
  interviewsByTab,
  showToolbar,
  sortLabel,
  filterLabel,
  emptyMessage,
  gridClassName,
  sidePanelData,
  createButtonLabel,
  createDialogTitle,
  createDialogDescription,
  createFields,
  notesLabel,
  notesPlaceholder,
  saveDraftLabel,
  publishLabel,
}: MyInterviewsBoardProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-9 rounded-lg bg-primary text-white hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              {createButtonLabel}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{createDialogTitle}</DialogTitle>
              <DialogDescription>{createDialogDescription}</DialogDescription>
            </DialogHeader>

            <form action="/interviews" className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {createFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      name={field.id}
                      placeholder={field.placeholder}
                      type={field.type ?? "text"}
                      required={field.required}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="interview-notes">{notesLabel}</Label>
                <Textarea
                  id="interview-notes"
                  name="interview-notes"
                  placeholder={notesPlaceholder}
                  className="min-h-28"
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    {saveDraftLabel}
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit">{publishLabel}</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <MockInterviewRecommendationsCard
        title={title}
        tabs={tabs}
        activeTab={activeTab}
        interviewsByTab={interviewsByTab}
        showToolbar={showToolbar}
        sortLabel={sortLabel}
        filterLabel={filterLabel}
        emptyMessage={emptyMessage}
        gridClassName={gridClassName}
        sidePanelData={sidePanelData}
      />
    </section>
  );
}
