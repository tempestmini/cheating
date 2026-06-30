"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { EditorShell } from "@/components/EditorShell";
import type { PdfCanvasHandle } from "@/components/PdfCanvas";
import {
  isQuotaErrorMessage,
  markQuotaHit,
  waitIfQuotaBlocked,
} from "@/lib/analyze-queue";
import { loadAnswerCache, saveAnswerCache } from "@/lib/answer-cache";
import { secureFetch } from "@/lib/client-api";
import { capturePageWithRetry } from "@/lib/page-capture";
import type { DocumentItem, PageStrokes, Tool, ViewMode } from "@/types";

function createId() {
  return crypto.randomUUID();
}

type PageAnswer = { text: string };

function pageKey(docId: string, page: number) {
  return `${docId}:${page}`;
}

export function QuizApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfCanvasRef = useRef<PdfCanvasHandle>(null);
  const answersRef = useRef<Record<string, Record<number, PageAnswer>>>({});
  const inflightRef = useRef<Set<string>>(new Set());
  const autoStartedRef = useRef<Set<string>>(new Set());
  const activeIdRef = useRef<string | null>(null);
  const currentPageRef = useRef(1);
  const documentsRef = useRef<DocumentItem[]>([]);
  const runAnalyzeRef = useRef<
    (doc: DocumentItem, page: number, force?: boolean) => Promise<void>
  >(() => Promise.resolve());

  const [view, setView] = useState<ViewMode>("library");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<Tool>("pen");
  const [penColor, setPenColor] = useState("#1a1a1a");
  const [penWidth, setPenWidth] = useState(2);
  const [strokesByDoc, setStrokesByDoc] = useState<
    Record<string, PageStrokes>
  >({});
  const [answersByDoc, setAnswersByDoc] = useState<
    Record<string, Record<number, PageAnswer>>
  >(() => loadAnswerCache());
  const [currentPage, setCurrentPage] = useState(1);
  const [analyzingPages, setAnalyzingPages] = useState<Set<string>>(
    () => new Set(),
  );
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  answersRef.current = answersByDoc;
  activeIdRef.current = activeId;
  currentPageRef.current = currentPage;
  documentsRef.current = documents;

  useEffect(() => {
    saveAnswerCache(answersByDoc);
  }, [answersByDoc]);

  const activeDoc = documents.find((d) => d.id === activeId) ?? null;
  const openTabs = openTabIds
    .map((id) => documents.find((d) => d.id === id))
    .filter((d): d is DocumentItem => !!d);
  const activeStrokes = activeId ? (strokesByDoc[activeId] ?? {}) : {};
  const activePageAnswer =
    activeId != null ? answersByDoc[activeId]?.[currentPage] : undefined;
  const isAnalyzing =
    activeId != null && analyzingPages.has(pageKey(activeId, currentPage));

  const runAnalyze = useCallback(
    async (doc: DocumentItem, page: number, force = false) => {
      const key = pageKey(doc.id, page);
      if (inflightRef.current.has(key)) return;
      if (!force && answersRef.current[doc.id]?.[page]) return;

      inflightRef.current.add(key);
      setAnalyzingPages((prev) => new Set(prev).add(key));
      if (doc.id === activeIdRef.current && page === currentPageRef.current) {
        setAnalyzeError(null);
      }

      try {
        await waitIfQuotaBlocked();
        const pageRoot = pdfCanvasRef.current?.getPageRoot() ?? null;
        const imageBlob = await capturePageWithRetry(pageRoot);
        const formData = new FormData();
        formData.append("image", imageBlob, "page.jpg");
        formData.append("page", String(page));
        const res = await secureFetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "분석 실패");
        }
        setAnswersByDoc((prev) => ({
          ...prev,
          [doc.id]: {
            ...(prev[doc.id] ?? {}),
            [page]: { text: data.answer },
          },
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "오류";
        if (doc.id === activeIdRef.current && page === currentPageRef.current) {
          setAnalyzeError(message);
        }
        if (isQuotaErrorMessage(message)) {
          markQuotaHit();
        }
      } finally {
        inflightRef.current.delete(key);
        setAnalyzingPages((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [],
  );

  runAnalyzeRef.current = runAnalyze;

  const tryAutoAnalyze = useCallback(() => {
    const docId = activeIdRef.current;
    const page = currentPageRef.current;
    if (!docId) return;
    const doc = documentsRef.current.find((d) => d.id === docId);
    if (!doc) return;
    const key = pageKey(docId, page);
    if (answersRef.current[docId]?.[page]) return;
    if (autoStartedRef.current.has(key)) return;
    autoStartedRef.current.add(key);
    void runAnalyzeRef.current(doc, page);
  }, []);

  const handleAnalyze = useCallback(
    (force = false) => {
      if (!activeDoc) return;
      if (force) {
        autoStartedRef.current.delete(pageKey(activeDoc.id, currentPage));
      }
      void runAnalyze(activeDoc, currentPage, force);
    },
    [activeDoc, currentPage, runAnalyze],
  );

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const newDocs: DocumentItem[] = [];
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") continue;
        const id = createId();
        newDocs.push({
          id,
          name: file.name.replace(/\.pdf$/i, ""),
          file,
          url: URL.createObjectURL(file),
          createdAt: Date.now(),
        });
      }
      if (newDocs.length === 0) return;
      setDocuments((prev) => [...newDocs, ...prev]);
      const firstId = newDocs[0].id;
      setOpenTabIds((prev) => [...new Set([...newDocs.map((d) => d.id), ...prev])]);
      setActiveId(firstId);
      setCurrentPage(1);
      setView("editor");
      setAnalyzeError(null);
      e.target.value = "";
    },
    [],
  );

  const handleOpenDoc = useCallback((id: string) => {
    setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveId(id);
    setCurrentPage(1);
    setView("editor");
    setAnalyzeError(null);
  }, []);

  const handleRemoveDoc = useCallback(
    (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (doc) URL.revokeObjectURL(doc.url);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setOpenTabIds((prev) => prev.filter((tabId) => tabId !== id));
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setStrokesByDoc((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAnswersByDoc((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (activeId === id) {
        const remaining = openTabIds.filter((tabId) => tabId !== id);
        setActiveId(remaining[0] ?? null);
        if (remaining.length === 0) setView("library");
        setAnalyzeError(null);
      }
    },
    [documents, activeId, openTabIds],
  );

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleStrokesChange = useCallback(
    (strokes: PageStrokes) => {
      if (!activeId) return;
      setStrokesByDoc((prev) => ({ ...prev, [activeId]: strokes }));
    },
    [activeId],
  );

  const handleUndo = useCallback(() => {
    if (!activeId) return;
    const strokes = { ...(strokesByDoc[activeId] ?? {}) };
    const pageKeys = Object.keys(strokes).map(Number);
    if (pageKeys.length === 0) return;
    const lastPage = Math.max(...pageKeys);
    const pageStrokes = [...(strokes[lastPage] ?? [])];
    if (pageStrokes.length === 0) return;
    pageStrokes.pop();
    strokes[lastPage] = pageStrokes;
    setStrokesByDoc((prev) => ({ ...prev, [activeId]: strokes }));
  }, [activeId, strokesByDoc]);

  const canUndo =
    activeId !== null &&
    Object.values(strokesByDoc[activeId] ?? {}).some((s) => s.length > 0);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      {view === "library" ? (
        <DocumentLibrary
          documents={documents}
          favorites={favorites}
          onOpen={handleOpenDoc}
          onImport={triggerUpload}
          onToggleFavorite={handleToggleFavorite}
          onRemove={handleRemoveDoc}
        />
      ) : activeId ? (
        <EditorShell
          openTabs={openTabs}
          activeDoc={activeDoc}
          activeId={activeId}
          tool={tool}
          penColor={penColor}
          penWidth={penWidth}
          strokes={activeStrokes}
          pageNumber={currentPage}
          onPageChange={(p) => {
            setCurrentPage(p);
            setAnalyzeError(null);
            autoStartedRef.current.delete(pageKey(activeId, p));
          }}
          pageAnswer={activePageAnswer?.text ?? null}
          isAnalyzing={isAnalyzing}
          analyzeError={analyzeError}
          canUndo={canUndo}
          pdfCanvasRef={pdfCanvasRef}
          onPageReady={tryAutoAnalyze}
          onBack={() => setView("library")}
          onSelectTab={(id) => {
            setActiveId(id);
            setCurrentPage(1);
            setAnalyzeError(null);
          }}
          onToolChange={setTool}
          onPenColorChange={setPenColor}
          onPenWidthChange={setPenWidth}
          onStrokesChange={handleStrokesChange}
          onUndo={handleUndo}
          onOpenStudy={() => handleAnalyze(true)}
        />
      ) : (
        <DocumentLibrary
          documents={documents}
          favorites={favorites}
          onOpen={handleOpenDoc}
          onImport={triggerUpload}
          onToggleFavorite={handleToggleFavorite}
          onRemove={handleRemoveDoc}
        />
      )}
    </>
  );
}
