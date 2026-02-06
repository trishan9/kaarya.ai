"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  TResetPasswordFormSchema,
  TVerifyPasswordResetOtpSchema,
  requestPasswordResetSchema,
  resetPasswordFormSchema,
  verifyPasswordResetOtpSchema,
} from "../_schemas";
import {
  confirmPasswordReset,
  requestPasswordReset,
  verifyPasswordResetOtp,
} from "@/lib/actions/auth-action";

export type PasswordResetStep = "verify" | "reset" | "success";
type PasswordResetAction = "request" | "verify" | "resend" | "reset" | null;

const SIGNIN_REDIRECT_DELAY_MS = 2200;
const RESEND_COOLDOWN_SECONDS = 30;

type ResetContext = {
  email: string;
  token: string;
};

const INITIAL_CONTEXT: ResetContext = {
  email: "",
  token: "",
};

export const usePasswordResetFlow = () => {
  const router = useRouter();
  const [step, setStep] = useState<PasswordResetStep>("verify");
  const [activeAction, setActiveAction] = useState<PasswordResetAction>(null);
  const [context, setContext] = useState<ResetContext>(INITIAL_CONTEXT);
  const [resetError, setResetError] = useState("");
  const [sendCodeError, setSendCodeError] = useState("");
  const [sendCodeInfo, setSendCodeInfo] = useState("");
  const [hasSentCode, setHasSentCode] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verifyForm = useForm<TVerifyPasswordResetOtpSchema>({
    resolver: zodResolver(verifyPasswordResetOtpSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const resetForm = useForm<TResetPasswordFormSchema>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function runAction(
    action: Exclude<PasswordResetAction, null>,
    task: () => Promise<void>
  ) {
    setActiveAction(action);
    try {
      await task();
    } catch (error: Error | any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setActiveAction(null);
    }
  }

  function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  function getValidatedEmail() {
    const email = normalizeEmail(verifyForm.getValues("email"));
    const parsed = requestPasswordResetSchema.safeParse({ email });

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ||
        "Please enter a valid email address.";
      verifyForm.setError("email", {
        type: "manual",
        message,
      });
      toast.error(message);
      return null;
    }

    verifyForm.clearErrors("email");
    verifyForm.setValue("email", email, { shouldValidate: false });
    return email;
  }

  function isResponseSuccess(response: any) {
    if (typeof response?.success === "boolean") {
      return response.success;
    }

    return Boolean(
      response?.submitted ||
        response?.data?.submitted ||
        response?.reset ||
        response?.data?.reset ||
        response?.resetToken ||
        response?.data?.resetToken
    );
  }

  function scheduleSigninRedirect() {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    redirectTimeoutRef.current = setTimeout(() => {
      redirectTimeoutRef.current = null;
      router.replace("/sign-in");
      router.refresh();
    }, SIGNIN_REDIRECT_DELAY_MS);
  }

  function clearResendCooldown() {
    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
      resendIntervalRef.current = null;
    }
    setResendSecondsLeft(0);
  }

  function startResendCooldown() {
    clearResendCooldown();
    setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);

    resendIntervalRef.current = setInterval(() => {
      setResendSecondsLeft((previous) => {
        if (previous <= 1) {
          if (resendIntervalRef.current) {
            clearInterval(resendIntervalRef.current);
            resendIntervalRef.current = null;
          }
          return 0;
        }

        return previous - 1;
      });
    }, 1000);
  }

  function onRequestCode() {
    void runAction("request", async () => {
      setSendCodeError("");
      setSendCodeInfo("");
      const email = getValidatedEmail();
      if (!email) return;

      const response = await requestPasswordReset({ email });
      if (!isResponseSuccess(response)) {
        const message =
          response?.message ||
          "Could not send verification code. Please try again.";
        setSendCodeError(message);
        toast.error(message);
        return;
      }

      setContext((previous) => ({
        ...previous,
        email,
        token: "",
      }));
      setHasSentCode(true);
      startResendCooldown();
      setSendCodeInfo("Verification code sent. Check your email inbox.");

      toast.success(response?.message || "Verification code sent.");
    });
  }

  function onSubmitVerify(data: TVerifyPasswordResetOtpSchema) {
    void runAction("verify", async () => {
      const email = normalizeEmail(data.email);
      verifyForm.setValue("email", email, { shouldValidate: true });

      const response = await verifyPasswordResetOtp({
        email,
        otp: data.otp,
      });
      if (!response?.success) {
        const message = response?.message || "Invalid verification code.";
        verifyForm.setError("otp", {
          type: "server",
          message,
        });
        toast.error(message);
        return;
      }

      const resetToken = response?.data?.resetToken || response?.resetToken;
      if (!resetToken) {
        const message = "Reset verification failed. Please request a new code.";
        verifyForm.setError("otp", {
          type: "server",
          message,
        });
        toast.error(message);
        return;
      }

      setContext((previous) => ({
        ...previous,
        email,
        token: resetToken,
      }));
      setHasSentCode(false);
      clearResendCooldown();
      setSendCodeError("");
      setSendCodeInfo("");
      setResetError("");
      resetForm.reset({
        password: "",
        confirmPassword: "",
      });
      setStep("reset");
      toast.success(response?.message || "Code verified.");
    });
  }

  function onSubmitReset(data: TResetPasswordFormSchema) {
    const token = context.token;
    if (!token) {
      setResetError("Reset session expired. Please verify the code again.");
      setStep("verify");
      toast.error("Reset session expired. Please verify the code again.");
      return;
    }

    void runAction("reset", async () => {
      setResetError("");
      const response = await confirmPasswordReset({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (!response?.success) {
        const message =
          response?.message || "Unable to reset password. Please try again.";
        setResetError(message);
        toast.error(message);
        if (message.toLowerCase().includes("reset token")) {
          setStep("verify");
        }
        return;
      }

      setContext((previous) => ({
        ...previous,
        token: "",
      }));
      setResetError("");
      resetForm.reset({
        password: "",
        confirmPassword: "",
      });
      setStep("success");

      toast.success(response?.message || "Password reset successful.");
      scheduleSigninRedirect();
    });
  }

  function onResendCode() {
    if (!hasSentCode) {
      return;
    }

    if (resendSecondsLeft > 0) {
      toast.message(`Please wait ${resendSecondsLeft}s before resending.`);
      return;
    }

    void runAction("resend", async () => {
      setSendCodeError("");
      const email = getValidatedEmail();
      if (!email) return;

      const response = await requestPasswordReset({ email });

      if (!isResponseSuccess(response)) {
        const message =
          response?.message || "Could not resend verification code.";
        setSendCodeError(message);
        toast.error(message);
        return;
      }

      verifyForm.setValue("otp", "", { shouldValidate: false });
      setContext((previous) => ({
        ...previous,
        email,
      }));
      setHasSentCode(true);
      startResendCooldown();
      setSendCodeInfo("A new verification code has been sent.");
      setResetError("");
      toast.success(response?.message || "A new verification code was sent.");
    });
  }

  function onUseDifferentEmail() {
    verifyForm.reset({
      email: "",
      otp: "",
    });
    setContext(INITIAL_CONTEXT);
    setResetError("");
    setSendCodeError("");
    setSendCodeInfo("");
    setHasSentCode(false);
    clearResendCooldown();
    toast.message("Enter another email to continue.");
  }

  function onBackToVerify() {
    verifyForm.setValue("otp", "", { shouldValidate: false });
    setContext((previous) => ({
      ...previous,
      token: "",
    }));
    setResetError("");
    setSendCodeError("");
    setSendCodeInfo("");
    setHasSentCode(false);
    clearResendCooldown();
    setStep("verify");
  }

  function onRedirectToSignin() {
    clearResendCooldown();
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    router.replace("/sign-in");
    router.refresh();
  }

  const isTransitioning = activeAction !== null;

  return {
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
    isRequesting: activeAction === "request",
    isVerifying: activeAction === "verify",
    isResending: activeAction === "resend",
    isResetting: activeAction === "reset",
    hasSentCode,
    resendSecondsLeft,
    sendCodeError,
    sendCodeInfo,
    resetError,
  };
};
