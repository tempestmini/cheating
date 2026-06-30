const MAX_WIDTH = 1200;

/** 브라우저에서 PDF 페이지 + 필기 → JPEG (용량·속도 최적화) */
export async function capturePageSnapshot(
  pageRoot: HTMLElement,
): Promise<Blob | null> {
  const pdfCanvas = pageRoot.querySelector<HTMLCanvasElement>(
    ".react-pdf__Page__canvas",
  );
  if (!pdfCanvas || pdfCanvas.width === 0 || pdfCanvas.height === 0) {
    return null;
  }

  const overlayCanvas = pageRoot.querySelector<HTMLCanvasElement>(
    "canvas.touch-none",
  );

  let w = pdfCanvas.width;
  let h = pdfCanvas.height;
  let scale = 1;
  if (w > MAX_WIDTH) {
    scale = MAX_WIDTH / w;
    w = MAX_WIDTH;
    h = Math.round(pdfCanvas.height * scale);
  }

  const merged = document.createElement("canvas");
  merged.width = w;
  merged.height = h;
  const ctx = merged.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#fffef9";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(pdfCanvas, 0, 0, pdfCanvas.width, pdfCanvas.height, 0, 0, w, h);
  if (overlayCanvas && overlayCanvas.width > 0) {
    ctx.drawImage(
      overlayCanvas,
      0,
      0,
      overlayCanvas.width,
      overlayCanvas.height,
      0,
      0,
      w,
      h,
    );
  }

  return new Promise((resolve) => {
    merged.toBlob((blob) => resolve(blob), "image/jpeg", 0.82);
  });
}

export async function capturePageWithRetry(
  pageRoot: HTMLElement | null,
  attempts = 8,
  delayMs = 150,
): Promise<Blob> {
  if (!pageRoot) {
    throw new Error("페이지 준비 중");
  }
  for (let i = 0; i < attempts; i += 1) {
    const blob = await capturePageSnapshot(pageRoot);
    if (blob && blob.size > 0) return blob;
    await new Promise((r) => window.setTimeout(r, delayMs));
  }
  throw new Error("페이지 로딩 후 다시 시도해주세요.");
}
