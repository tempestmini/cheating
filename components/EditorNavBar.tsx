"use client";

import {
  ChevronLeft,
  LayoutGrid,
  MoreHorizontal,
  Redo2,
  Search,
  Share,
  Undo2,
  ZoomIn,
} from "lucide-react";
import type { DocumentItem } from "@/types";

type EditorNavBarProps = {
  openTabs: DocumentItem[];
  activeId: string;
  onBack: () => void;
  onSelectTab: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  isAnalyzing: boolean;
  onOpenStudy: () => void;
};

export function EditorNavBar({
  openTabs,
  activeId,
  onBack,
  onSelectTab,
  onUndo,
  onRedo,
  canUndo,
  isAnalyzing,
  onOpenStudy,
}: EditorNavBarProps) {
  return (
    <header className="shrink-0 border-b border-[#e5e0d8] bg-[#f7f4ef]">
      <div className="flex h-11 items-center gap-1 px-2 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-2 text-[#3c3c43] transition hover:bg-[#ebe6de]"
          aria-label="뒤로"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-[#3c3c43] transition hover:bg-[#ebe6de]"
          aria-label="검색"
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-[#3c3c43] transition hover:bg-[#ebe6de]"
          aria-label="페이지"
        >
          <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-[#3c3c43] transition hover:bg-[#ebe6de]"
          aria-label="공유"
        >
          <Share className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <div className="mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
          {openTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-1 text-[13px] font-medium transition ${
                tab.id === activeId
                  ? "bg-[#e8e2d9] text-[#1c1c1e]"
                  : "text-[#636366] hover:bg-[#ebe6de]"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-lg p-2 text-[#3c3c43] transition hover:bg-[#ebe6de] disabled:opacity-30"
          aria-label="실행 취소"
        >
          <Undo2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          className="rounded-lg p-2 text-[#3c3c43] transition hover:bg-[#ebe6de] opacity-30"
          aria-label="다시 실행"
        >
          <Redo2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onOpenStudy}
          disabled={isAnalyzing}
          className={`rounded-lg p-2 text-[#3c3c43] transition hover:bg-[#ebe6de] ${
            isAnalyzing ? "animate-pulse opacity-60" : ""
          }`}
          aria-label="더보기"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-[#3c3c43] transition hover:bg-[#ebe6de]"
          aria-label="확대"
        >
          <ZoomIn className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
