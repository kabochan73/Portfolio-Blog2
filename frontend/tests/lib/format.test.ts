import { formatDate } from "@/lib/format";

describe("formatDate", () => {
  it("formats an ISO date string as YYYY.MM.DD", () => {
    expect(formatDate("2026-03-05T10:00:00.000Z")).toBe("2026.03.05");
  });

  it("zero-pads single-digit months and days", () => {
    expect(formatDate("2026-01-02T00:00:00.000Z")).toBe("2026.01.02");
  });
});
