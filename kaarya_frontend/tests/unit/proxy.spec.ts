import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("proxy route access", () => {
  it("allows forgot-password without auth token", () => {
    const request = new NextRequest("http://localhost/forgot-password");
    const response = proxy(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows oauth finalize without auth token", () => {
    const request = new NextRequest("http://localhost/oauth/finalize?token=test");
    const response = proxy(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects protected routes to sign-in when unauthenticated", () => {
    const request = new NextRequest("http://localhost/overview");
    const response = proxy(request);

    expect(response.headers.get("location")).toBe("http://localhost/sign-in");
  });
});
