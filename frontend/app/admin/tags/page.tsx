"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
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
        <TextInput
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいタグ名"
        />
        <Button type="submit">追加</Button>
      </form>
      {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}

      {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}
      {deleteError ? <p className="mt-4 text-sm text-red-600">{deleteError}</p> : null}

      <ul className="mt-6 flex flex-col gap-3">
        {tags?.map((tag) => (
          <li key={tag.id}>
            <Card className="flex items-center justify-between px-4 py-3">
              {editingId === tag.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <TextInput
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => handleUpdate(tag.id)}>
                    保存
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    キャンセル
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-xl font-semibold text-zinc-900">{tag.name}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(tag)}>
                      編集
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(tag.id)}>
                      削除
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </li>
        ))}
      </ul>
      {editError ? <p className="mt-2 text-sm text-red-600">{editError}</p> : null}
    </div>
  );
}
