"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuillViewer } from "@/components/rich-text/quill-viewer";

export type JobDescriptionPanelProps = {
  descriptionTitle: string;
  description: string;
  qualificationsTitle: string;
  qualifications: string[];
  readMoreLabel?: string;
  showLessLabel?: string;
};

export function JobDescriptionPanel({
  descriptionTitle,
  description,
  qualificationsTitle,
  qualifications,
  readMoreLabel = "Read more",
  showLessLabel = "Show less",
}: JobDescriptionPanelProps) {
  const [expanded, setExpanded] = React.useState(false);
  const plainTextLength = description.replace(/<[^>]+>/g, "").length;
  const shouldCollapse = plainTextLength > 420 || qualifications.length > 5;

  return (
    <section className="space-y-5 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
      <div className="relative">
        <div
          className={`space-y-5 ${
            !expanded && shouldCollapse ? "max-h-[260px] overflow-hidden" : ""
          }`}
        >
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-foreground">{descriptionTitle}</h3>
            <QuillViewer
              value={description}
              className="text-sm leading-6 text-muted-foreground [&_.ql-editor]:p-0 [&_.ql-editor_h1]:text-xl [&_.ql-editor_h1]:font-semibold [&_.ql-editor_h2]:text-lg [&_.ql-editor_h2]:font-semibold [&_.ql-editor_h3]:text-base [&_.ql-editor_h3]:font-semibold [&_.ql-editor_ol]:list-decimal [&_.ql-editor_ol]:pl-5 [&_.ql-editor_p]:mb-2 [&_.ql-editor_strong]:font-semibold [&_.ql-editor_ul]:list-disc [&_.ql-editor_ul]:pl-5"
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-semibold text-foreground">{qualificationsTitle}</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
              {qualifications.map((qualification) => (
                <li key={qualification}>{qualification}</li>
              ))}
            </ul>
          </div>
        </div>

        {!expanded && shouldCollapse ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white" />
        ) : null}
      </div>

      {shouldCollapse && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-md text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? showLessLabel : readMoreLabel}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </Button>
        </div>
      )}
    </section>
  );
}
