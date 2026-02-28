import { render, screen } from "@testing-library/react";
import { NavLink } from "@/app/(public)/_components/NavLink";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("NavLink", () => {
  it("renders link with href and children", () => {
    render(<NavLink href="/pricing">Pricing</NavLink>);

    const link = screen.getByRole("link", { name: "Pricing" });
    expect(link).toHaveAttribute("href", "/pricing");
    expect(link.className).toContain("hover:bg-slate-100");
  });
});
