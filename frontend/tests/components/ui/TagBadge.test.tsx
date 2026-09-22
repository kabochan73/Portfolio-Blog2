import { render, screen } from "@testing-library/react";

import { TagBadge } from "@/components/ui/TagBadge";

describe("TagBadge", () => {
  it("renders its children", () => {
    render(<TagBadge>Next.js</TagBadge>);

    expect(screen.getByText("Next.js")).toBeInTheDocument();
  });
});
