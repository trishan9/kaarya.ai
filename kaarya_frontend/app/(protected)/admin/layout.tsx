import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  if (user.role !== Role.ADMIN) {
    return redirect("/overview");
  }

  return (
    <section className="min-h-screen bg-linear-to-br from-background via-background to-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </section>
  );
}
