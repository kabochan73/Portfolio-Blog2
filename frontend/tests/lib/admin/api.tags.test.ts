jest.mock("@/lib/admin/auth", () => ({ adminFetchJson: jest.fn() }));
jest.mock("@/lib/admin/revalidate", () => ({ revalidateTags: jest.fn() }));

describe("lib/admin/api.tags", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("createTag posts the input and revalidates tags + posts", async () => {
    const { adminFetchJson } = await import("@/lib/admin/auth");
    const { revalidateTags } = await import("@/lib/admin/revalidate");
    const tag = { id: 1, name: "Next.js" };
    (adminFetchJson as jest.Mock).mockResolvedValue({ data: tag });

    const { createTag } = await import("@/lib/admin/api.tags");
    const result = await createTag({ name: "Next.js" });

    expect(adminFetchJson).toHaveBeenCalledWith("/admin/tags", {
      method: "POST",
      body: JSON.stringify({ name: "Next.js" }),
    });
    expect(revalidateTags).toHaveBeenCalledWith(["tags", "posts"]);
    expect(result).toEqual(tag);
  });

  it("updateTag puts the input and revalidates tags + posts", async () => {
    const { adminFetchJson } = await import("@/lib/admin/auth");
    const { revalidateTags } = await import("@/lib/admin/revalidate");
    const tag = { id: 1, name: "Renamed" };
    (adminFetchJson as jest.Mock).mockResolvedValue({ data: tag });

    const { updateTag } = await import("@/lib/admin/api.tags");
    const result = await updateTag(1, { name: "Renamed" });

    expect(adminFetchJson).toHaveBeenCalledWith("/admin/tags/1", {
      method: "PUT",
      body: JSON.stringify({ name: "Renamed" }),
    });
    expect(revalidateTags).toHaveBeenCalledWith(["tags", "posts"]);
    expect(result).toEqual(tag);
  });

  it("deleteTag deletes by id and revalidates tags + posts", async () => {
    const { adminFetchJson } = await import("@/lib/admin/auth");
    const { revalidateTags } = await import("@/lib/admin/revalidate");
    (adminFetchJson as jest.Mock).mockResolvedValue(undefined);

    const { deleteTag } = await import("@/lib/admin/api.tags");
    await deleteTag(1);

    expect(adminFetchJson).toHaveBeenCalledWith("/admin/tags/1", { method: "DELETE" });
    expect(revalidateTags).toHaveBeenCalledWith(["tags", "posts"]);
  });
});
