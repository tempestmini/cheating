"use client";

import {
  BookOpen,
  Camera,
  CloudDownload,
  FileText,
  FolderPlus,
  Grid3X3,
  Image,
  Import,
  Mic,
  Pencil,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef } from "react";

type NewDocumentMenuProps = {
  open: boolean;
  onClose: () => void;
  onImportPdf: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
};

export function NewDocumentMenu({
  open,
  onClose,
  onImportPdf,
  anchorRef,
}: NewDocumentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-2 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#3a3a3c] bg-[#2c2c2e] shadow-2xl"
    >
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          { icon: BookOpen, label: "노트북" },
          { icon: FileText, label: "텍스트 문서", badge: "신규" },
          { icon: Grid3X3, label: "화이트보드", badge: "신규" },
        ].map(({ icon: Icon, label, badge }) => (
          <button
            key={label}
            type="button"
            className="relative flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-[#ebebf5] transition hover:bg-[#3a3a3c]"
          >
            {badge && (
              <span className="absolute right-2 top-2 rounded bg-[#ffd60a] px-1.5 py-0.5 text-[9px] font-bold text-black">
                {badge}
              </span>
            )}
            <Icon className="h-7 w-7" strokeWidth={1.5} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 pb-2">
        <button
          type="button"
          onClick={() => {
            onImportPdf();
            onClose();
          }}
          className="flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-[#ebebf5] transition hover:bg-[#3a3a3c]"
        >
          <Import className="h-7 w-7" strokeWidth={1.5} />
          <span className="text-xs">불러오기</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-[#ebebf5] transition hover:bg-[#3a3a3c]"
        >
          <Mic className="h-7 w-7" strokeWidth={1.5} />
          <span className="text-xs">빠른 녹음</span>
        </button>
      </div>
      <div className="border-t border-[#3a3a3c] px-1 py-1">
        {[
          { icon: Pencil, label: "QuickNote" },
          { icon: ScanLine, label: "문서 스캔" },
          { icon: Sparkles, label: "스터디 세트" },
          { icon: Image, label: "이미지" },
          { icon: Camera, label: "사진 찍기" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-[#ebebf5] transition hover:bg-[#3a3a3c]"
          >
            <Icon className="h-5 w-5 text-[#8e8e93]" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
      <div className="border-t border-[#3a3a3c] px-3 py-2">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-[#ebebf5] transition hover:bg-[#3a3a3c]"
        >
          <FolderPlus className="h-5 w-5 text-[#8e8e93]" strokeWidth={1.5} />
          폴더
        </button>
        <button
          type="button"
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3a3a3c] py-3 text-sm text-[#8e8e93]"
        >
          <CloudDownload className="h-4 w-4" />
          클라우드 저장소에서 불러오기
        </button>
      </div>
    </div>
  );
}
