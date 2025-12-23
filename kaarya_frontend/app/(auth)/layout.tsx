import { getCurrentUser } from "@/lib/dal";
import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import kaaryaLogo from "@/assets/kaarya.png";

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
    <main className="grid min-h-svh lg:grid-cols-3 gap-3 p-3 bg-accent">
      <div className="flex flex-col gap-4 p-4 md:p-10 bg-white">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src={kaaryaLogo}
              width={100}
              height={100}
              alt="Image"
              className="h-6 w-6 object-cover dark:brightness-[0.2] dark:grayscale"
            />
            Kaarya
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>

      <div className="relative hidden lg:block col-span-2 p-4 bg-secondary">
        <div className="h-full w-full">Kaarya Slider</div>
      </div>
    </main>
  );
}
