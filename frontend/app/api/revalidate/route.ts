import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const STATIC_TAGS = new Set(["posts", "tags"]);

function isValidTag(tag: unknown): tag is string {
  return typeof tag === "string" && (STATIC_TAGS.has(tag) || /^post:[a-zA-Z0-9_-]+$/.test(tag));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const tags: unknown = body?.tags;

  if (!Array.isArray(tags) || tags.length === 0 || !tags.every(isValidTag)) {
    return NextResponse.json({ message: "invalid tags" }, { status: 400 });
  }

  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  return NextResponse.json({ revalidated: true, tags });
}
