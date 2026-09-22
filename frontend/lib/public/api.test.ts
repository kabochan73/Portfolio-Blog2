describe("lib/public/api", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("getPosts fetches /posts tagged with posts and tags, revalidating every 2 hours", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 1 }] }),
    } as unknown as Response);
    const { getPosts } = await import("@/lib/public/api");

    const posts = await getPosts();

    expect(posts).toEqual([{ id: 1 }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/posts$/);
    expect(init).toEqual({ next: { revalidate: 7200, tags: ["posts", "tags"] } });
  });

  it("getPosts returns an empty array when the response isn't ok", async () => {
    fetchMock.mockResolvedValue({ ok: false } as Response);
    const { getPosts } = await import("@/lib/public/api");

    await expect(getPosts()).resolves.toEqual([]);
  });

  it("getPosts returns an empty array when the backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("fetch failed"));
    const { getPosts } = await import("@/lib/public/api");

    await expect(getPosts()).resolves.toEqual([]);
  });

  it("getPost fetches /posts/:slug tagged with the specific post tag", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1, slug: "hello" } }),
    } as unknown as Response);
    const { getPost } = await import("@/lib/public/api");

    const post = await getPost("hello");

    expect(post).toEqual({ id: 1, slug: "hello" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/posts\/hello$/);
    expect(init).toEqual({ next: { revalidate: 7200, tags: ["posts", "post:hello"] } });
  });

  it("getPost returns null when the post isn't found", async () => {
    fetchMock.mockResolvedValue({ ok: false } as Response);
    const { getPost } = await import("@/lib/public/api");

    await expect(getPost("missing")).resolves.toBeNull();
  });

  it("getTags fetches /tags tagged with tags", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 1, name: "Next.js" }] }),
    } as unknown as Response);
    const { getTags } = await import("@/lib/public/api");

    const tags = await getTags();

    expect(tags).toEqual([{ id: 1, name: "Next.js" }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/tags$/);
    expect(init).toEqual({ next: { revalidate: 7200, tags: ["tags"] } });
  });
});
