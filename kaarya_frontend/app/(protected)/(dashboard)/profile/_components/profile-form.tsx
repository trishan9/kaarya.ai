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
  Sparkles,
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
import { Button } from "@/components/ui/button";

interface ProfileFormProps {
  user: TUser;
  onSuccess?: () => void;
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const { form, onSubmit, isSubmitting } = useUpdateProfile({
    user,
    onSuccess,
  });

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your personal information and profile details
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Sparkles className="w-4 h-4" />
            Generate Resume
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 h-auto gap-1 bg-muted p-1">
            <TabsTrigger value="general" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="education" disabled className="gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
            <TabsTrigger value="work" disabled className="gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Experience</span>
            </TabsTrigger>
            <TabsTrigger value="salary" disabled className="gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Salary</span>
            </TabsTrigger>
            <TabsTrigger value="resume" disabled className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Resume</span>
            </TabsTrigger>
            <TabsTrigger value="certification" disabled className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Certs</span>
            </TabsTrigger>
            <TabsTrigger value="skill" disabled className="gap-2">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Skills</span>
            </TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
            <TabsContent value="general" className="mt-0">
              <GeneralInformationForm
                form={form}
                currentPhoto={user.photo}
                userName={user.name}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="education" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Education section coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="work" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Work experience section coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="salary" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Salary expectation section coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="resume" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Resume and portfolio section coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="certification" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Certification section coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="skill" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Skills section coming soon</p>
              </div>
            </TabsContent>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
