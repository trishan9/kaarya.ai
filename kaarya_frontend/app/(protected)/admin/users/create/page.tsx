import { CreateUserForm } from "../_components/create-user-form";
import { CreateUserHeader } from "./_components/create-user-header";

export default function AdminUserCreatePage() {
  return (
    <section className="space-y-8">
      <CreateUserHeader />
      <CreateUserForm />
    </section>
  );
}
