import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="space-y-2">
      <h1>Hello World, I am Landing Page</h1>

      <div className="space-x-2">
        <Button>
          <Link href="/sign-in">Sign In</Link>
        </Button>

        <Button variant="secondary">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    </section>
  );
}
