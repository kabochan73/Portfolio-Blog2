export type ApiResponse<T> = {
  data: T;
};

export type User = {
  id: number;
  name: string;
  email: string;
};

export type PostStatus = "draft" | "published";

export type Tag = {
  id: number;
  name: string;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  body: string;
  thumbnail_url: string | null;
  status: PostStatus;
  tags: Tag[];
  created_at: string;
  updated_at: string;
};
