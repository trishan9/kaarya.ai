"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Globe2,
  Lock,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type {
  TResourceCourse,
  TResourceCourseChapter,
  TResourceCourseCoreConcept,
  TResourceCourseSection,
} from "@/lib/definitions";
import { cn } from "@/lib/utils";

const listOrEmpty = <T,>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];

const dedupe = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const materialFromConcepts = (concepts: TResourceCourseCoreConcept[]) =>
  concepts
    .flatMap((concept) => [
      concept.theory ? `${concept.concept}: ${concept.theory}` : null,
      concept.explanation ? `${concept.concept}: ${concept.explanation}` : null,
      concept.interviewApplication
        ? `${concept.concept}: ${concept.interviewApplication}`
        : null,
    ])
    .filter((item): item is string => Boolean(item));

const materialFromSections = (sections: TResourceCourseSection[]) =>
  sections.flatMap((section) => listOrEmpty(section.content));

const getChapterMaterial = (chapter: TResourceCourseChapter) => {
  const direct = listOrEmpty(chapter.material);
  if (direct.length > 0) return dedupe(direct);

  const derived = dedupe([
    ...materialFromSections(listOrEmpty(chapter.sections)),
    ...materialFromConcepts(listOrEmpty(chapter.coreConcepts)),
  ]);

  return derived.length > 0
    ? derived
    : [
        "Material is unavailable for this chapter. Regenerate the course to refresh this chapter.",
      ];
};

const getLessonLine = (text: string) => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  const stopIndex = cleaned.search(/[.!?]/);
  const line = stopIndex > -1 ? cleaned.slice(0, stopIndex + 1) : cleaned;

  return line.length > 150 ? `${line.slice(0, 147)}...` : line;
};

const getCreatorInitials = (name?: string | null) => {
  const safeName = (name ?? "").trim();
  if (!safeName) return "AI";
  const parts = safeName.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "AI";
};

const completionStorageKey = (courseId: string) =>
  `kaarya_resource_completion_${courseId}`;

const readStoredCompletion = (courseId: string, maxLength: number) => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(completionStorageKey(courseId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(
        parsed
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value))
          .filter((value) => value >= 0 && value < maxLength),
      ),
    );
  } catch {
    return [];
  }
};

function ChapterContent({
  chapter,
  chapterIndex,
  completed,
  onToggleComplete,
}: {
  chapter: TResourceCourseChapter;
  chapterIndex: number;
  completed: boolean;
  onToggleComplete: () => void;
}) {
  const material = getChapterMaterial(chapter);
  const interviewQuestions = listOrEmpty(chapter.interviewQuestions);
  const lessonRows = material.map(getLessonLine).filter(Boolean).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant={completed ? "default" : "outline"}
          className={cn(
            "h-9 rounded-lg",
            completed && "bg-emerald-600 text-white hover:bg-emerald-600",
          )}
          onClick={onToggleComplete}
        >
          <CheckCircle2 className="h-4 w-4" />
          {completed ? "Completed" : "Mark as completed"}
        </Button>
      </div>

      {chapter.overview ? (
        <div className="rounded-2xl border border-[#dce6f3] bg-[#f7fbff] p-4">
          <p className="text-sm leading-7 text-foreground">{chapter.overview}</p>
        </div>
      ) : null}

      {lessonRows.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Chapter Lessons
          </h4>
          <div className="rounded-2xl border border-border bg-card">
            {lessonRows.map((lesson, index) => (
              <div
                key={`${chapter.title}-lesson-${index}`}
                className={cn(
                  "flex items-start gap-2.5 px-4 py-3",
                  index !== lessonRows.length - 1 &&
                    "border-b border-[#ecf1f8]",
                )}
              >
                <span className="mt-1 rounded-full bg-primary/15 p-1 text-primary">
                  <BookOpen className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm leading-7 text-foreground">{lesson}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Reading Material
        </h4>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          {material.map((paragraph, index) => (
            <p
              key={`${chapter.title}-material-${index}`}
              className="text-sm leading-8 text-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Interview Q and A
        </h4>
        <div className="space-y-3">
          {interviewQuestions.map((qa, index) => (
            <div
              key={`${qa.question}-${index}`}
              className="rounded-2xl border border-[#e1e8f2] bg-muted/30 p-4"
            >
              <p className="text-base font-semibold text-foreground">
                Q. {qa.question}
              </p>
              {qa.sampleAnswer ? (
                <div className="mt-3 rounded-xl bg-card p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sample Answer
                  </p>
                  <p className="mt-2 text-sm leading-8 text-foreground">
                    {qa.sampleAnswer}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CourseDetailClientView({
  course,
}: {
  course: TResourceCourse;
}) {
  const chapters = listOrEmpty(course.chapters);
  const totalMinutes = chapters.reduce(
    (sum, chapter) => sum + (chapter.estimatedMinutes || 0),
    0,
  );
  const totalHours =
    totalMinutes % 60 === 0
      ? `${Math.round(totalMinutes / 60)}`
      : `${(totalMinutes / 60).toFixed(1)}`;
  const totalQuestions = chapters.reduce(
    (sum, chapter) => sum + listOrEmpty(chapter.interviewQuestions).length,
    0,
  );

  const [completedChapterIndexes, setCompletedChapterIndexes] = useState<number[]>(
    () => readStoredCompletion(course.id, chapters.length),
  );

  const completedSet = useMemo(
    () => new Set(completedChapterIndexes),
    [completedChapterIndexes],
  );

  const completedChapters = completedSet.size;
  const completionPercent = chapters.length
    ? Math.round((completedChapters / chapters.length) * 100)
    : 0;

  const toggleChapterCompletion = (index: number) => {
    setCompletedChapterIndexes((previous) => {
      const nextSet = new Set(previous);
      if (nextSet.has(index)) {
        nextSet.delete(index);
      } else {
        nextSet.add(index);
      }
      const next = Array.from(nextSet).sort((a, b) => a - b);
      try {
        window.localStorage.setItem(
          completionStorageKey(course.id),
          JSON.stringify(next),
        );
      } catch {
        // no-op
      }
      return next;
    });
  };

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-[#0f2f52] bg-linear-to-r from-[#02213d] via-[#06355d] to-[#0f5a91] text-white">
        <div className="space-y-5 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
            Learning Resource
          </p>
          <h1 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-4xl">
            {course.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-white/20 bg-card/10 font-medium text-white"
            >
              {course.generationMode === "learn" ? "Learn" : "Interview Prep"}
            </Badge>
            <Badge className="border-0 bg-card/15 capitalize text-white hover:bg-accent/15">
              {course.difficulty}
            </Badge>
            <Badge className="border-0 bg-card/15 text-white hover:bg-accent/15">
              {course.visibility === "public" ? (
                <Globe2 className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Lock className="h-3.5 w-3.5 mr-1" />
              )}
              {course.visibility.charAt(0).toUpperCase() +
                course.visibility.slice(1)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {listOrEmpty(course.targetRoles).map((targetRole) => (
              <Badge
                key={targetRole}
                className="border-0 bg-[#0b3f6d] text-white hover:bg-[#0b3f6d]"
              >
                {targetRole}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-card/10 px-3 py-2">
              <Clock3 className="h-4 w-4 text-white/90" />
              <span className="text-sm text-white/90">
                <span className="font-semibold text-white">{totalHours}</span>{" "}
                hours
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-card/10 px-3 py-2">
              <BookOpen className="h-4 w-4 text-white/90" />
              <span className="text-sm text-white/90">
                <span className="font-semibold text-white">
                  {chapters.length}
                </span>{" "}
                chapters
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-card/10 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-white/90" />
              <span className="text-sm text-white/90">
                <span className="font-semibold text-white">
                  {totalQuestions}
                </span>{" "}
                Q&A prompts
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 border-t border-white/15 bg-[#082847]/90 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
              Course Completion
            </p>
            <div className="flex items-center gap-3">
              <Progress
                value={completionPercent}
                className="h-2.5 bg-card/15 [&_[data-slot=progress-indicator]]:bg-[#28e780]"
              />
              <span className="text-sm font-semibold text-white/90">
                {completionPercent}%
              </span>
            </div>
          </div>
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
              Chapters Completed - {completedChapters} of {chapters.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {chapters.map((chapter, index) => (
                <span
                  key={`${chapter.title}-coverage-${index}`}
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    completedSet.has(index)
                      ? "bg-[#28e780] text-[#033620]"
                      : "bg-card/20 text-white/70",
                  )}
                >
                  {index + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Card className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <p className="text-lg font-semibold text-foreground">
              Resource Description
            </p>
            <p className="mt-2 text-sm leading-8 text-foreground">
              {course.description || "No description provided."}
            </p>
            {course.jobDescriptionContext ? (
              <div className="mt-4 rounded-2xl border border-[#d8e3f1] bg-muted/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#355b82]">
                  Job Perspective Context
                </p>
                <p className="mt-2 text-sm leading-8 text-foreground">
                  {course.jobDescriptionContext}
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="rounded-3xl border border-border bg-card p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 pt-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4d6988]">
                  Resource
                </p>
                <p className="text-lg font-semibold text-foreground">
                  Learning Path
                </p>
              </div>
              <Badge className="border-0 bg-primary/15 text-primary hover:bg-primary/15">
                {chapters.length} Chapters
              </Badge>
            </div>
            <Accordion
              type="single"
              collapsible
              defaultValue="chapter-1"
              className="space-y-3"
            >
              {chapters.map((chapter, index) => {
                const completed = completedSet.has(index);
                return (
                  <AccordionItem
                    key={`${chapter.title}-${index}`}
                    value={`chapter-${index + 1}`}
                    className="overflow-hidden rounded-3xl border border-[#dbe5f2] bg-card"
                  >
                    <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5">
                      <div className="flex flex-1 items-center justify-between gap-3 text-left">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a7291]">
                            Chapter {index + 1}
                          </p>
                          <h3 className="mt-1 truncate text-lg font-semibold text-foreground">
                            {chapter.title}
                          </h3>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className="rounded-full border-border bg-card"
                          >
                            <Clock3 className="mr-1 h-3.5 w-3.5" />
                            {chapter.estimatedMinutes} min
                          </Badge>
                          {completed ? (
                            <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              <Check className="h-3.5 w-3.5" />
                              Completed
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-[#e8eef7] bg-muted/30 px-4 pb-6 pt-5 sm:px-5">
                      <ChapterContent
                        chapter={chapter}
                        chapterIndex={index}
                        completed={completed}
                        onToggleComplete={() => toggleChapterCompletion(index)}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl border border-border bg-card p-4">
            <p className="text-base font-semibold text-foreground">
              Resource Snapshot
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-muted/35 px-3 py-2">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">
                  {course.category}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/35 px-3 py-2">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium text-foreground">
                  {course.generationMode === "learn"
                    ? "Learn"
                    : "Interview Prep"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/35 px-3 py-2">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium capitalize text-foreground">
                  {course.source}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/35 px-3 py-2">
                <span className="text-muted-foreground">AI Model</span>
                <span className="font-medium text-foreground">
                  {course.aiModel || "Kaarya AI Engine"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#1f3f60]">
              <Users className="h-4 w-4" />
              Creator
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#e3ebf5] bg-muted/30 p-3">
              <Avatar className="h-11 w-11 border border-[#d6e2ef]">
                <AvatarImage
                  src={course.creator?.photo ?? ""}
                  alt={course.creator?.name ?? "Creator"}
                />
                <AvatarFallback className="bg-[#e8f2ff] text-primary">
                  {getCreatorInitials(course.creator?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {course.creator?.name || "Kaarya AI Course Engine"}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {course.creator?.role || "resource creator"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              This material is aligned to the title, description, and target
              role context used during generation.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

