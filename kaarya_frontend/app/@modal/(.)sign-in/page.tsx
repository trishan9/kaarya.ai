import { SigninForm } from "@/app/(auth)/_components/sign-in-form";
import { Modal } from "@/components/ui/modal";

export default function SigninPage() {
  return (
    <Modal>
      <SigninForm />
    </Modal>
  );
}
