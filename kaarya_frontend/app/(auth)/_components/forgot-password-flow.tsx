"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  usePasswordResetFlow,
  type PasswordResetStep,
} from "../_hooks/use-password-reset-flow";
import { PasswordResetOtpInput } from "./password-reset-otp-input";

const FLOW_STEPS: Array<{ id: PasswordResetStep; label: string }> = [
  { id: "verify", label: "Verify" },
  { id: "reset", label: "Reset" },
  { id: "success", label: "Done" },
];

function maskEmail(email: string) {
  const [localPart = "", domain = ""] = email.split("@");
  if (!domain) return email;

  if (localPart.length <= 2) {
    return `${localPart[0] ?? ""}*@${domain}`;
  }

  return `${localPart.slice(0, 2)}${"*".repeat(
    localPart.length - 2
  )}@${domain}`;
}

export function ForgotPasswordFlow() {
  const {
    step,
    verifyForm,
    resetForm,
    onRequestCode,
    onSubmitVerify,
    onSubmitReset,
    onResendCode,
    onUseDifferentEmail,
    onBackToVerify,
    onRedirectToSignin,
    isTransitioning,
    isRequesting,
    isVerifying,
    isResending,
    isResetting,
    hasSentCode,
    resendSecondsLeft,
    sendCodeError,
    sendCodeInfo,
    resetError,
  } = usePasswordResetFlow();

  const activeStepIndex = FLOW_STEPS.findIndex((item) => item.id === step);
  const progressPercent =
    activeStepIndex <= 0
      ? 0
      : (activeStepIndex / (FLOW_STEPS.length - 1)) * 100;
  const enteredEmail = verifyForm.watch("email").trim().toLowerCase();
  const otp = verifyForm.watch("otp");
  const canResend = hasSentCode && resendSecondsLeft === 0;
  const canVerifyOtp = otp.trim().length === 6 && !isTransitioning;

  return (
    <div className="space-y-7">
      <div aria-label="Password reset progress" className="space-y-2">
        <div className="relative px-2 md:px-4">
          <div className="absolute left-[16.6667%] right-[16.6667%] top-4 z-0">
            <div className="relative h-1 rounded-full bg-border">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2">
            {FLOW_STEPS.map((flowStep, index) => {
              const isCompleted = index < activeStepIndex;
              const isActive = index === activeStepIndex;

              return (
                <div key={flowStep.id} className="space-y-2 text-center">
                  <div
                    className={[
                      "mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "",
                      isActive
                        ? "border-primary bg-background text-primary ring-4 ring-primary/15 ring-offset-2 ring-offset-background"
                        : "",
                      !isCompleted && !isActive
                        ? "border-border bg-background text-muted-foreground"
                        : "",
                    ].join(" ")}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <p
                    className={[
                      "text-xs font-medium md:text-sm",
                      isActive || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {flowStep.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {step === "verify" && (
        <form
          id="forgot-password-verify-form"
          onSubmit={verifyForm.handleSubmit(onSubmitVerify)}
        >
          <FieldGroup>
            <Controller
              name="email"
              control={verifyForm.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>

                  <Input
                    {...field}
                    id="forgot-password-email"
                    type="email"
                    placeholder="trishan@kaarya.com"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                  />

                  <FieldDescription>
                    We will email both a secure reset link and a verification
                    code.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Field>
              {!hasSentCode && (
                <Button
                  onClick={onRequestCode}
                  disabled={isTransitioning}
                  type="button"
                >
                  {isRequesting && <Loader2 className="animate-spin" />}
                  {isRequesting ? "Sending code..." : "Send code"}
                </Button>
              )}

              {hasSentCode && (
                <FieldDescription className="flex items-center gap-2">
                  {canResend ? (
                    <Button
                      onClick={onResendCode}
                      disabled={isTransitioning}
                      variant="link"
                      className="h-auto px-0"
                      type="button"
                    >
                      {isResending ? "Resending..." : "Resend code"}
                    </Button>
                  ) : (
                    <span>Resend available in {resendSecondsLeft}s</span>
                  )}
                </FieldDescription>
              )}

              {sendCodeInfo && (
                <FieldDescription>{sendCodeInfo}</FieldDescription>
              )}
              {sendCodeError && <FieldError>{sendCodeError}</FieldError>}
            </Field>

            {hasSentCode && (
              <>
                <Controller
                  name="otp"
                  control={verifyForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Verification Code</FieldLabel>

                      <PasswordResetOtpInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={fieldState.invalid}
                        disabled={isTransitioning}
                      />

                      <FieldDescription>
                        {enteredEmail
                          ? `Enter the 6-digit code sent to ${maskEmail(
                              enteredEmail
                            )}.`
                          : "Enter the 6-digit code sent to your email."}
                      </FieldDescription>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Field orientation="responsive" className="gap-3">
                  <Button
                    disabled={!canVerifyOtp}
                    type="submit"
                    form="forgot-password-verify-form"
                  >
                    {isVerifying && <Loader2 className="animate-spin" />}
                    {isVerifying ? "Verifying..." : "Verify code"}
                  </Button>

                  <Button
                    onClick={onUseDifferentEmail}
                    disabled={isTransitioning}
                    variant="link"
                    className="h-auto px-0"
                    type="button"
                  >
                    Use different email
                  </Button>
                </Field>
              </>
            )}

            <FieldDescription>
              <Link href="/sign-in">Back to sign in</Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      )}

      {step === "reset" && (
        <form
          id="forgot-password-reset-form"
          onSubmit={resetForm.handleSubmit(onSubmitReset)}
        >
          <FieldGroup>
            <Controller
              name="password"
              control={resetForm.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="forgot-password-new-password">
                    New Password
                  </FieldLabel>

                  <Input
                    {...field}
                    id="forgot-password-new-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />

                  <FieldDescription>
                    Use 12+ characters with uppercase, lowercase, number, and
                    symbol. This works for both OTP and secure link flows.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={resetForm.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="forgot-password-confirm-password">
                    Confirm Password
                  </FieldLabel>

                  <Input
                    {...field}
                    id="forgot-password-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {resetError && (
              <Field>
                <FieldError>{resetError}</FieldError>
              </Field>
            )}

            <Field orientation="responsive" className="gap-3">
              <Button
                disabled={isTransitioning}
                type="submit"
                form="forgot-password-reset-form"
              >
                {isResetting && <Loader2 className="animate-spin" />}
                {isResetting ? "Resetting password..." : "Reset password"}
              </Button>

              <Button
                onClick={onBackToVerify}
                disabled={isTransitioning}
                variant="link"
                className="h-auto px-0"
                type="button"
              >
                Back to verification
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}

      {step === "success" && (
        <div className="space-y-6">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-5">
            <div className="mb-3 inline-flex rounded-full bg-primary p-2 text-primary-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <h3 className="text-lg font-semibold">
              Password updated successfully
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Your account is now secure with the new password. Redirecting to
              sign in...
            </p>
          </div>

          <Button onClick={onRedirectToSignin} type="button">
            Continue to sign in
          </Button>
        </div>
      )}
    </div>
  );
}
