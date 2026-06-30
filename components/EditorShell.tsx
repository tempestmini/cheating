"use client";

import type { RefObject } from "react";
import { EditorNavBar } from "@/components/EditorNavBar";
import { EditorToolbar } from "@/components/EditorToolbar";
import { PdfCanvas, type PdfCanvasHandle } from "@/components/PdfCanvas";
import type { DocumentItem, PageStrokes, Tool } from "@/types";

type EditorShellProps = {
  openTabs: DocumentItem[];
  activeDoc: DocumentItem | null;
  activeId: string;
  tool: Tool;
  penColor: string;
  penWidth: number;
  strokes: PageStrokes;
  pageNumber: number;
  onPageChange: (page: number) => void;
  pageAnswer: string | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  canUndo: boolean;
  pdfCanvasRef: RefObject<PdfCanvasHandle | null>;
  onPageReady: () => void;
  onBack: () => void;
  onSelectTab: (id: string) => void;
  onToolChange: (tool: Tool) => void;
  onPenColorChange: (color: string) => void;
  onPenWidthChange: (width: number) => void;
  onStrokesChange: (strokes: PageStrokes) => void;
  onUndo: () => void;
  onOpenStudy: () => void;
};

export function EditorShell({
  openTabs,
  activeDoc,
  activeId,
  tool,
  penColor,
  penWidth,
  strokes,
  pageNumber,
  onPageChange,
  pageAnswer,
  isAnalyzing,
  analyzeError,
  canUndo,
  pdfCanvasRef,
  onPageReady,
  onBack,
  onSelectTab,
  onToolChange,
  onPenColorChange,
  onPenWidthChange,
  onStrokesChange,
  onUndo,
  onOpenStudy,
}: EditorShellProps) {
  return (
    <div className="relative flex h-dvh flex-col bg-[#ebe6de]">
      <EditorNavBar
        openTabs={openTabs}
        activeId={activeId}
        onBack={onBack}
        onSelectTab={onSelectTab}
        onUndo={onUndo}
        onRedo={() => {}}
        canUndo={canUndo}
        isAnalyzing={isAnalyzing}
        onOpenStudy={onOpenStudy}
      />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <EditorToolbar
          tool={tool}
          penColor={penColor}
          penWidth={penWidth}
          onToolChange={onToolChange}
          onPenColorChange={onPenColorChange}
          onPenWidthChange={onPenWidthChange}
        />
        <PdfCanvas
          ref={pdfCanvasRef}
          pdfFile={activeDoc?.file ?? null}
          tool={tool}
          penColor={penColor}
          penWidth={penWidth}
          strokes={strokes}
          pageNumber={pageNumber}
          onPageChange={onPageChange}
          onStrokesChange={onStrokesChange}
          pageAnswer={pageAnswer}
          isAnalyzing={isAnalyzing}
          analyzeError={analyzeError}
          onPageReady={onPageReady}
        />
      </div>
    </div>
  );
}
