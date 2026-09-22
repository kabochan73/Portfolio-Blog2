import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { TextInput } from "@/components/ui/TextInput";

describe("TextInput", () => {
  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextInput ref={ref} aria-label="Email" />);

    expect(ref.current).toBe(screen.getByLabelText("Email"));
  });

  it("merges a custom className with the base styling", () => {
    render(<TextInput aria-label="Email" className="w-full" />);

    const input = screen.getByLabelText("Email");
    expect(input.className).toContain("w-full");
    expect(input.className).toContain("border-zinc-300");
  });

  it("passes through native input props and reflects typed values", () => {
    render(<TextInput aria-label="Email" placeholder="you@example.com" />);

    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.placeholder).toBe("you@example.com");

    fireEvent.change(input, { target: { value: "a@b.com" } });
    expect(input.value).toBe("a@b.com");
  });
});
