"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { createTag, deleteTag, listAdminTags, updateTag } from "@/lib/admin/api.tags";
import { ApiError } from "@/lib/http";
import type { Tag } from "@/types";

function byName(a: Tag, b: Tag): number {
  return a.name.localeCompare(b.name);
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    listAdminTags()
      .then(setTags)
      .catch((e: unknown) => {
        setLoadError(e instanceof ApiError ? e.message : "読み込みに失敗しました");
      });
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      const tag = await createTag({ name: newName });
      setTags((prev) => [...(prev ?? []), tag].sort(byName));
      setNewName("");
    } catch (e) {
      setCreateError(e instanceof ApiError ? e.message : "作成に失敗しました");
    }
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditError(null);
  }

  async function handleUpdate(id: number) {
    setEditError(null);
    try {
      const updated = await updateTag(id, { name: editingName });
      setTags((prev) => prev?.map((tag) => (tag.id === id ? updated : tag)).sort(byName) ?? null);
      setEditingId(null);
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : "更新に失敗しました");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("このタグを削除しますか？")) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteTag(id);
      setTags((prev) => prev?.filter((tag) => tag.id !== id) ?? null);
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "削除に失敗しました");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-4xl font-bold text-zinc-900">TAG</h1>

      <form onSubmit={handleCreate} className="mt-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいタグ名"
          className="rounded-lg border-2 border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_#18181b] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#18181b] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none"
        >
          追加
        </button>
      </form>
      {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}

      {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}
      {deleteError ? <p className="mt-4 text-sm text-red-600">{deleteError}</p> : null}

      <ul className="mt-6 flex flex-col gap-3">
        {tags?.map((tag) => (
          <li
            key={tag.id}
            className="flex items-center justify-between rounded-xl border-2 border-zinc-400 bg-white px-4 py-3 shadow-[4px_4px_0_0_#18181b] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#18181b]"
          >
            {editingId === tag.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 rounded-lg border-2 border-zinc-300 px-2 py-1 text-sm outline-none transition-colors focus:border-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(tag.id)}
                  className="rounded-lg border-2 border-zinc-900 px-3 py-1 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border-2 border-zinc-300 px-3 py-1 text-sm font-bold text-zinc-500 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <>
                <span className="text-xl font-semibold text-zinc-900">{tag.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="rounded-lg border-2 border-zinc-900 px-3 py-1 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tag.id)}
                    className="rounded-lg border-2 border-red-600 px-3 py-1 text-sm font-bold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                  >
                    削除
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {editError ? <p className="mt-2 text-sm text-red-600">{editError}</p> : null}
    </div>
  );
}
