jest.mock("@/lib/admin/auth", () => ({ adminFetchJson: jest.fn() }));
jest.mock("@/lib/admin/revalidate", () => ({ revalidateTags: jest.fn() }));

describe("lib/admin/api.posts", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("createPost posts the input and revalidates the posts tag", async () => {
    const { adminFetchJson } = await import("@/lib/admin/auth");
    const { revalidateTags } = await import("@/lib/admin/revalidate");
    const post = { id: 1, slug: "hello" };
    (adminFetchJson as jest.Mock).mockResolvedValue({ data: post });

    const { createPost } = await import("@/lib/admin/api.posts");
    const input = { title: "t", slug: "hello", body: "b", status: "draft" as const };

    const result = await createPost(input);

    expect(adminFetchJson).toHaveBeenCalledWith("/admin/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
    expect(revalidateTags).toHaveBeenCalledWith(["posts"]);
    expect(result).toEqual(post);
  });

  it("updatePost puts the input and revalidates the posts + post:slug tags", async () => {
    const { adminFetchJson } = await import("@/lib/admin/auth");
    const { revalidateTags } = await import("@/lib/admin/revalidate");
    const post = { id: 1, slug: "hello-2" };
    (adminFetchJson as jest.Mock).mockResolvedValue({ data: post });

    const { updatePost } = await import("@/lib/admin/api.posts");

    const result = await updatePost(1, { title: "t2" });

    expect(adminFetchJson).toHaveBeenCalledWith("/admin/posts/1", {
      method: "PUT",
      body: JSON.stringify({ title: "t2" }),
    });
    expect(revalidateTags).toHaveBeenCalledWith(["posts", "post:hello-2"]);
    expect(result).toEqual(post);
  });

  it("deletePost deletes by id and revalidates the posts + post:slug tags", async () => {
    const { adminFetchJson } = await import("@/lib/admin/auth");
    const { revalidateTags } = await import("@/lib/admin/revalidate");
    (adminFetchJson as jest.Mock).mockResolvedValue(undefined);

    const { deletePost } = await import("@/lib/admin/api.posts");

    await deletePost(1, "hello");

    expect(adminFetchJson).toHaveBeenCalledWith("/admin/posts/1", { method: "DELETE" });
    expect(revalidateTags).toHaveBeenCalledWith(["posts", "post:hello"]);
  });
});
