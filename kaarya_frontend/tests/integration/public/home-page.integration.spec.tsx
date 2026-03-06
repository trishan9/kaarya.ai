import { render, screen } from "@testing-library/react";
import HomePage from "@/app/(public)/page";

const { getCurrentUserMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/app/(public)/_components/Header", () => ({
  Header: ({ isLoggedIn }: { isLoggedIn: boolean }) => (
    <header data-testid="header">{isLoggedIn ? "logged-in" : "logged-out"}</header>
  ),
}));

vi.mock("@/app/(public)/_components/Hero", () => ({
  Hero: () => <section>Hero Section</section>,
}));

vi.mock("@/app/(public)/_components/PrimaryFeatures", () => ({
  PrimaryFeatures: () => <section>Primary Features</section>,
}));

vi.mock("@/app/(public)/_components/Testimonials", () => ({
  Testimonials: () => <section>Testimonials</section>,
}));

vi.mock("@/app/(public)/_components/Pricing", () => ({
  Pricing: () => <section>Pricing</section>,
}));

vi.mock("@/app/(public)/_components/Faqs", () => ({
  Faqs: () => <section>Faqs</section>,
}));

vi.mock("@/app/(public)/_components/CallToAction", () => ({
  CallToAction: () => <section>Call To Action</section>,
}));

vi.mock("@/app/(public)/_components/Footer", () => ({
  Footer: () => <footer>Footer</footer>,
}));

describe("Public HomePage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders marketing sections for guests", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);

    const page = await HomePage();
    render(page);

    expect(screen.getByTestId("header")).toHaveTextContent("logged-out");
    expect(screen.getByText("Hero Section")).toBeInTheDocument();
    expect(screen.getByText("Primary Features")).toBeInTheDocument();
    expect(screen.getByText("Testimonials")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Faqs")).toBeInTheDocument();
    expect(screen.getByText("Call To Action")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("marks header as logged in when session exists", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
    });

    const page = await HomePage();
    render(page);

    expect(screen.getByTestId("header")).toHaveTextContent("logged-in");
  });
});
