import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/dal";

export default async function Home() {
  const currentUser = await getCurrentUser();

  return (
    <section className="space-y-2">
      <h1>Hello World, I am Landing Page</h1>

      <div className="space-x-2">
        {!currentUser ? (
          <>
            <Button>
              <Link href="/sign-in">Sign In</Link>
            </Button>

            <Button variant="secondary">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </>
        ) : (
          <p>Hello, {currentUser.name}</p>
        )}
      </div>
    </section>
  );
}
