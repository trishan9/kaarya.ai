import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import kaaryaLogo from "@/assets/kaarya.png";
import { FeatureCarousel } from "./_components/features-carousel";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (user) {
    return redirect("/overview");
  }

  return (
    <main className="grid h-svh gap-3 overflow-hidden bg-accent p-3 lg:grid-cols-12">
      <div className="no-scrollbar col-span-5 min-h-0 overflow-y-auto bg-white">
        <div className="flex min-h-full flex-col gap-6 p-4 md:p-10">
          <Link href="/" className="flex items-center gap-4 font-medium">
            <Image
              src={kaaryaLogo}
              width={100}
              height={100}
              alt="Image"
              className="h-10 w-10 object-cover dark:brightness-[0.2] dark:grayscale"
            />

            <span className="text-3xl font-bold">Kaarya</span>
          </Link>

          <div className="flex flex-1 items-center justify-center py-2">
            <div className="w-full max-w-lg">{children}</div>
          </div>
        </div>
      </div>

      <div className="relative col-span-7 hidden h-full overflow-hidden bg-secondary p-4 lg:block">
        <div className="h-full w-full">
          <FeatureCarousel />
        </div>
      </div>
    </main>
  );
}
