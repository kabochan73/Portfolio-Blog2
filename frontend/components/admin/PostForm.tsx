"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MarkdownPreview } from "@/components/posts/MarkdownPreview";
import type { PostInput } from "@/lib/admin/api.posts";
import { ApiError } from "@/lib/http";
import type { Post, Tag } from "@/types";

const schema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(30, "30文字以内で入力してください"),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .max(30, "30文字以内で入力してください")
    .regex(/^[a-zA-Z0-9_-]+$/, "半角英数字・ハイフン・アンダースコアのみ使用できます"),
  body: z.string().min(1, "本文を入力してください"),
  status: z.enum(["draft", "published"]),
});

type FormValues = z.infer<typeof schema>;

type PostFormProps = {
  tags: Tag[];
  initialPost?: Post;
  submitLabel: string;
  onSubmit: (input: PostInput) => Promise<void>;
};

export function PostForm({ tags, initialPost, submitLabel, onSubmit }: PostFormProps) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    initialPost?.tags.map((tag) => tag.id) ?? [],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialPost?.title ?? "",
      slug: initialPost?.slug ?? "",
      body: initialPost?.body ?? "",
      status: initialPost?.status ?? "draft",
    },
  });

  const body = watch("body");

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tagId) => tagId !== id) : [...prev, id],
    );
  }

  async function submit(values: FormValues) {
    setSubmitError(null);
    try {
      await onSubmit({ ...values, tag_ids: selectedTagIds });
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        let hasFieldError = false;
        for (const [field, messages] of Object.entries(e.errors)) {
          if (field in schema.shape && messages[0]) {
            setError(field as keyof FormValues, { message: messages[0] });
            hasFieldError = true;
          }
        }
        if (!hasFieldError) {
          setSubmitError(e.message);
        }
        return;
      }
      setSubmitError(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700">
          タイトル
        </label>
        <input
          id="title"
          {...register("title")}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-zinc-700">
          スラッグ
        </label>
        <input
          id="slug"
          {...register("slug")}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        {errors.slug ? <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p> : null}
      </div>

      <div>
        <span className="block text-sm font-medium text-zinc-700">タグ</span>
        <div className="mt-1 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-1 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-zinc-700">
          ステータス
        </label>
        <select
          id="status"
          {...register("status")}
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="draft">下書き</option>
          <option value="published">公開</option>
        </select>
      </div>

      <div>
        <div className="flex gap-2 border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`px-3 py-2 text-sm ${
              tab === "edit"
                ? "border-b-2 border-zinc-900 font-medium text-zinc-900"
                : "text-zinc-500"
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-3 py-2 text-sm ${
              tab === "preview"
                ? "border-b-2 border-zinc-900 font-medium text-zinc-900"
                : "text-zinc-500"
            }`}
          >
            プレビュー
          </button>
        </div>

        {tab === "edit" ? (
          <textarea
            id="body"
            {...register("body")}
            rows={16}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
          />
        ) : (
          <div className="mt-2 rounded-lg border border-zinc-200 p-4">
            <MarkdownPreview>{body || "*本文がありません*"}</MarkdownPreview>
          </div>
        )}
        {errors.body ? <p className="mt-1 text-sm text-red-600">{errors.body.message}</p> : null}
      </div>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
