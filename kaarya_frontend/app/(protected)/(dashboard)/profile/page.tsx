import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/dal";
import { ProfileHeader } from "./_components/profile-header";
import { ProfileOverview } from "./_components/profile-overview";
import { ProfileRating } from "./_components/profile-rating";
import { ProfileForm } from "./_components/profile-form";

export const metadata: Metadata = {
  title: "Profile | Kaarya.ai",
  description: "Update your profile information",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <ProfileHeader />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-8 flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
            <div className="w-full">
              <ProfileOverview user={user} />
            </div>
            <div className="w-full lg:w-auto">
              <ProfileRating />
            </div>
          </div>
          <div className="lg:col-span-4 w-full">
            <ProfileForm user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
