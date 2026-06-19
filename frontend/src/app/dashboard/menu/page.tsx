"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Select } from "@/design-system/select";
import { Modal } from "@/design-system/modal";
import { useConfirm } from "@/design-system/confirm-dialog";
import { useToast } from "@/features/dashboard/toast";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { money } from "@/lib/format";

interface ItemDraft {
  id?: string;
  name: string;
  price: string;
  categoryId: string;
  isAvailable: boolean;
}

export default function MenuPage() {
  const { currency } = useOutlet();
  const confirm = useConfirm();
  const toast = useToast();
  const categories = useApi<MenuCategory[]>("/menu/categories");
  const items = useApi<MenuItem[]>("/menu/items");

  const [catModal, setCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cats = categories.data ?? [];
  const allItems = items.data ?? [];

  function refetchAll() {
    categories.refetch();
    items.refetch();
  }

  async function createCategory() {
    if (!catName.trim()) return;
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/menu/categories", { method: "POST", body: { name: catName.trim() }, auth: true });
      setCatName("");
      setCatModal(false);
      toast.success("Category created");
      categories.refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create category.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(id: string) {
    const ok = await confirm({
      title: "Delete category?",
      description: "This also deletes its items. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/menu/categories/${id}`, { method: "DELETE", auth: true });
      toast.success("Category deleted");
      refetchAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete category.");
    }
  }

  function openNewItem() {
    if (cats.length === 0) return;
    setFormError(null);
    setItemDraft({ name: "", price: "", categoryId: cats[0].id, isAvailable: true });
  }

  function openEditItem(it: MenuItem) {
    setFormError(null);
    setItemDraft({
      id: it.id,
      name: it.name,
      price: String(it.price),
      categoryId: it.categoryId,
      isAvailable: it.isAvailable,
    });
  }

  async function saveItem() {
    if (!itemDraft) return;
    const price = Number(itemDraft.price);
    if (!itemDraft.name.trim() || !Number.isFinite(price) || price < 0) {
      setFormError("Enter a name and a valid price.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      if (itemDraft.id) {
        await apiFetch(`/menu/items/${itemDraft.id}`, {
          method: "PATCH",
          body: { name: itemDraft.name.trim(), price, categoryId: itemDraft.categoryId },
          auth: true,
        });
      } else {
        await apiFetch("/menu/items", {
          method: "POST",
          body: { name: itemDraft.name.trim(), price, categoryId: itemDraft.categoryId },
          auth: true,
        });
      }
      setItemDraft(null);
      toast.success(itemDraft.id ? "Item updated" : "Item created");
      items.refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save item.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability(it: MenuItem) {
    try {
      await apiFetch(`/menu/items/${it.id}/availability`, {
        method: "PATCH",
        body: { isAvailable: !it.isAvailable },
        auth: true,
      });
      toast.success(it.isAvailable ? "Marked unavailable" : "Marked available");
      items.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update availability.");
    }
  }

  async function deleteItem(id: string) {
    const ok = await confirm({
      title: "Delete item?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/menu/items/${id}`, { method: "DELETE", auth: true });
      toast.success("Item deleted");
      items.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete item.");
    }
  }

  return (
    <>
      <PageHeader
        title="Menu"
        subtitle="Manage categories and items."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCatModal(true)}>
              <Plus className="h-4 w-4" /> Category
            </Button>
            <Button onClick={openNewItem} disabled={cats.length === 0}>
              <Plus className="h-4 w-4" /> Item
            </Button>
          </>
        }
      />

      <StateBlock
        loading={(categories.loading && !categories.data) || (items.loading && !items.data)}
        error={categories.error ?? items.error}
        empty={cats.length === 0}
        emptyText="No categories yet. Add one to start building your menu."
      >
        <div className="space-y-6">
          {cats.map((cat) => {
            const catItems = allItems.filter((i) => i.categoryId === cat.id);
            return (
              <Card key={cat.id} className="p-0">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <h2 className="font-semibold text-text">{cat.name}</h2>
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.id)}
                    className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {catItems.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted">No items in this category.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {catItems.map((it) => (
                      <li key={it.id} className="flex items-center justify-between gap-4 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text">{it.name}</p>
                          <p className="text-sm text-muted">{money(it.price, currency)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleAvailability(it)}>
                            <Badge variant={it.isAvailable ? "success" : "neutral"}>
                              {it.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditItem(it)}
                            className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-text"
                            aria-label="Edit item"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(it.id)}
                            className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                            aria-label="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </StateBlock>

      {/* Category modal */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="New category">
        {formError && <p className="mb-3 text-sm text-danger">{formError}</p>}
        <Field label="Category name" htmlFor="catName">
          <Input
            id="catName"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="e.g. Beverages"
          />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCatModal(false)}>
            Cancel
          </Button>
          <Button onClick={createCategory} disabled={busy}>
            {busy ? "Saving…" : "Create"}
          </Button>
        </div>
      </Modal>

      {/* Item modal */}
      <Modal
        open={itemDraft !== null}
        onClose={() => setItemDraft(null)}
        title={itemDraft?.id ? "Edit item" : "New item"}
      >
        {itemDraft && (
          <div className="space-y-4">
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Field label="Name" htmlFor="itemName">
              <Input
                id="itemName"
                value={itemDraft.name}
                onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })}
                placeholder="e.g. Cappuccino"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={`Price (${currency})`} htmlFor="itemPrice">
                <Input
                  id="itemPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemDraft.price}
                  onChange={(e) => setItemDraft({ ...itemDraft, price: e.target.value })}
                />
              </Field>
              <Field label="Category" htmlFor="itemCat">
                <Select
                  id="itemCat"
                  value={itemDraft.categoryId}
                  onChange={(e) => setItemDraft({ ...itemDraft, categoryId: e.target.value })}
                >
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setItemDraft(null)}>
                Cancel
              </Button>
              <Button onClick={saveItem} disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
