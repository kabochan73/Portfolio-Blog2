/**
 * @jest-environment node
 */
import { revalidateTag } from "next/cache";

import { POST } from "@/app/api/revalidate/route";

jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    (revalidateTag as jest.Mock).mockReset();
  });

  it("revalidates each allowed tag immediately", async () => {
    const res = await POST(makeRequest({ tags: ["posts", "tags", "post:my-slug"] }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      revalidated: true,
      tags: ["posts", "tags", "post:my-slug"],
    });
    expect(revalidateTag).toHaveBeenCalledTimes(3);
    expect(revalidateTag).toHaveBeenCalledWith("posts", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("tags", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("post:my-slug", { expire: 0 });
  });

  it("rejects an empty tags array", async () => {
    const res = await POST(makeRequest({ tags: [] }));

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a tag outside the allow-list", async () => {
    const res = await POST(makeRequest({ tags: ["posts", "not a valid tag!"] }));

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a request with no tags field", async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("rejects an unparsable body", async () => {
    const res = await POST(
      new Request("http://localhost/api/revalidate", { method: "POST", body: "not json" }),
    );

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
