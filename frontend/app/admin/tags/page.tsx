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
    <div>
      <h1 className="text-xl font-bold text-zinc-900">タグ管理</h1>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいタグ名"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white">
          追加
        </button>
      </form>
      {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}

      {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}
      {deleteError ? <p className="mt-4 text-sm text-red-600">{deleteError}</p> : null}

      <ul className="mt-6 flex flex-col gap-2">
        {tags?.map((tag) => (
          <li
            key={tag.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2"
          >
            {editingId === tag.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(tag.id)}
                  className="text-sm text-zinc-900 hover:underline"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-sm text-zinc-500 hover:underline"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-zinc-900">{tag.name}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="text-sm text-zinc-500 hover:text-zinc-900"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tag.id)}
                    className="text-sm text-red-600 hover:text-red-800"
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
