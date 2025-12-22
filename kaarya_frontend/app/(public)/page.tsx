import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Hello World, I am Landing Page</h1>
      <Link href="/sign-in" className="text-blue-400">
        Sign In
      </Link>{" "}
      <Link href="/sign-up" className="text-blue-400">
        Sign Up
      </Link>
    </div>
  );
}
