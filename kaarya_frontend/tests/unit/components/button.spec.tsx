import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("components/ui/button", () => {
  it("renders default button props and classes", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it("supports asChild rendering", () => {
    render(
      <Button asChild variant="outline" size="sm">
        <a href="/settings">Settings</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Settings" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/settings");
    expect(link).toHaveAttribute("data-variant", "outline");
    expect(link).toHaveAttribute("data-size", "sm");
  });
});
