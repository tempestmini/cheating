"use client";

import {
  Bell,
  CheckSquare,
  LayoutGrid,
  PanelLeft,
  Search,
  Star,
} from "lucide-react";
import { useRef, useState } from "react";
import { formatDocDate } from "@/lib/format";
import { NewDocumentMenu } from "@/components/NewDocumentMenu";
import { PdfThumbnail } from "@/components/PdfThumbnail";
import type { DocumentItem } from "@/types";

type DocumentLibraryProps = {
  documents: DocumentItem[];
  favorites: Set<string>;
  onOpen: (id: string) => void;
  onImport: () => void;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
};

export function DocumentLibrary({
  documents,
  favorites,
  onOpen,
  onImport,
  onToggleFavorite,
  onRemove,
}: DocumentLibraryProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const newBtnRef = useRef<HTMLButtonElement>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-dvh flex-col bg-black text-[#ebebf5]">
      <header className="flex h-11 shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-1.5 text-[#ebebf5] transition hover:bg-[#2c2c2e]"
            aria-label="사이드바"
          >
            <PanelLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <h1 className="text-[17px] font-semibold tracking-tight">문서</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-2 text-[#ebebf5] transition hover:bg-[#2c2c2e]"
            aria-label="검색"
          >
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-[#ebebf5] transition hover:bg-[#2c2c2e]"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#48484a] text-sm font-medium"
            aria-label="프로필"
          >
            M
          </button>
        </div>
      </header>
      <div className="flex h-11 shrink-0 items-center justify-between px-4">
        <button
          type="button"
          className="flex items-center gap-1.5 text-[15px] text-[#ebebf5]"
        >
          <svg
            className="h-4 w-4 text-[#8e8e93]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          모두
        </button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              ref={newBtnRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full bg-[#0a84ff] px-4 py-1.5 text-[15px] font-medium text-white transition hover:bg-[#0077ed]"
            >
              + 신규
            </button>
            <NewDocumentMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              onImportPdf={onImport}
              anchorRef={newBtnRef}
            />
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-[#8e8e93] transition hover:bg-[#2c2c2e] hover:text-[#ebebf5]"
            aria-label="그리드 보기"
          >
            <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectionMode((v) => !v);
              setSelected(new Set());
            }}
            className={`rounded-lg p-2 transition hover:bg-[#2c2c2e] ${
              selectionMode ? "text-[#0a84ff]" : "text-[#8e8e93] hover:text-[#ebebf5]"
            }`}
            aria-label="선택"
          >
            <CheckSquare className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)] pt-2">
        {documents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[#8e8e93]">
            <LayoutGrid className="h-12 w-12 opacity-40" strokeWidth={1} />
            <p className="text-sm">문서가 없습니다</p>
            <button
              type="button"
              onClick={onImport}
              className="rounded-full bg-[#0a84ff] px-5 py-2 text-sm font-medium text-white"
            >
              PDF 불러오기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-x-4 gap-y-6">
            {documents.map((doc) => {
              const isFav = favorites.has(doc.id);
              const isSelected = selected.has(doc.id);
              return (
                <div key={doc.id} className="group flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectionMode) toggleSelect(doc.id);
                      else onOpen(doc.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onRemove(doc.id);
                    }}
                    className={`relative overflow-hidden rounded-lg transition ${
                      isSelected ? "ring-2 ring-[#0a84ff]" : ""
                    }`}
                  >
                    <div className="overflow-hidden rounded-lg bg-[#1c1c1e] shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                      <PdfThumbnail pdfFile={doc.file} width={148} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(doc.id);
                      }}
                      className={`absolute right-1.5 top-1.5 rounded-full p-1 transition ${
                        isFav
                          ? "text-[#ffd60a]"
                          : "text-[#ebebf5]/60 opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label="즐겨찾기"
                    >
                      <Star
                        className="h-4 w-4"
                        fill={isFav ? "currentColor" : "none"}
                        strokeWidth={1.5}
                      />
                    </button>
                  </button>
                  <p className="mt-2 truncate text-[13px] font-medium leading-tight text-[#ebebf5]">
                    {doc.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8e8e93]">
                    {formatDocDate(doc.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
