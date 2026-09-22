import { fireEvent, render, screen } from "@testing-library/react";

import { Pill } from "@/components/ui/Pill";

describe("Pill", () => {
  it("reflects the selected state via aria-pressed and styling", () => {
    const { rerender } = render(<Pill selected={false}>Next.js</Pill>);
    let pill = screen.getByRole("button", { name: "Next.js" });
    expect(pill).toHaveAttribute("aria-pressed", "false");
    expect(pill.className).toContain("border-zinc-300");

    rerender(<Pill selected>Next.js</Pill>);
    pill = screen.getByRole("button", { name: "Next.js" });
    expect(pill).toHaveAttribute("aria-pressed", "true");
    expect(pill.className).toContain("bg-zinc-900");
  });

  it("fires onClick when pressed", () => {
    const onClick = jest.fn();
    render(<Pill onClick={onClick}>Draft</Pill>);

    fireEvent.click(screen.getByRole("button", { name: "Draft" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
