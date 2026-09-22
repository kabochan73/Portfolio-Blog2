import { adminFetchJson } from "@/lib/admin/auth";
import type { ApiResponse } from "@/types";

export type ThumbnailUpload = {
  thumbnail_path: string;
  thumbnail_url: string;
};

export async function uploadThumbnail(file: File): Promise<ThumbnailUpload> {
  const formData = new FormData();
  formData.append("thumbnail", file);

  const { data } = await adminFetchJson<ApiResponse<ThumbnailUpload>>("/admin/uploads/thumbnail", {
    method: "POST",
    body: formData,
  });

  return data;
}
