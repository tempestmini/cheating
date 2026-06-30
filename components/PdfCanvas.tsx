"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Document, Page } from "react-pdf";
import "@/lib/pdf-worker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HandwritingAnswer } from "@/components/HandwritingAnswer";
import { capturePageSnapshot } from "@/lib/page-capture";
import type { PageStrokes, Point, Stroke, Tool } from "@/types";

const HIGHLIGHTER_COLOR = "rgba(255, 235, 59, 0.45)";

type PdfCanvasProps = {
  pdfFile: File | null;
  tool: Tool;
  penColor: string;
  penWidth: number;
  strokes: PageStrokes;
  pageNumber: number;
  onPageChange: (page: number) => void;
  onStrokesChange: (strokes: PageStrokes) => void;
  pageAnswer: string | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  onPageReady: () => void;
};

export type PdfCanvasHandle = {
  capturePageImage: () => Promise<Blob | null>;
  getPageRoot: () => HTMLElement | null;
};

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
) {
  if (stroke.points.length < 2) return;
  const strokeTool = stroke.tool ?? "pen";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  if (strokeTool === "eraser") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = stroke.width * 4;
    ctx.globalCompositeOperation = "destination-out";
  } else if (strokeTool === "highlighter") {
    ctx.strokeStyle = HIGHLIGHTER_COLOR;
    ctx.lineWidth = stroke.width * 6;
    ctx.globalCompositeOperation = "multiply";
  } else {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
}

function redrawCanvas(
  canvas: HTMLCanvasElement,
  pageStrokes: Stroke[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of pageStrokes) {
    drawStroke(ctx, stroke);
  }
}

export const PdfCanvas = forwardRef<PdfCanvasHandle, PdfCanvasProps>(
  function PdfCanvas(
    {
      pdfFile,
      tool,
      penColor,
      penWidth,
      strokes,
      pageNumber,
      onPageChange,
      onStrokesChange,
      pageAnswer,
      isAnalyzing,
      analyzeError,
      onPageReady,
    },
    ref,
  ) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageReadyKeyRef = useRef("");
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(600);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const currentStroke = useRef<Stroke | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      capturePageImage: async () => {
        if (!pageAreaRef.current) return null;
        return capturePageSnapshot(pageAreaRef.current);
      },
      getPageRoot: () => pageAreaRef.current,
    }),
    [pageNumber, pageWidth],
  );

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 32;
        setPageWidth(Math.min(Math.max(w, 320), 820));
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [pdfFile]);

  useEffect(() => {
    setLoadError(null);
  }, [pdfFile]);

  useEffect(() => {
    pageReadyKeyRef.current = "";
  }, [pdfFile, pageNumber]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redrawCanvas(canvas, strokes[pageNumber] ?? []);
  }, [strokes, pageNumber, pageWidth]);

  const getPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (tool !== "pen" && tool !== "eraser" && tool !== "highlighter") return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      const point = getPoint(e);
      currentStroke.current = {
        points: [point],
        color: tool === "highlighter" ? HIGHLIGHTER_COLOR : penColor,
        width: penWidth,
        tool,
      };
    },
    [getPoint, penColor, penWidth, tool],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentStroke.current) return;
      e.preventDefault();
      const point = getPoint(e);
      currentStroke.current.points.push(point);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && currentStroke.current.points.length >= 2) {
        const pts = currentStroke.current.points;
        const last = pts[pts.length - 2];
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(point.x, point.y);
        if (tool === "eraser") {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = penWidth * 4;
          ctx.globalCompositeOperation = "destination-out";
        } else if (tool === "highlighter") {
          ctx.strokeStyle = HIGHLIGHTER_COLOR;
          ctx.lineWidth = penWidth * 6;
          ctx.globalCompositeOperation = "multiply";
        } else {
          ctx.strokeStyle = penColor;
          ctx.lineWidth = penWidth;
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }
    },
    [isDrawing, getPoint, tool, penColor, penWidth],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentStroke.current) return;
      e.preventDefault();
      setIsDrawing(false);
      const pageStrokes = [...(strokes[pageNumber] ?? [])];
      pageStrokes.push({ ...currentStroke.current });
      onStrokesChange({ ...strokes, [pageNumber]: pageStrokes });
      currentStroke.current = null;
      const canvas = canvasRef.current;
      if (canvas) canvas.releasePointerCapture(e.pointerId);
    },
    [isDrawing, strokes, pageNumber, onStrokesChange],
  );

  const handlePageLoad = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pdfPage = canvas.parentElement?.querySelector(".react-pdf__Page");
    if (pdfPage) {
      const rect = pdfPage.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      redrawCanvas(canvas, strokes[pageNumber] ?? []);
    }
    const readyKey = `${pageNumber}-${Math.round(canvas.width)}`;
    if (pageReadyKeyRef.current === readyKey) return;
    pageReadyKeyRef.current = readyKey;
    onPageReady();
  }, [pageNumber, onPageReady, strokes]);

  if (!pdfFile) return null;

  return (
    <div ref={containerRef} className="notebook-paper flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 items-start justify-center overflow-auto px-4 pb-4 pt-14">
        <div
          className="relative flex flex-col overflow-hidden bg-[#fffef9] shadow-[0_2px_16px_rgba(0,0,0,0.12)]"
          style={{ width: pageWidth }}
        >
          <div className="relative" ref={pageAreaRef}>
            <Document
            file={pdfFile}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={(err) => {
              console.error("PDF load error:", err);
              setLoadError(err.message);
            }}
            loading={
              <div className="flex h-[70dvh] w-[600px] items-center justify-center bg-[#fffef9] text-sm text-[#8e8e93]">
                로딩 중...
              </div>
            }
            error={
              <div className="flex h-[70dvh] w-[600px] flex-col items-center justify-center gap-2 bg-[#fffef9] px-6 text-center text-sm text-red-500">
                <p>PDF를 불러올 수 없습니다.</p>
                {loadError && (
                  <p className="text-xs text-[#8e8e93]">{loadError}</p>
                )}
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderTextLayer
              renderAnnotationLayer
              onRenderSuccess={handlePageLoad}
              className="bg-[#fffef9]"
            />
          </Document>
          <canvas
            ref={canvasRef}
            className="absolute left-0 top-0 touch-none cursor-crosshair"
            style={{ touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          </div>
          <HandwritingAnswer
            text={pageAnswer}
            isLoading={isAnalyzing}
            error={analyzeError}
            pageWidth={pageWidth}
          />
        </div>
      </div>
      {numPages > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-4 border-t border-[#e5e0d8] bg-[#f7f4ef]/80 py-2 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="rounded-lg p-2 text-[#636366] transition hover:bg-[#ebe6de] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[13px] text-[#48484a]">
            {pageNumber} / {numPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="rounded-lg p-2 text-[#636366] transition hover:bg-[#ebe6de] disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
},
);
