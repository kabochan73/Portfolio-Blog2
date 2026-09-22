import { render, screen } from "@testing-library/react";

import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("renders a div and skips the pressable styling when no href is given", () => {
    render(<Card>content</Card>);

    expect(screen.getByText("content").tagName).toBe("DIV");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("content").className).not.toContain("active:translate-x-1");
  });

  it("renders a Next.js Link with the press-down styling when href is given", () => {
    render(<Card href="/posts/hello">content</Card>);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/posts/hello");
    expect(link.className).toContain("active:translate-x-1");
  });
});
