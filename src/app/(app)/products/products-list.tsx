"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActivePill } from "@/components/status-pill";
import { AdjustStockButton } from "./adjust-stock-button";
import { DeactivateButton } from "./deactivate-button";
import { EditProductButton } from "./edit-product-button";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  current_stock: number;
  minimum_stock: number;
  is_active: boolean;
};

const selectClass =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const PAGE_SIZE = 10;

// Which page buttons to show: the first and last page, and the pages around
// the current one, with "…" where pages are skipped. For example 1 … 4 5 6 … 12.
function pageButtons(current: number, count: number): (number | "…")[] {
  const wanted = new Set([1, count, current - 1, current, current + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

// The page loads every product once. Searching and choosing a category or
// status only filter that list here in the browser, so nothing reloads and
// the table updates as you type.
export function ProductsList({
  products,
  categories,
}: {
  products: Product[];
  categories: string[];
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const tableTop = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!needle || p.name.toLowerCase().includes(needle)) &&
        (!category || p.category === category) &&
        (status === "all" || (status === "inactive" ? !p.is_active : p.is_active)),
    );
  }, [products, q, category, status]);

  const filtered = q !== "" || category !== "" || status !== "active";

  // Changing a filter always goes back to page 1. If rows were removed (for
  // example after a deactivate) the page number can never point past the end.
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const first = (current - 1) * PAGE_SIZE;
  const visible = rows.slice(first, first + PAGE_SIZE);

  function goTo(next: number) {
    setPage(next);
    // The buttons are under the table. After a click, glide back up to the
    // top of the table if it has scrolled out of view.
    const box = tableTop.current;
    if (box && box.getBoundingClientRect().top < 0) {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      box.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Product name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
        {filtered && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQ("");
              setCategory("");
              setStatus("active");
              setPage(1);
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <div ref={tableTop} className="scroll-mt-4">
        <Card>
          <CardContent className="overflow-x-auto p-0">
            {/* table-fixed + <colgroup>: every column has a set width, so the
                headers and the cells under them line up exactly. */}
            <table className="w-full min-w-[1250px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[33%]" />
              </colgroup>
              <thead className="border-b border-divider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Minimum</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody key={current} className="page-fade">
                {visible.map((p) => (
                  <tr key={p.id} className="border-b border-divider last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3 text-right">{peso.format(Number(p.price))}</td>
                    <td className="px-4 py-3 text-right">{p.current_stock}</td>
                    <td className="px-4 py-3 text-right">{p.minimum_stock}</td>
                    <td className="px-4 py-3">
                      <ActivePill active={p.is_active} />
                    </td>
                    <td className="px-4 py-2">
                      {/* The buttons sit in a div: making the <td> itself
                          flex would pull it out of the table's columns. */}
                      <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
                        <EditProductButton product={p} categories={categories} />
                        {p.is_active && (
                          <AdjustStockButton
                            productId={p.id}
                            productName={p.name}
                            currentStock={p.current_stock}
                          />
                        )}
                        {p.is_active && (
                          <DeactivateButton productId={p.id} productName={p.name} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {products.length === 0
                        ? "No products yet. Add your first one."
                        : "No products match these filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {rows.length > PAGE_SIZE && (
        <nav
          aria-label="Pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {first + 1}–{first + visible.length} of {rows.length} products
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={current === 1}
              onClick={() => goTo(current - 1)}
            >
              Previous
            </Button>
            {pageButtons(current, pageCount).map((n, i) =>
              n === "…" ? (
                <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={n}
                  type="button"
                  variant={n === current ? "default" : "outline"}
                  aria-current={n === current ? "page" : undefined}
                  aria-label={`Page ${n}`}
                  onClick={() => goTo(n)}
                >
                  {n}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              disabled={current === pageCount}
              onClick={() => goTo(current + 1)}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </>
  );
}
