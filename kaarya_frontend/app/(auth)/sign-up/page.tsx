import { SignupForm } from "../_components/sign-up-form";

export default function SignupPage() {
  return (
    <div className="space-y-7">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Welcome to Kaarya! Let’s get started by creating your account.
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
