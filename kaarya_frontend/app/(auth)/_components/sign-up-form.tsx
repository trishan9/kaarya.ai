"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSignUp } from "../_hooks/use-sign-up";
import { API_URLS } from "@/lib/api/endpoints";

export function SignupForm() {
  const { form, isSubmitting, onSubmit } = useSignUp();
  const role = form.watch("role");
  const isRecruiter = role === "recruiter";

  const handleOAuthSignup = (provider: "google" | "github") => {
    if (!API_URLS.BASE) return;

    const redirectUri = `${window.location.origin}/oauth/callback`;
    const authorizeUrl = new URL(
      `${API_URLS.BASE.replace(/\/$/, "")}${API_URLS.AUTH.OAUTH_AUTHORIZE(
        provider,
      )}`,
    );
    authorizeUrl.searchParams.set("redirectUri", redirectUri);
    authorizeUrl.searchParams.set("intent", "signup");

    window.location.assign(authorizeUrl.toString());
  };

  return (
    <form id="sign-up-form" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel>Sign up as</FieldLabel>
          <Tabs
            value={role === "recruiter" ? "recruiter" : "user"}
            onValueChange={(nextRole) =>
              form.setValue("role", nextRole === "recruiter" ? "recruiter" : "user", {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            className="w-full"
          >
            <TabsList className="grid h-9 w-full grid-cols-2 rounded-lg bg-muted/70 p-1">
              <TabsTrigger value="user" className="h-7 rounded-md px-3 text-xs">
                Candidate
              </TabsTrigger>
              <TabsTrigger
                value="recruiter"
                className="h-7 rounded-md px-3 text-xs"
              >
                Recruiter
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <FieldDescription>
            Recruiter signup will also create your first company workspace.
          </FieldDescription>
        </Field>

        <div className="flex gap-4">
          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="firstName">First Name</FieldLabel>

                <Input
                  {...field}
                  id="firstName"
                  type="text"
                  aria-invalid={fieldState.invalid}
                  placeholder="Trishan"
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="lastName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>

                <Input
                  {...field}
                  id="lastName"
                  type="text"
                  aria-invalid={fieldState.invalid}
                  placeholder="Wagle"
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>

              <Input
                {...field}
                id="email"
                type="email"
                aria-invalid={fieldState.invalid}
                placeholder="trishan@kaarya.com"
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {isRecruiter ? (
          <>
            <Controller
              name="companyName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
                  <Input
                    {...field}
                    id="companyName"
                    type="text"
                    aria-invalid={fieldState.invalid}
                    placeholder="Kaarya AI"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex gap-4">
              <Controller
                name="companyIndustry"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="companyIndustry">Industry</FieldLabel>
                    <Input
                      {...field}
                      id="companyIndustry"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="Technology"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="designation"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="designation">Designation</FieldLabel>
                    <Input
                      {...field}
                      id="designation"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="Talent Partner"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="companyLocation"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="companyLocation">Location</FieldLabel>
                  <Input
                    {...field}
                    id="companyLocation"
                    type="text"
                    aria-invalid={fieldState.invalid}
                    placeholder="Kathmandu, Nepal"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </>
        ) : null}

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>

              <Input
                {...field}
                id="password"
                type="password"
                aria-invalid={fieldState.invalid}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>

              <Input
                {...field}
                id="confirmPassword"
                type="password"
                aria-invalid={fieldState.invalid}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button disabled={isSubmitting} type="submit" form="sign-up-form">
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting
              ? isRecruiter
                ? "Creating recruiter workspace..."
                : "Creating your account..."
              : isRecruiter
                ? "Create Recruiter Workspace"
                : "Sign Up"}
          </Button>
        </Field>

        {isRecruiter ? null : (
          <>
            <FieldSeparator>Or</FieldSeparator>

            <Field>
              <Button
                disabled={isSubmitting}
                variant="outline"
                type="button"
                onClick={() => handleOAuthSignup("google")}
              >
                <svg
                  width="800px"
                  height="800px"
                  viewBox="-3 0 262 262"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid"
                >
                  <path
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    fill="#4285F4"
                  />
                  <path
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    fill="#34A853"
                  />
                  <path
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                    fill="#FBBC05"
                  />
                  <path
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    fill="#EB4335"
                  />
                </svg>
                Signup with Google
              </Button>

              <Button
                disabled={isSubmitting}
                variant="outline"
                type="button"
                onClick={() => handleOAuthSignup("github")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    fill="currentColor"
                  />
                </svg>
                Signup with GitHub
              </Button>
            </Field>
          </>
        )}

        <Field>
          <FieldDescription className="text-center pt-3">
            Already have an account?{" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
