import { getCurrentUser } from "@/lib/dal";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (!user) {
    return redirect("/sign-in");
  }

  return children;
}
