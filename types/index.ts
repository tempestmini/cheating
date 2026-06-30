export type Point = { x: number; y: number };

export type Stroke = {
  points: Point[];
  color: string;
  width: number;
  tool?: Tool;
};

export type PageStrokes = Record<number, Stroke[]>;

export type DocumentItem = {
  id: string;
  name: string;
  file: File;
  url: string;
  createdAt: number;
};

export type Tool = "pen" | "eraser" | "highlighter";

export type ViewMode = "library" | "editor";

export type AnalyzeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; answer: string }
  | { status: "error"; message: string };
