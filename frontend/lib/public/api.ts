import type { ApiResponse, Post, Tag } from "@/types";

// Server-side origin (e.g. the Docker-internal backend host), distinct from
// NEXT_PUBLIC_API_URL which the browser uses.
const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

async function fetchJson<T>(path: string, tags: string[]): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 7200, tags },
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as T;
  } catch {
    // Backend unreachable (e.g. right after deploy) shouldn't crash rendering.
    return null;
  }
}

export async function getPosts(): Promise<Post[]> {
  const json = await fetchJson<ApiResponse<Post[]>>("/posts", ["posts", "tags"]);

  return json?.data ?? [];
}

export async function getPost(slug: string): Promise<Post | null> {
  const json = await fetchJson<ApiResponse<Post>>(`/posts/${slug}`, ["posts", `post:${slug}`]);

  return json?.data ?? null;
}

export async function getTags(): Promise<Tag[]> {
  const json = await fetchJson<ApiResponse<Tag[]>>("/tags", ["tags"]);

  return json?.data ?? [];
}
