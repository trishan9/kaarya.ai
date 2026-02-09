import { ForgotPasswordFlow } from "../_components/forgot-password-flow";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-7">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Reset with a secure email link or OTP in a few secure steps.
        </p>
      </div>

      <ForgotPasswordFlow />
    </div>
  );
}
