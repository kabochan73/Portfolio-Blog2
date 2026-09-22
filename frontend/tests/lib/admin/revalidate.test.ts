describe("lib/admin/revalidate", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("posts the given tags to /api/revalidate", async () => {
    fetchMock.mockResolvedValue({ ok: true } as Response);
    const { revalidateTags } = await import("@/lib/admin/revalidate");

    await revalidateTags(["posts", "post:my-slug"]);

    expect(fetchMock).toHaveBeenCalledWith("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: ["posts", "post:my-slug"] }),
    });
  });

  it("swallows fetch failures instead of throwing", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const { revalidateTags } = await import("@/lib/admin/revalidate");

    await expect(revalidateTags(["posts"])).resolves.toBeUndefined();
  });
});
