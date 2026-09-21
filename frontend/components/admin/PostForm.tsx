"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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

const inputClass =
  "mt-1 w-full rounded-lg border-2 border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900";

const pillButtonClass = (selected: boolean) =>
  `rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors ${
    selected
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-300 text-zinc-600 hover:border-zinc-900"
  }`;

export function PostForm({ tags, initialPost, submitLabel, onSubmit }: PostFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    initialPost?.tags.map((tag) => tag.id) ?? [],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
  const status = watch("status");

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
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-6">
      <div>
        <label htmlFor="title" className="block text-sm font-bold text-zinc-700">
          タイトル
        </label>
        <input id="title" {...register("title")} className={inputClass} />
        {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-bold text-zinc-700">
          スラッグ
        </label>
        <input id="slug" {...register("slug")} className={inputClass} />
        {errors.slug ? <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p> : null}
      </div>

      <div>
        <span className="block text-sm font-bold text-zinc-700">タグ</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              aria-pressed={selectedTagIds.includes(tag.id)}
              className={pillButtonClass(selectedTagIds.includes(tag.id))}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-sm font-bold text-zinc-700">ステータス</span>
        <div className="mt-2 flex gap-2">
          {(["draft", "published"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("status", value)}
              aria-pressed={status === value}
              className={pillButtonClass(status === value)}
            >
              {value === "draft" ? "下書き" : "公開"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex gap-2 border-b-2 border-zinc-200">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`-mb-0.5 px-3 py-2 text-sm font-bold transition-colors ${
              tab === "edit"
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`-mb-0.5 px-3 py-2 text-sm font-bold transition-colors ${
              tab === "preview"
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-700"
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
            className="mt-3 w-full rounded-lg border-2 border-zinc-300 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-zinc-900"
          />
        ) : (
          <div className="mt-3 rounded-lg border-2 border-zinc-300 p-4">
            <MarkdownPreview>{body || "*本文がありません*"}</MarkdownPreview>
          </div>
        )}
        {errors.body ? <p className="mt-1 text-sm text-red-600">{errors.body.message}</p> : null}
      </div>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg border-2 border-zinc-900 bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_0_#18181b] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#18181b] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? "保存中..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border-2 border-zinc-300 px-6 py-2.5 text-sm font-bold text-zinc-500 transition-colors hover:border-zinc-900 hover:text-zinc-900"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
