"use client";

import { Document, Page } from "react-pdf";
import "@/lib/pdf-worker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

type PdfThumbnailProps = {
  pdfFile: File;
  width?: number;
};

export function PdfThumbnail({ pdfFile, width = 140 }: PdfThumbnailProps) {
  return (
    <Document
      file={pdfFile}
      loading={
        <div
          className="animate-pulse rounded-md bg-[#3a3a3c]"
          style={{ width, height: width * 1.35 }}
        />
      }
      error={
        <div
          className="flex items-center justify-center rounded-md bg-[#3a3a3c] text-[10px] text-[#8e8e93]"
          style={{ width, height: width * 1.35 }}
        >
          PDF
        </div>
      }
    >
      <Page
        pageNumber={1}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        className="overflow-hidden rounded-md bg-white shadow-sm"
      />
    </Document>
  );
}
