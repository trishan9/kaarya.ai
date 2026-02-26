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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralInformationForm } from "./general-information-form";
import { useFieldArray } from "react-hook-form";
import { EducationInformationForm } from "./education-information-form";
import { ExperienceInformationForm } from "./experience-information-form";
import { SalaryInformationForm } from "./salary-information-form";
import { ResumeInformationForm, TSettingsResumeOption } from "./resume-information-form";
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

export function ProfileForm({ user, resumeOptions, onSuccess }: ProfileFormProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Manage profile data used across applications, recommendations, and
          recruiter views.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 lg:grid-cols-4 xl:grid-cols-7">
            <TabsTrigger value="general" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>

            <TabsTrigger value="education" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>

            <TabsTrigger value="work" className="gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Experience</span>
            </TabsTrigger>

            <TabsTrigger value="salary" className="gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Salary</span>
            </TabsTrigger>

            <TabsTrigger value="resume" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Resume</span>
            </TabsTrigger>

            <TabsTrigger value="certification" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Certs</span>
            </TabsTrigger>

            <TabsTrigger value="skill" className="gap-2">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Skills</span>
            </TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <TabsContent value="general" className="mt-0">
              <GeneralInformationForm
                form={form}
                currentPhoto={user.photo}
                userName={user.name}
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

            <TabsContent value="salary" className="mt-0">
              <SalaryInformationForm form={form} isSubmitting={isSubmitting} />
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

            <TabsContent value="skill" className="mt-0">
              <SkillsInformationForm form={form} isSubmitting={isSubmitting} />
            </TabsContent>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
