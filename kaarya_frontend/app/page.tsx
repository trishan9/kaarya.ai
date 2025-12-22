import Link from "next/link";

export default function Home() {
  return (
    <div className="p-4">
      <h1>Hello World</h1>
      <Link href="/sign-in" className="text-blue-400">
        Sign In
      </Link>{" "}
      <Link href="/sign-up" className="text-blue-400">
        Sign Up
      </Link>
    </div>
  );
}
