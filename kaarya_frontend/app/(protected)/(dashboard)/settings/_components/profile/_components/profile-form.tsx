"use client";

import { useState } from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  DollarSign,
  FileText,
  Award,
  Code,
} from "lucide-react";
import { TUser } from "@/lib/definitions";
import { useUpdateProfile } from "../_hooks/use-update-profile";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralInformationForm } from "./general-information-form";
import { useFieldArray } from "react-hook-form";
import { EducationInformationForm } from "./education-information-form";
import { ExperienceInformationForm } from "./experience-information-form";
import { SalaryInformationForm } from "./salary-information-form";
import {
  ResumeInformationForm,
  TSettingsResumeOption,
} from "./resume-information-form";
import { CertificationsInformationForm } from "./certifications-information-form";
import { SkillsInformationForm } from "./skills-information-form";

interface ProfileFormProps {
  user: TUser;
  resumeOptions: TSettingsResumeOption[];
  onSuccess?: () => void;
}

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `entry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function ProfileForm({
  user,
  resumeOptions,
  onSuccess,
}: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const { form, onSubmit, isSubmitting } = useUpdateProfile({
    user,
    onSuccess,
  });
  const educationFieldArray = useFieldArray({
    control: form.control,
    name: "candidateProfile.education",
    keyName: "fieldKey",
  });
  const experienceFieldArray = useFieldArray({
    control: form.control,
    name: "candidateProfile.experience",
    keyName: "fieldKey",
  });
  const certificationsFieldArray = useFieldArray({
    control: form.control,
    name: "candidateProfile.certifications",
    keyName: "fieldKey",
  });

  const tabItems = [
    { value: "general", label: "General", icon: User },
    { value: "skill", label: "Skills", icon: Code },
    { value: "work", label: "Experience", icon: Briefcase },
    { value: "education", label: "Education", icon: GraduationCap },
    { value: "resume", label: "Resume", icon: FileText },
    { value: "certification", label: "Certifications", icon: Award },
    { value: "salary", label: "Salary", icon: DollarSign },
  ] as const;

  return (
    <Card>
      <CardContent className="p-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex overflow-y-hidden h-9 w-full items-center justify-start gap-0 overflow-x-auto rounded-lg border bg-background p-0.5">
            {tabItems.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 rounded-md text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-5 space-y-5"
          >
            <TabsContent value="general" className="mt-0">
              <GeneralInformationForm
                form={form}
                currentPhoto={user.photo}
                userName={user.name}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="skill" className="mt-0">
              <SkillsInformationForm form={form} isSubmitting={isSubmitting} />
            </TabsContent>

            <TabsContent value="work" className="mt-0">
              <ExperienceInformationForm
                form={form}
                fields={experienceFieldArray.fields.map((field) => ({
                  id: field.fieldKey,
                }))}
                onAdd={() =>
                  experienceFieldArray.append({
                    id: createId(),
                    jobTitle: "",
                    companyName: "",
                    location: "",
                    employmentType: "Full-time",
                    startDate: "",
                    endDate: "",
                    currentlyWorking: false,
                    description: "",
                  })
                }
                onRemove={(index) => experienceFieldArray.remove(index)}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="education" className="mt-0">
              <EducationInformationForm
                form={form}
                fields={educationFieldArray.fields.map((field) => ({
                  id: field.fieldKey,
                }))}
                onAdd={() =>
                  educationFieldArray.append({
                    id: createId(),
                    institution: "",
                    degree: "",
                    fieldOfStudy: "",
                    startDate: "",
                    endDate: "",
                    grade: "",
                    description: "",
                  })
                }
                onRemove={(index) => educationFieldArray.remove(index)}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="resume" className="mt-0">
              <ResumeInformationForm
                form={form}
                resumeOptions={resumeOptions}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="certification" className="mt-0">
              <CertificationsInformationForm
                form={form}
                fields={certificationsFieldArray.fields.map((field) => ({
                  id: field.fieldKey,
                }))}
                onAdd={() =>
                  certificationsFieldArray.append({
                    id: createId(),
                    name: "",
                    issuer: "",
                    issueDate: "",
                    expiryDate: "",
                    credentialId: "",
                    credentialUrl: "",
                    mediaUrl: "",
                    mediaMimeType: "",
                    noExpiry: false,
                  })
                }
                onRemove={(index) => certificationsFieldArray.remove(index)}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="salary" className="mt-0">
              <SalaryInformationForm form={form} isSubmitting={isSubmitting} />
            </TabsContent>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
