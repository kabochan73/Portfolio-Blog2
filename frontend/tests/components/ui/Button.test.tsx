import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders a native button and fires onClick", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders a Next.js Link instead of a button when href is provided", () => {
    render(<Button href="/admin/posts/new">New</Button>);

    const link = screen.getByRole("link", { name: "New" });
    expect(link).toHaveAttribute("href", "/admin/posts/new");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("disables the button when disabled is set", () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("applies variant-specific classes", () => {
    render(<Button variant="outline">Cancel</Button>);

    expect(screen.getByRole("button", { name: "Cancel" }).className).toContain(
      "hover:bg-zinc-900",
    );
  });
});
