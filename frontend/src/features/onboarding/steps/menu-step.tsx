"use client";

import { useState } from "react";
import { Plus, Trash2, FolderOpen, ChevronRight, Tag, Sparkles } from "lucide-react";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Button } from "@/design-system/button";
import { Modal } from "@/design-system/modal";
import { CategoryPresetPicker, type CategoryPreset } from "@/features/dashboard/menu-presets";
import { apiFetch, ApiError } from "@/lib/api";

interface SeedItem {
  name: string;
  price: string;
}
interface SeedSub {
  name: string;
  items: SeedItem[];
}
interface SeedCat {
  name: string;
  items: SeedItem[];
  subcategories: SeedSub[];
}

const emptyItem = (): SeedItem => ({ name: "", price: "" });

export function MenuStep({
  onComplete,
  onSkip,
  onBack,
}: {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [categories, setCategories] = useState<SeedCat[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [presetOpen, setPresetOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    setCategories((cs) => [...cs, { name, items: [emptyItem()], subcategories: [] }]);
    setNewCategory("");
  }

  function addPresets(presets: CategoryPreset[]) {
    setCategories((cs) => {
      const existing = new Set(cs.map((c) => c.name.toLowerCase()));
      const additions = presets
        .filter((p) => !existing.has(p.name.toLowerCase()))
        .map<SeedCat>((p) => ({
          name: p.name,
          items: [emptyItem()],
          subcategories: (p.subcategories ?? []).map((s) => ({ name: s, items: [emptyItem()] })),
        }));
      return [...cs, ...additions];
    });
    setPresetOpen(false);
  }

  function removeCategory(i: number) {
    setCategories((cs) => cs.filter((_, idx) => idx !== i));
  }

  // Immutable update helper for the category currently being edited.
  function updateCat(index: number, fn: (cat: SeedCat) => SeedCat) {
    setCategories((cs) => cs.map((c, idx) => (idx === index ? fn(c) : c)));
  }

  function countItems(c: SeedCat): number {
    return (
      c.items.filter((i) => i.name.trim()).length +
      c.subcategories.reduce((sum, s) => sum + s.items.filter((i) => i.name.trim()).length, 0)
    );
  }

  function buildPayload() {
    const cleanItems = (items: SeedItem[]) =>
      items
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), price: Number(i.price) || 0 }));

    return categories
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        items: cleanItems(c.items),
        subcategories: c.subcategories
          .filter((s) => s.name.trim())
          .map((s) => ({ name: s.name.trim(), items: cleanItems(s.items) })),
      }));
  }

  async function save() {
    setFormError(null);
    const payload = buildPayload();
    if (payload.length === 0) {
      setFormError("Add at least one category, or skip this step.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/onboarding/menu", {
        method: "POST",
        body: { categories: payload },
        auth: true,
      });
      onComplete();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save your menu.");
    } finally {
      setBusy(false);
    }
  }

  const editingCat = editing != null ? categories[editing] : null;

  return (
    <div className="space-y-4">
      {formError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      <p className="text-sm text-muted">
        Add your categories. Tap a category to add items and subcategories.
      </p>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => setPresetOpen(true)}
      >
        <Sparkles className="h-4 w-4" /> Browse common categories
      </Button>

      {/* Category list */}
      {categories.length > 0 && (
        <ul className="space-y-2">
          {categories.map((c, i) => (
            <li key={i}>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                <button
                  type="button"
                  onClick={() => setEditing(i)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FolderOpen className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-text">{c.name}</span>
                    <span className="block text-xs text-muted">
                      {countItems(c)} item{countItems(c) === 1 ? "" : "s"}
                      {c.subcategories.length > 0 ? ` · ${c.subcategories.length} subcategories` : ""}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(i)}
                  aria-label="Remove category"
                  className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add category */}
      <div className="flex gap-2">
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCategory();
            }
          }}
          placeholder="e.g. Coffee, Desserts, Mains"
        />
        <Button type="button" variant="secondary" onClick={addCategory} disabled={!newCategory.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="ghost" className="flex-1" onClick={onSkip}>
          Skip for now
        </Button>
        <Button type="button" className="flex-1" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Continue"}
        </Button>
      </div>

      {/* Category editor modal */}
      <Modal
        open={editingCat !== null}
        onClose={() => setEditing(null)}
        title={editingCat ? editingCat.name : "Category"}
        description="Add items, or group them into subcategories."
      >
        {editingCat && editing != null && (
          <CategoryEditor
            cat={editingCat}
            onChange={(fn) => updateCat(editing, fn)}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <CategoryPresetPicker
        open={presetOpen}
        onClose={() => setPresetOpen(false)}
        existingNames={categories.map((c) => c.name)}
        onConfirm={addPresets}
      />
    </div>
  );
}

/** Editor body for a single category: its direct items + subcategories. */
function CategoryEditor({
  cat,
  onChange,
  onDone,
}: {
  cat: SeedCat;
  onChange: (fn: (cat: SeedCat) => SeedCat) => void;
  onDone: () => void;
}) {
  const [newSub, setNewSub] = useState("");

  return (
    <div className="space-y-5">
      {/* Direct items */}
      <ItemList
        label="Items"
        items={cat.items}
        onChange={(items) => onChange((c) => ({ ...c, items }))}
      />

      {/* Subcategories */}
      <div className="space-y-3">
        <span className="block text-sm font-medium text-text">Subcategories</span>
        {cat.subcategories.map((sub, si) => (
          <div key={si} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4 text-accent" />
              <Input
                value={sub.name}
                onChange={(e) =>
                  onChange((c) => ({
                    ...c,
                    subcategories: c.subcategories.map((s, idx) =>
                      idx === si ? { ...s, name: e.target.value } : s,
                    ),
                  }))
                }
                placeholder="Subcategory name"
                className="h-9"
              />
              <button
                type="button"
                aria-label="Remove subcategory"
                onClick={() =>
                  onChange((c) => ({
                    ...c,
                    subcategories: c.subcategories.filter((_, idx) => idx !== si),
                  }))
                }
                className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <ItemList
              label=""
              items={sub.items}
              onChange={(items) =>
                onChange((c) => ({
                  ...c,
                  subcategories: c.subcategories.map((s, idx) =>
                    idx === si ? { ...s, items } : s,
                  ),
                }))
              }
            />
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            placeholder="e.g. Hot, Iced"
            className="h-9"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!newSub.trim()}
            onClick={() => {
              const name = newSub.trim();
              if (!name) return;
              onChange((c) => ({
                ...c,
                subcategories: [...c.subcategories, { name, items: [emptyItem()] }],
              }));
              setNewSub("");
            }}
          >
            <Plus className="h-4 w-4" /> Subcategory
          </Button>
        </div>
      </div>

      <Button type="button" className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

/** Editable list of name/price rows. */
function ItemList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: SeedItem[];
  onChange: (items: SeedItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      {label && <span className="block text-sm font-medium text-text">{label}</span>}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={item.name}
            onChange={(e) => onChange(items.map((it, idx) => (idx === i ? { ...it, name: e.target.value } : it)))}
            placeholder="Item name"
            className="h-9"
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.price}
            onChange={(e) => onChange(items.map((it, idx) => (idx === i ? { ...it, price: e.target.value } : it)))}
            placeholder="Price"
            className="h-9 w-24"
          />
          <button
            type="button"
            aria-label="Remove item"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange([...items, emptyItem()])}
      >
        <Plus className="h-4 w-4" /> Add item
      </Button>
    </div>
  );
}
