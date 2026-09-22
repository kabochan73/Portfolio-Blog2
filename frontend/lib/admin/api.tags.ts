import { adminFetchJson } from "@/lib/admin/auth";
import { revalidateTags } from "@/lib/admin/revalidate";
import type { ApiResponse, Tag } from "@/types";

export type TagInput = {
  name: string;
};

export async function listAdminTags(): Promise<Tag[]> {
  const { data } = await adminFetchJson<ApiResponse<Tag[]>>("/admin/tags");

  return data;
}

export async function createTag(input: TagInput): Promise<Tag> {
  const { data } = await adminFetchJson<ApiResponse<Tag>>("/admin/tags", {
    method: "POST",
    body: JSON.stringify(input),
  });

  await revalidateTags(["tags", "posts"]);

  return data;
}

export async function updateTag(id: number, input: TagInput): Promise<Tag> {
  const { data } = await adminFetchJson<ApiResponse<Tag>>(`/admin/tags/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  await revalidateTags(["tags", "posts"]);

  return data;
}

export async function deleteTag(id: number): Promise<void> {
  await adminFetchJson<void>(`/admin/tags/${id}`, { method: "DELETE" });

  await revalidateTags(["tags", "posts"]);
}
