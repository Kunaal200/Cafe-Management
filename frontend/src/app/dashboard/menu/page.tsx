"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, FolderPlus } from "lucide-react";
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
import { MenuItemBadges } from "@/features/dashboard/menu-badges";
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
  isVeg: boolean | null;
  isSpicy: boolean;
  isSweet: boolean;
  serves: string;
}

interface CatDraft {
  parentId?: string;
  parentName?: string;
}

export default function MenuPage() {
  const { currency } = useOutlet();
  const confirm = useConfirm();
  const toast = useToast();
  const categories = useApi<MenuCategory[]>("/menu/categories");
  const items = useApi<MenuItem[]>("/menu/items");

  const [catDraft, setCatDraft] = useState<CatDraft | null>(null);
  const [catName, setCatName] = useState("");
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const allCats = categories.data ?? [];
  const allItems = items.data ?? [];

  const topCats = useMemo(() => allCats.filter((c) => !c.parentId), [allCats]);
  const subsByParent = useMemo(() => {
    const map = new Map<string, MenuCategory[]>();
    for (const c of allCats) {
      if (c.parentId) {
        const list = map.get(c.parentId) ?? [];
        list.push(c);
        map.set(c.parentId, list);
      }
    }
    return map;
  }, [allCats]);
  const itemsByCat = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const it of allItems) {
      const list = map.get(it.categoryId) ?? [];
      list.push(it);
      map.set(it.categoryId, list);
    }
    return map;
  }, [allItems]);

  // Flat, display-ordered list of categories an item can be assigned to.
  const selectable = useMemo(() => {
    const out: { id: string; label: string }[] = [];
    for (const c of topCats) {
      out.push({ id: c.id, label: c.name });
      for (const s of subsByParent.get(c.id) ?? []) {
        out.push({ id: s.id, label: `\u00A0\u00A0└ ${c.name} / ${s.name}` });
      }
    }
    return out;
  }, [topCats, subsByParent]);

  function refetchAll() {
    categories.refetch();
    items.refetch();
  }

  function openNewCategory(parent?: MenuCategory) {
    setFormError(null);
    setCatName("");
    setCatDraft(parent ? { parentId: parent.id, parentName: parent.name } : {});
  }

  async function createCategory() {
    if (!catName.trim() || !catDraft) return;
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/menu/categories", {
        method: "POST",
        body: { name: catName.trim(), parentId: catDraft.parentId },
        auth: true,
      });
      toast.success(catDraft.parentId ? "Subcategory created" : "Category created");
      setCatDraft(null);
      setCatName("");
      categories.refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create category.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(c: MenuCategory) {
    const isTop = !c.parentId;
    const ok = await confirm({
      title: isTop ? "Delete category?" : "Delete subcategory?",
      description: isTop
        ? "This also deletes its subcategories and all their items. This cannot be undone."
        : "This also deletes its items. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/menu/categories/${c.id}`, { method: "DELETE", auth: true });
      toast.success("Deleted");
      refetchAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete.");
    }
  }

  function openNewItem(categoryId: string) {
    setFormError(null);
    setItemDraft({
      name: "",
      price: "",
      categoryId,
      isAvailable: true,
      isVeg: null,
      isSpicy: false,
      isSweet: false,
      serves: "",
    });
  }

  function openEditItem(it: MenuItem) {
    setFormError(null);
    setItemDraft({
      id: it.id,
      name: it.name,
      price: String(it.price),
      categoryId: it.categoryId,
      isAvailable: it.isAvailable,
      isVeg: it.isVeg,
      isSpicy: it.isSpicy,
      isSweet: it.isSweet,
      serves: it.serves != null ? String(it.serves) : "",
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
    const serves = itemDraft.serves.trim() ? Number(itemDraft.serves) : undefined;
    const body = {
      name: itemDraft.name.trim(),
      price,
      categoryId: itemDraft.categoryId,
      isVeg: itemDraft.isVeg ?? undefined,
      isSpicy: itemDraft.isSpicy,
      isSweet: itemDraft.isSweet,
      serves,
    };
    try {
      if (itemDraft.id) {
        await apiFetch(`/menu/items/${itemDraft.id}`, { method: "PATCH", body, auth: true });
      } else {
        await apiFetch("/menu/items", { method: "POST", body, auth: true });
      }
      toast.success(itemDraft.id ? "Item updated" : "Item created");
      setItemDraft(null);
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
        subtitle="Organize items into categories and subcategories."
        actions={
          <Button onClick={() => openNewCategory()}>
            <Plus className="h-4 w-4" /> Category
          </Button>
        }
      />

      <StateBlock
        loading={(categories.loading && !categories.data) || (items.loading && !items.data)}
        error={categories.error ?? items.error}
        empty={topCats.length === 0}
        emptyText="No categories yet. Add one to start building your menu."
      >
        <div className="space-y-6">
          {topCats.map((cat) => (
            <Card key={cat.id} className="p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
                <h2 className="font-semibold text-text">{cat.name}</h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openNewItem(cat.id)}>
                    <Plus className="h-4 w-4" /> Item
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openNewCategory(cat)}>
                    <FolderPlus className="h-4 w-4" /> Subcategory
                  </Button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat)}
                    className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <ItemRows
                items={itemsByCat.get(cat.id) ?? []}
                currency={currency}
                onEdit={openEditItem}
                onToggle={toggleAvailability}
                onDelete={deleteItem}
              />

              {(subsByParent.get(cat.id) ?? []).map((sub) => (
                <div key={sub.id} className="border-t border-border bg-surface-muted/30">
                  <div className="flex items-center justify-between gap-2 px-5 py-2">
                    <h3 className="text-sm font-medium text-muted">↳ {sub.name}</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openNewItem(sub.id)}>
                        <Plus className="h-4 w-4" /> Item
                      </Button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(sub)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                        aria-label="Delete subcategory"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <ItemRows
                    items={itemsByCat.get(sub.id) ?? []}
                    currency={currency}
                    onEdit={openEditItem}
                    onToggle={toggleAvailability}
                    onDelete={deleteItem}
                  />
                </div>
              ))}
            </Card>
          ))}
        </div>
      </StateBlock>

      {/* Category / subcategory modal */}
      <Modal
        open={catDraft !== null}
        onClose={() => setCatDraft(null)}
        title={catDraft?.parentId ? `New subcategory in ${catDraft.parentName}` : "New category"}
      >
        {formError && <p className="mb-3 text-sm text-danger">{formError}</p>}
        <Field label={catDraft?.parentId ? "Subcategory name" : "Category name"} htmlFor="catName">
          <Input
            id="catName"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder={catDraft?.parentId ? "e.g. Hot, Iced" : "e.g. Beverages"}
          />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCatDraft(null)}>
            Cancel
          </Button>
          <Button onClick={createCategory} disabled={busy || !catName.trim()}>
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
                  {selectable.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Diet" htmlFor="itemDiet">
                <Select
                  id="itemDiet"
                  value={itemDraft.isVeg === null ? "" : itemDraft.isVeg ? "veg" : "nonveg"}
                  onChange={(e) =>
                    setItemDraft({
                      ...itemDraft,
                      isVeg: e.target.value === "" ? null : e.target.value === "veg",
                    })
                  }
                >
                  <option value="">Not specified</option>
                  <option value="veg">Vegetarian</option>
                  <option value="nonveg">Non-vegetarian</option>
                </Select>
              </Field>
              <Field label="Serves (optional)" htmlFor="itemServes">
                <Input
                  id="itemServes"
                  type="number"
                  min="1"
                  max="50"
                  value={itemDraft.serves}
                  onChange={(e) => setItemDraft({ ...itemDraft, serves: e.target.value })}
                  placeholder="e.g. 2"
                />
              </Field>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={itemDraft.isSpicy}
                  onChange={(e) => setItemDraft({ ...itemDraft, isSpicy: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                Spicy
              </label>
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={itemDraft.isSweet}
                  onChange={(e) => setItemDraft({ ...itemDraft, isSweet: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                Sweet
              </label>
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

/** Item rows for a category/subcategory. */
function ItemRows({
  items,
  currency,
  onEdit,
  onToggle,
  onDelete,
}: {
  items: MenuItem[];
  currency: string;
  onEdit: (it: MenuItem) => void;
  onToggle: (it: MenuItem) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">No items here yet.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((it) => (
        <li key={it.id} className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{it.name}</p>
            <p className="text-sm text-muted">{money(it.price, currency)}</p>
            <MenuItemBadges item={it} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onToggle(it)}>
              <Badge variant={it.isAvailable ? "success" : "neutral"}>
                {it.isAvailable ? "Available" : "Unavailable"}
              </Badge>
            </button>
            <button
              type="button"
              onClick={() => onEdit(it)}
              className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-text"
              aria-label="Edit item"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(it.id)}
              className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
