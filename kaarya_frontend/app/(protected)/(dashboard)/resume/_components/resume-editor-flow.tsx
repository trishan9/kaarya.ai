"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileDown,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  generateAiSuggestions,
  generateAiSummary,
  generateExperienceBullets,
  generateResumePdf,
  getResumeBuilder,
  saveResumeToMyResumes,
  updateResumeBuilder,
  type ResumeBuilderContent,
  type ResumeBuilderDetail,
  type ResumeBuilderTemplateId,
} from "@/lib/actions/resume-builder-actions";
import { cn } from "@/lib/utils";
import { ResumeDateInput, ResumeSkillsInput } from "./resume-form-fields";

const TEMPLATES: { id: ResumeBuilderTemplateId; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "executive", label: "Executive" },
];

const STEPS = [
  { id: "setup", label: "Setup", description: "Title and target role" },
  { id: "personal", label: "Contact", description: "Name, email, links" },
  { id: "summary", label: "Summary", description: "AI professional summary" },
  { id: "experience", label: "Experience", description: "Work history & bullets" },
  { id: "educationSkills", label: "Education & Skills", description: "Qualifications" },
  { id: "projects", label: "Projects", description: "Portfolio & achievements" },
  { id: "finalize", label: "Finalize", description: "Preview and export" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type AiFocus = "personal" | "summary" | "skills";

type Props = {
  resumeId: string;
  onClose: () => void;
  onSaved: () => void;
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const setupStepSchema = z.object({
  title: z.string().trim().min(1, "Resume title is required."),
  targetRole: z.string().trim().min(1, "Target role is required."),
});

type TSetupStepSchema = z.infer<typeof setupStepSchema>;

function mergeUniqueSkills(existing: string[], next: string[]): string[] {
  const map = new Map<string, string>();
  existing.forEach((skill) => {
    const normalized = skill.trim().toLowerCase();
    if (!normalized) return;
    if (!map.has(normalized)) map.set(normalized, skill.trim());
  });
  next.forEach((skill) => {
    const normalized = skill.trim().toLowerCase();
    if (!normalized) return;
    if (!map.has(normalized)) map.set(normalized, skill.trim());
  });
  return Array.from(map.values());
}

export function ResumeEditorFlow({ resumeId, onClose, onSaved }: Props) {
  const [detail, setDetail] = useState<ResumeBuilderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [savingToResumes, setSavingToResumes] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [bulletLoadingId, setBulletLoadingId] = useState<string | null>(null);
  const [bulkBulletLoading, setBulkBulletLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<AiFocus | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [experienceContext, setExperienceContext] = useState<Record<string, string>>({});

  const content = detail?.content ?? ({} as ResumeBuilderContent);
  const personalInfo = content.personalInfo ?? {};
  const experiences = useMemo(() => content.experience ?? [], [content.experience]);
  const educations = useMemo(() => content.education ?? [], [content.education]);
  const skills = useMemo(() => content.skills ?? [], [content.skills]);
  const projects = useMemo(() => content.projects ?? [], [content.projects]);
  const achievements = useMemo(() => content.achievements ?? [], [content.achievements]);
  const activeStep = STEPS[currentStep];
  const setupForm = useForm<TSetupStepSchema>({
    resolver: zodResolver(setupStepSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      targetRole: "",
    },
  });

  const completion = useMemo(() => {
    const checks = [
      Boolean(personalInfo.firstName || personalInfo.lastName),
      Boolean(personalInfo.email),
      Boolean(content.targetRole?.trim()),
      Boolean(content.professionalSummary?.trim()),
      experiences.length > 0,
      educations.length > 0,
      skills.length >= 3,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [
    personalInfo.firstName,
    personalInfo.lastName,
    personalInfo.email,
    content.targetRole,
    content.professionalSummary,
    experiences.length,
    educations.length,
    skills.length,
  ]);

  const stepValidation = useMemo(() => {
    const hasExperienceWithDetails = experiences.some(
      (exp) => Boolean(exp.position?.trim()) && Boolean(exp.company?.trim()) && (exp.bulletPoints ?? []).some((point) => point.trim().length > 0)
    );
    const hasEducation = educations.some((edu) => Boolean(edu.school?.trim()) && Boolean(edu.degree?.trim()));

    return {
      setup: Boolean(detail?.title?.trim()) && Boolean(content.targetRole?.trim()),
      personal: Boolean(personalInfo.firstName?.trim()) && Boolean(personalInfo.lastName?.trim()) && Boolean(personalInfo.email?.trim()),
      summary: Boolean(content.professionalSummary?.trim()),
      experience: hasExperienceWithDetails,
      educationSkills: hasEducation && skills.length >= 3,
      projects: true,
      finalize: true,
    } satisfies Record<StepId, boolean>;
  }, [content.professionalSummary, content.targetRole, detail?.title, educations, experiences, personalInfo.email, personalInfo.firstName, personalInfo.lastName, skills.length]);

  const setContent = useCallback((updater: (prev: ResumeBuilderContent) => ResumeBuilderContent) => {
    setPdfUrl(null);
    setDetail((prev) => (prev ? { ...prev, content: updater(prev.content ?? {}) } : prev));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = await getResumeBuilder(resumeId);
        if (!cancelled) {
          setDetail(fetched);
          setupForm.reset({
            title: fetched.title ?? "",
            targetRole: fetched.content?.targetRole ?? "",
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load resume draft.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId, setupForm]);

  const saveDraft = useCallback(async (silent = false) => {
    if (!detail) return false;
    setSaving(true);
    try {
      const updated = await updateResumeBuilder(resumeId, {
        title: detail.title,
        targetRole: detail.content?.targetRole ?? null,
        templateId: detail.templateId as ResumeBuilderTemplateId,
        content: detail.content,
      });
      setDetail(updated);
      if (!silent) toast.success("Draft saved.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save draft.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [detail, resumeId]);

  const updateExperience = (index: number, patch: Record<string, unknown>) => {
    setContent((prev) => ({
      ...prev,
      experience: prev.experience?.map((item, i) => (i === index ? { ...item, ...patch } : item)) ?? [],
    }));
  };

  const updateEducation = (index: number, patch: Record<string, unknown>) => {
    setContent((prev) => ({
      ...prev,
      education: prev.education?.map((item, i) => (i === index ? { ...item, ...patch } : item)) ?? [],
    }));
  };

  const updateProject = (index: number, patch: Record<string, unknown>) => {
    setContent((prev) => ({
      ...prev,
      projects: prev.projects?.map((item, i) => (i === index ? { ...item, ...patch } : item)) ?? [],
    }));
  };

  const updateAchievement = (index: number, patch: Record<string, unknown>) => {
    setContent((prev) => ({
      ...prev,
      achievements: prev.achievements?.map((item, i) => (i === index ? { ...item, ...patch } : item)) ?? [],
    }));
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    setCurrentStep(index);
  };

  const handleNext = async () => {
    if (activeStep.id === "setup") {
      const isValid = await setupForm.trigger(["title", "targetRole"], {
        shouldFocus: true,
      });
      if (!isValid) return;
    }

    if (!stepValidation[activeStep.id]) {
      toast.error(`Complete the ${activeStep.label} step before continuing.`);
      return;
    }
    goToStep(currentStep + 1);
  };

  const handlePrev = () => {
    goToStep(currentStep - 1);
  };

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    setPdfUrl(null);
    try {
      const ok = await saveDraft(true);
      if (!ok) return;
      const response = await generateResumePdf(resumeId);
      setPdfUrl(response.pdfUrl);
      toast.success("PDF preview generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function handleSaveToMyResumes() {
    setSavingToResumes(true);
    try {
      const ok = await saveDraft(true);
      if (!ok) return;
      await saveResumeToMyResumes(resumeId);
      toast.success("Saved to My Resumes.");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save resume.");
    } finally {
      setSavingToResumes(false);
    }
  }

  async function handleGenerateSummary() {
    setSummaryLoading(true);
    try {
      const { summary } = await generateAiSummary({
        targetRole: content.targetRole ?? undefined,
        professionalSummary: content.professionalSummary ?? undefined,
        experience: content.experience,
        education: content.education,
        skills: content.skills,
      });
      setContent((prev) => ({ ...prev, professionalSummary: summary }));
      toast.success("Summary generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleAiAssist(focus: AiFocus) {
    setAiLoading(focus);
    try {
      const suggestions = await generateAiSuggestions({
        focus,
        targetRole: content.targetRole,
        personalInfo: content.personalInfo,
        professionalSummary: content.professionalSummary,
        experience: content.experience,
        education: content.education,
        skills: content.skills,
      });
      setContent((prev) => ({
        ...prev,
        targetRole: suggestions.targetRole ?? prev.targetRole ?? null,
        professionalSummary: suggestions.professionalSummary ?? prev.professionalSummary ?? null,
        personalInfo: {
          ...(prev.personalInfo ?? {}),
          jobTitle: suggestions.jobTitle ?? prev.personalInfo?.jobTitle ?? null,
        },
        skills: suggestions.skills ? mergeUniqueSkills(prev.skills ?? [], suggestions.skills) : prev.skills,
      }));
      toast.success("AI suggestions applied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate AI suggestions.");
    } finally {
      setAiLoading(null);
    }
  }

  async function handleGenerateBullets(index: number) {
    const exp = experiences[index];
    if (!exp) return;
    const expId = exp.id ?? String(index);

    setBulletLoadingId(expId);
    try {
      const { bullets } = await generateExperienceBullets({
        targetRole: content.targetRole ?? undefined,
        position: exp.position ?? undefined,
        company: exp.company ?? undefined,
        description:
          experienceContext[expId]?.trim() ||
          `${exp.position || "Role"} responsibilities and achievements at ${exp.company || "company"}.`,
      });
      updateExperience(index, { bulletPoints: bullets });
      toast.success(`Bullets generated for experience ${index + 1}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate bullets.");
    } finally {
      setBulletLoadingId(null);
    }
  }

  async function handleGenerateBulletsForAll() {
    if (!experiences.length) {
      toast.error("Add at least one experience entry first.");
      return;
    }

    setBulkBulletLoading(true);
    try {
      for (let index = 0; index < experiences.length; index += 1) {
        const exp = experiences[index];
        if (!exp) continue;
        if (!exp.position?.trim() && !exp.company?.trim()) continue;

        const expId = exp.id ?? String(index);
        const { bullets } = await generateExperienceBullets({
          targetRole: content.targetRole ?? undefined,
          position: exp.position ?? undefined,
          company: exp.company ?? undefined,
          description:
            experienceContext[expId]?.trim() ||
            `${exp.position || "Role"} responsibilities and achievements at ${exp.company || "company"}.`,
        });

        setContent((prev) => ({
          ...prev,
          experience:
            prev.experience?.map((item, i) =>
              i === index ? { ...item, bulletPoints: bullets } : item
            ) ?? [],
        }));
      }
      toast.success("AI bullets generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate bullets.");
    } finally {
      setBulkBulletLoading(false);
    }
  }

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progressPercent = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Resume Builder</h2>
            <p className="text-xs text-muted-foreground">Complete each step. AI can help with summaries and bullet points.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {completion}% complete
          </Badge>
          <Badge variant={detail.generatedResumeId ? "default" : "outline"}>
            {detail.generatedResumeId ? "Saved" : "Draft"}
          </Badge>
        </div>
      </div>

      <Card className="rounded-xl border-[#ececf0] shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="h-1.5 rounded-full bg-neutral-100">
            <div className="h-1.5 rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {STEPS.map((step, index) => {
              const done = index < currentStep;
              const active = index === currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={cn(
                    "rounded-lg border p-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : done
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-neutral-50/50"
                  )}
                >
                  <p className="text-xs font-medium">{index + 1}. {step.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{step.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-[#ececf0] shadow-sm">
        <CardHeader className="pb-3 sm:px-5">
          <CardTitle className="text-base font-semibold">Step {currentStep + 1}: {activeStep.label}</CardTitle>
          <p className="text-sm text-muted-foreground">{activeStep.description}</p>
        </CardHeader>
        <CardContent className="space-y-5 sm:px-5">
          {activeStep.id === "setup" ? (
            <Form {...setupForm}>
              <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={setupForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resume title</FormLabel>
                      <FormControl>
                        <Input
                          className="mt-1"
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setDetail((prev) =>
                              prev ? { ...prev, title: e.target.value } : prev
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={setupForm.control}
                  name="targetRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target role</FormLabel>
                      <FormControl>
                        <Input
                          className="mt-1"
                          value={field.value}
                          placeholder="e.g. Frontend Developer"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setContent((prev) => ({
                              ...prev,
                              targetRole: e.target.value || null,
                            }));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setDetail((prev) => (prev ? { ...prev, templateId: template.id } : prev))}
                    className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition-colors", detail.templateId === template.id ? "border-primary bg-primary/10 text-primary" : "border-[#e5e7eb] hover:border-[#d1d5db]")}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
              </div>
            </Form>
          ) : null}

          {activeStep.id === "personal" ? (
            <div className="space-y-5">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => handleAiAssist("personal")} disabled={aiLoading === "personal"}>
                  {aiLoading === "personal" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI improve headline
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input value={personalInfo.firstName ?? ""} placeholder="John" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), firstName: e.target.value || null } }))} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={personalInfo.lastName ?? ""} placeholder="Doe" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), lastName: e.target.value || null } }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Job title / headline</Label>
                  <Input value={personalInfo.jobTitle ?? ""} placeholder="e.g. Software Engineer" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), jobTitle: e.target.value || null } }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={personalInfo.email ?? ""} placeholder="john@example.com" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), email: e.target.value || null } }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={personalInfo.phone ?? ""} placeholder="+1 234 567 8900" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), phone: e.target.value || null } }))} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={personalInfo.city ?? ""} placeholder="San Francisco" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), city: e.target.value || null } }))} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={personalInfo.country ?? ""} placeholder="USA" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), country: e.target.value || null } }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>LinkedIn</Label>
                  <Input value={personalInfo.linkedin ?? ""} placeholder="https://linkedin.com/in/username" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), linkedin: e.target.value || null } }))} />
                </div>
                <div className="space-y-2">
                  <Label>GitHub</Label>
                  <Input value={personalInfo.github ?? ""} placeholder="https://github.com/username" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), github: e.target.value || null } }))} />
                </div>
                <div className="space-y-2">
                  <Label>Portfolio</Label>
                  <Input value={personalInfo.portfolio ?? ""} placeholder="https://yourportfolio.com" onChange={(e) => setContent((prev) => ({ ...prev, personalInfo: { ...(prev.personalInfo ?? {}), portfolio: e.target.value || null } }))} />
                </div>
              </div>
            </div>
          ) : null}

          {activeStep.id === "summary" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleAiAssist("summary")} disabled={aiLoading === "summary"} className="gap-1">
                  {aiLoading === "summary" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI rewrite
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateSummary} disabled={summaryLoading} className="gap-1">
                  {summaryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI generate
                </Button>
              </div>
              <Textarea value={content.professionalSummary ?? ""} rows={8} className="resize-none" placeholder="Write a concise professional summary..." onChange={(e) => setContent((prev) => ({ ...prev, professionalSummary: e.target.value || null }))} />
            </div>
          ) : null}

          {activeStep.id === "experience" ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={handleGenerateBulletsForAll} disabled={bulkBulletLoading}>
                  {bulkBulletLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI generate all bullets
                </Button>
              </div>

              {experiences.map((experience, index) => {
                const expId = experience.id ?? String(index);
                return (
                  <div key={expId} className="space-y-3 rounded-lg border border-[#e5e7eb] bg-neutral-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Experience {index + 1}</p>
                      <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-destructive hover:text-destructive" onClick={() => setContent((prev) => ({ ...prev, experience: prev.experience?.filter((_, i) => i !== index) ?? [] }))}><Trash2 className="h-3.5 w-3.5" />Remove</Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input placeholder="Position" value={experience.position ?? ""} onChange={(e) => updateExperience(index, { position: e.target.value || null })} />
                      <Input placeholder="Company" value={experience.company ?? ""} onChange={(e) => updateExperience(index, { company: e.target.value || null })} />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <ResumeDateInput value={experience.startDate ?? ""} onChange={(value) => updateExperience(index, { startDate: value || null })} placeholder="Start date" />
                      <ResumeDateInput value={experience.endDate ?? ""} onChange={(value) => updateExperience(index, { endDate: value || null })} placeholder="End date" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">AI context</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Textarea rows={2} className="resize-none" value={experienceContext[expId] ?? ""} onChange={(e) => setExperienceContext((prev) => ({ ...prev, [expId]: e.target.value }))} placeholder="Add responsibilities, achievements, metrics..." />
                        <Button type="button" variant="outline" className="sm:w-40" disabled={bulletLoadingId === expId} onClick={() => handleGenerateBullets(index)}>
                          {bulletLoadingId === expId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {(experience.bulletPoints ?? []).map((bullet, bi) => (
                      <div key={`${expId}-${bi}`} className="flex gap-2">
                        <Input value={bullet} onChange={(e) => updateExperience(index, { bulletPoints: (experience.bulletPoints ?? []).map((item, i) => (i === bi ? e.target.value : item)) })} placeholder="Achievement or responsibility" />
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => updateExperience(index, { bulletPoints: (experience.bulletPoints ?? []).filter((_, i) => i !== bi) })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => updateExperience(index, { bulletPoints: [...(experience.bulletPoints ?? []), ""] })}><Plus className="h-3.5 w-3.5" />Add bullet</Button>
                  </div>
                );
              })}

              <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setContent((prev) => ({ ...prev, experience: [...(prev.experience ?? []), { id: makeId("exp"), company: null, position: null, startDate: null, endDate: null, bulletPoints: [] }] }))}><Plus className="h-4 w-4" />Add experience</Button>
            </div>
          ) : null}

          {activeStep.id === "educationSkills" ? (
            <div className="space-y-5">
              <div className="space-y-3">
                {educations.map((education, index) => (
                  <div key={education.id ?? index} className="space-y-2 rounded-lg border border-[#e5e7eb] bg-neutral-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Education {index + 1}</p>
                      <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-destructive hover:text-destructive" onClick={() => setContent((prev) => ({ ...prev, education: prev.education?.filter((_, i) => i !== index) ?? [] }))}><Trash2 className="h-3.5 w-3.5" />Remove</Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input placeholder="Degree" value={education.degree ?? ""} onChange={(e) => updateEducation(index, { degree: e.target.value || null })} />
                      <Input placeholder="Major" value={education.major ?? ""} onChange={(e) => updateEducation(index, { major: e.target.value || null })} />
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <Input placeholder="School" value={education.school ?? ""} onChange={(e) => updateEducation(index, { school: e.target.value || null })} className="md:col-span-1" />
                      <ResumeDateInput value={education.startDate ?? ""} onChange={(value) => updateEducation(index, { startDate: value || null })} placeholder="Start date" />
                      <ResumeDateInput value={education.endDate ?? ""} onChange={(value) => updateEducation(index, { endDate: value || null })} placeholder="End date" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Relevant coursework (optional)</Label>
                      <Input placeholder="e.g. Programming, DSA, ML, AI" value={education.coursework ?? ""} onChange={(e) => updateEducation(index, { coursework: e.target.value || null })} />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setContent((prev) => ({ ...prev, education: [...(prev.education ?? []), { id: makeId("edu"), school: null, degree: null, major: null, startDate: null, endDate: null, coursework: null }] }))}><Plus className="h-4 w-4" />Add education</Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Skills</Label>
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => handleAiAssist("skills")} disabled={aiLoading === "skills"}>
                    {aiLoading === "skills" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    AI suggest skills
                  </Button>
                </div>
                <ResumeSkillsInput value={skills} onChange={(nextSkills) => setContent((prev) => ({ ...prev, skills: nextSkills }))} />
              </div>
            </div>
          ) : null}

          {activeStep.id === "projects" ? (
            <div className="space-y-5">
              <div className="space-y-3">
                {projects.map((project, index) => (
                  <div key={project.id ?? index} className="space-y-2 rounded-lg border border-[#e5e7eb] bg-neutral-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Project {index + 1}</p>
                      <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-destructive hover:text-destructive" onClick={() => setContent((prev) => ({ ...prev, projects: prev.projects?.filter((_, i) => i !== index) ?? [] }))}><Trash2 className="h-3.5 w-3.5" />Remove</Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input placeholder="Project name" value={project.name ?? ""} onChange={(e) => updateProject(index, { name: e.target.value || null })} />
                      <Input placeholder="URL (GitHub, live demo)" value={project.url ?? ""} onChange={(e) => updateProject(index, { url: e.target.value || null })} />
                    </div>
                    <Textarea rows={2} placeholder="Brief description" value={project.description ?? ""} onChange={(e) => updateProject(index, { description: e.target.value || null })} className="resize-none" />
                    <Input placeholder="Technologies (e.g. React, Node.js)" value={project.technologies ?? ""} onChange={(e) => updateProject(index, { technologies: e.target.value || null })} />
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setContent((prev) => ({ ...prev, projects: [...(prev.projects ?? []), { id: makeId("proj"), name: null, description: null, url: null, technologies: null }] }))}><Plus className="h-4 w-4" />Add project</Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Leadership & Achievements</Label>
                {achievements.map((achievement, index) => (
                  <div key={achievement.id ?? index} className="flex gap-2">
                    <Input value={achievement.text ?? ""} placeholder="e.g. President, IT Club – Led workshops and hackathons" onChange={(e) => updateAchievement(index, { text: e.target.value || null })} />
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => setContent((prev) => ({ ...prev, achievements: prev.achievements?.filter((_, i) => i !== index) ?? [] }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setContent((prev) => ({ ...prev, achievements: [...(prev.achievements ?? []), { id: makeId("ach"), text: "" }] }))}><Plus className="h-3.5 w-3.5" />Add achievement</Button>
              </div>
            </div>
          ) : null}

          {activeStep.id === "finalize" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#e5e7eb] bg-neutral-50/60 p-3 text-sm text-muted-foreground">
                Save your draft, generate a PDF preview, then download or save to My Resumes.
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button className="w-full gap-2" onClick={handleGeneratePdf} disabled={generatingPdf}>
                  {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                  Generate PDF preview
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => saveDraft()} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save draft
                </Button>
              </div>

              {pdfUrl ? (
                <div className="space-y-3">
                  <iframe src={pdfUrl} title="Resume PDF preview" className="h-[520px] w-full rounded-lg border border-[#e5e7eb] bg-white" />
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />Download
                      </a>
                    </Button>
                    <Button className="flex-1 gap-2" onClick={handleSaveToMyResumes} disabled={savingToResumes}>
                      {savingToResumes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save to My Resumes
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Generate a preview to download or save this resume.</p>
              )}
            </div>
          ) : null}

          <Separator />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0} className="gap-2">
              <ArrowLeft className="h-4 w-4" />Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => saveDraft()} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
              {activeStep.id !== "finalize" ? (
                <Button onClick={() => void handleNext()} className="gap-2">
                  Next step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
