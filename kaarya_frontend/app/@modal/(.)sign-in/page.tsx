import { SigninForm } from "@/app/(auth)/_components/sign-in-form";
import { Modal } from "@/components/ui/modal";

export default function SigninPage() {
  return (
    <Modal>
      <div className="space-y-7">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Welcome back to Kaarya!</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your username and password to access your account
          </p>
        </div>

        <SigninForm />
      </div>
    </Modal>
  );
}
