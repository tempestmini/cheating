import { pdfjs } from "react-pdf";

/** Must match react-pdf's bundled pdfjs-dist version (see pdfjs.version). */
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export { pdfjs };
