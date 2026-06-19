"use client";

import { useState } from "react";
import { Trash2, StickyNote } from "lucide-react";
import { QtyStepper } from "./qty-stepper";
import { useOutlet } from "@/features/dashboard/outlet-context";
import type { Order, OrderItem } from "@/lib/types";
import { money } from "@/lib/format";

/**
 * Editable cart for an order. Item edits are delegated to the parent (which
 * owns the API calls); this component only renders and gathers input.
 */
export function OrderCart({
  order,
  editable,
  busy,
  onChangeQty,
  onSaveNote,
  onRemove,
}: {
  order: Order;
  editable: boolean;
  busy: boolean;
  onChangeQty: (item: OrderItem, qty: number) => void;
  onSaveNote: (item: OrderItem, note: string) => void;
  onRemove: (item: OrderItem) => void;
}) {
  const { currency } = useOutlet();

  return (
    <div>
      {order.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No items yet. {editable ? "Add items from the menu." : ""}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {order.items.map((it) => (
            <CartLine
              key={it.id}
              item={it}
              currency={currency}
              editable={editable}
              busy={busy}
              onChangeQty={onChangeQty}
              onSaveNote={onSaveNote}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}

      <dl className="space-y-1 border-t border-border pt-4 text-sm">
        <Row label="Subtotal" value={money(order.subtotal, currency)} />
        <Row label="Tax" value={money(order.taxTotal, currency)} />
        {Number(order.discount) > 0 && (
          <Row label="Discount" value={`-${money(order.discount, currency)}`} />
        )}
        <div className="flex justify-between pt-1 text-base font-semibold text-text">
          <span>Total</span>
          <span>{money(order.total, currency)}</span>
        </div>
      </dl>
    </div>
  );
}

function CartLine({
  item,
  currency,
  editable,
  busy,
  onChangeQty,
  onSaveNote,
  onRemove,
}: {
  item: OrderItem;
  currency: string;
  editable: boolean;
  busy: boolean;
  onChangeQty: (item: OrderItem, qty: number) => void;
  onSaveNote: (item: OrderItem, note: string) => void;
  onRemove: (item: OrderItem) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(item.notes ?? "");

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{item.name}</p>
          <p className="text-xs text-muted">{money(item.unitPrice, currency)} each</p>
          {item.notes && !noteOpen && (
            <p className="mt-0.5 text-xs italic text-muted">“{item.notes}”</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {editable ? (
            <QtyStepper value={item.qty} onChange={(q) => onChangeQty(item, q)} disabled={busy} />
          ) : (
            <span className="text-sm text-muted">×{item.qty}</span>
          )}
          <span className="w-16 text-right text-sm font-medium text-text">
            {money(Number(item.unitPrice) * item.qty, currency)}
          </span>
          {editable && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setNoteOpen((v) => !v)}
                disabled={busy}
                aria-label="Add note"
                className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-text"
              >
                <StickyNote className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(item)}
                disabled={busy}
                aria-label="Remove item"
                className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {editable && noteOpen && (
        <div className="mt-2 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. no sugar, extra hot"
            maxLength={200}
            className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onSaveNote(item, note);
              setNoteOpen(false);
            }}
            className="rounded-md bg-primary px-3 text-sm font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
