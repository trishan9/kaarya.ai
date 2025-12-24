import { SignupForm } from "@/app/(auth)/_components/sign-up-form";
import { Modal } from "@/components/ui/modal";

export default function SignupPage() {
  return (
    <Modal>
      <SignupForm />
    </Modal>
  );
}
