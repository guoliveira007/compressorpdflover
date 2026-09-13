// Client-only PDF compression. Renders each page with pdf.js to a canvas,
// re-encodes it as JPEG, and rebuilds a new PDF with pdf-lib.

export type PresetId = "quality" | "balanced" | "compact";

export const PRESETS: Record<PresetId, { label: string; scale: number; quality: number; note: string }> = {
  quality: { label: "Qualidade", scale: 2, quality: 0.82, note: "Alta resolução, redução moderada" },
  balanced: { label: "Equilíbrio", scale: 1.5, quality: 0.65, note: "Melhor relação nitidez/tamanho" },
  compact: { label: "Compacto", scale: 1, quality: 0.45, note: "Menor arquivo possível" },
};

export const PRESET_ORDER: PresetId[] = ["quality", "balanced", "compact"];

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function compressPdf(
  file: File,
  preset: PresetId,
  onProgress: (done: number, total: number) => void,
): Promise<{ blob: Blob; pages: number }> {
  const [pdfjs, { PDFDocument }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdf-lib"),
  ]);
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const { scale, quality } = PRESETS[preset];
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const out = await PDFDocument.create();
  const total = doc.numPages;
  onProgress(0, total);

  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport } as never).promise;

    const jpegBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))), "image/jpeg", quality),
    );
    const image = await out.embedJpg(new Uint8Array(await jpegBlob.arrayBuffer()));
    const base = page.getViewport({ scale: 1 });
    const newPage = out.addPage([base.width, base.height]);
    newPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });

    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    onProgress(i, total);
  }

  await doc.cleanup();
  const saved = await out.save({ useObjectStreams: true });
  return { blob: new Blob([saved as unknown as BlobPart], { type: "application/pdf" }), pages: total };
}
