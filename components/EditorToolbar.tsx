"use client";

import {
  Circle,
  Eraser,
  Highlighter,
  Image,
  Lasso,
  MousePointer2,
  Pen,
  Shapes,
  Type,
} from "lucide-react";
import { PEN_COLORS, PEN_WIDTHS } from "@/lib/constants";
import type { Tool } from "@/types";

type EditorToolbarProps = {
  tool: Tool;
  penColor: string;
  penWidth: number;
  onToolChange: (tool: Tool) => void;
  onPenColorChange: (color: string) => void;
  onPenWidthChange: (width: number) => void;
};

const TOOL_ICONS: { id: Tool | "pointer" | "shape" | "lasso" | "image" | "text"; icon: typeof Pen; label: string }[] = [
  { id: "pointer", icon: MousePointer2, label: "선택" },
  { id: "pen", icon: Pen, label: "펜" },
  { id: "eraser", icon: Eraser, label: "지우개" },
  { id: "highlighter", icon: Highlighter, label: "형광펜" },
  { id: "shape", icon: Shapes, label: "도형" },
  { id: "lasso", icon: Lasso, label: "올가미" },
  { id: "image", icon: Image, label: "이미지" },
  { id: "text", icon: Type, label: "텍스트" },
];

export function EditorToolbar({
  tool,
  penColor,
  penWidth,
  onToolChange,
  onPenColorChange,
  onPenWidthChange,
}: EditorToolbarProps) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center px-4 pt-2">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-2xl border border-[#e0dbd3] bg-[#faf8f4]/95 px-2 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
        {TOOL_ICONS.map(({ id, icon: Icon, label }) => {
          const active = tool === id;
          const clickable = id === "pen" || id === "eraser" || id === "highlighter";
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (clickable) onToolChange(id as Tool);
              }}
              disabled={!clickable}
              className={`rounded-xl p-2 transition ${
                active
                  ? "bg-[#e8e2d9] text-[#1c1c1e]"
                  : clickable
                    ? "text-[#48484a] hover:bg-[#f0ebe3]"
                    : "text-[#aeaeb2] opacity-50"
              }`}
              aria-label={label}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          );
        })}
        <div className="mx-1 h-6 w-px bg-[#e0dbd3]" />
        <div className="flex items-center gap-1 px-1">
          {PEN_WIDTHS.slice(0, 3).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onPenWidthChange(w)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                penWidth === w ? "bg-[#e8e2d9]" : "hover:bg-[#f0ebe3]"
              }`}
              aria-label={`굵기 ${w}`}
            >
              <Circle
                className="fill-[#1c1c1e] text-[#1c1c1e]"
                style={{ width: w * 2 + 4, height: w * 2 + 4 }}
              />
            </button>
          ))}
        </div>
        <div className="mx-1 h-6 w-px bg-[#e0dbd3]" />
        <div className="flex items-center gap-1.5 px-1">
          {PEN_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onPenColorChange(c.value)}
              className={`h-5 w-5 rounded-full border-2 transition ${
                penColor === c.value ? "border-[#636366] scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c.value }}
              aria-label={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
