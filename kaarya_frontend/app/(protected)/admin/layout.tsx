import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";
import { LogoutSection } from "../(dashboard)/overview/_components/logout-section";
import kaaryaLogo from "@/assets/kaarya.png";

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
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-8 rounded-2xl border border-border/60 bg-background/70 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Image
                  src={kaaryaLogo}
                  width={100}
                  height={100}
                  alt="Image"
                  className="h-10 w-10 object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Admin Panel
                </p>
                <h1 className="text-lg font-semibold">Kaarya</h1>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/admin/users"
                className="rounded-full px-4 py-2 text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
              >
                Users
              </Link>

              <Link
                href="/overview"
                className="rounded-full px-4 py-2 text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
              >
                Overview
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <LogoutSection />
            </div>
          </div>
        </header>

        {children}
      </div>
    </section>
  );
}
