"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MarkdownPreview } from "@/components/posts/MarkdownPreview";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { TextInput } from "@/components/ui/TextInput";
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
          Title
        </label>
        <TextInput id="title" {...register("title")} className="mt-1 w-full" />
        {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-bold text-zinc-700">
         Slug
        </label>
        <TextInput id="slug" {...register("slug")} className="mt-1 w-full" />
        {errors.slug ? <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p> : null}
      </div>

      <div>
        <span className="block text-sm font-bold text-zinc-700">Tags</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Pill
              key={tag.id}
              selected={selectedTagIds.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-sm font-bold text-zinc-700">Status</span>
        <div className="mt-2 flex gap-2">
          {(["draft", "published"] as const).map((value) => (
            <Pill key={value} selected={status === value} onClick={() => setValue("status", value)}>
              {value === "draft" ? "Draft" : "Published"}
            </Pill>
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
            Edit
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
            Preview
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
