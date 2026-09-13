import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { FileText, Upload, Lock, RotateCcw, Download } from "lucide-react";

import { PRESETS, PRESET_ORDER, compressPdf, formatBytes, type PresetId } from "@/lib/compress-pdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comprimir PDF no Navegador | Compressor de PDF Privado" },
      {
        name: "description",
        content:
          "Reduza o tamanho de arquivos PDF diretamente no navegador. Nenhum arquivo é enviado a servidores: a compressão acontece 100% no seu dispositivo.",
      },
      { property: "og:title", content: "Comprimir PDF no Navegador | Compressor de PDF Privado" },
      {
        property: "og:description",
        content:
          "Compressor de PDF que funciona offline no seu navegador. Escolha entre qualidade, equilíbrio ou compacto e baixe o arquivo reduzido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Status = "idle" | "working" | "done" | "error";

function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [presetIndex, setPresetIndex] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ url: string; size: number; pages: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const preset: PresetId = PRESET_ORDER[presetIndex] ?? "balanced";

  const accept = useCallback((incoming: File | undefined | null) => {
    if (!incoming) return;
    if (incoming.type !== "application/pdf" && !incoming.name.toLowerCase().endsWith(".pdf")) {
      setError("Selecione um arquivo PDF.");
      return;
    }
    setError(null);
    setResult(null);
    setStatus("idle");
    setFile(incoming);
  }, []);

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = "";
  };

  const run = async () => {
    if (!file) return;
    setStatus("working");
    setError(null);
    setProgress({ done: 0, total: 0 });
    try {
      const { blob, pages } = await compressPdf(file, preset, (done, total) =>
        setProgress({ done, total }),
      );
      setResult({ url: URL.createObjectURL(blob), size: blob.size, pages });
      setStatus("done");
    } catch (e) {
      console.error(e);
      setError("Não foi possível comprimir este PDF. Ele pode estar protegido por senha ou corrompido.");
      setStatus("error");
    }
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const saved = result && file ? Math.max(0, 1 - result.size / file.size) : 0;

  return (
    <div className="paper-grain min-h-screen">
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-14">
        <header className="border-b border-border pb-8">
          <p className="text-sm font-semibold text-stamp">Edição local, sem servidores</p>
          <h1 className="mt-4 text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Compressor de PDF
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Reduza o peso dos seus documentos sem sair do navegador. O arquivo nunca é enviado para
            nenhum servidor — todo o processamento acontece no seu próprio dispositivo.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 border border-border px-3 py-2 text-sm font-medium">
            <Lock className="h-3 w-3 text-stamp" aria-hidden />
            100% no navegador
          </p>
        </header>

        <main className="mt-10 space-y-10">
          {/* Upload */}
          <section>
            <SectionTitle index="01" title="Documento" />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                accept(e.dataTransfer.files?.[0]);
              }}
              className={`mt-4 border border-dashed p-10 text-center transition-colors ${
                dragging ? "border-stamp bg-card" : "border-border bg-card/60"
              }`}
            >
              <Upload className="mx-auto h-6 w-6 text-stamp" aria-hidden />
              <p className="mt-4 text-lg font-medium">Arraste um PDF para cá</p>
              <p className="mt-1 text-base text-muted-foreground">ou</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 border border-foreground px-5 py-2.5 text-base font-medium transition-colors hover:bg-foreground hover:text-primary-foreground"
              >
                Escolher arquivo
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => accept(e.target.files?.[0])}
              />
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between border border-border bg-card px-4 py-3">
                <span className="flex min-w-0 items-center gap-3 text-base">
                  <FileText className="h-4 w-4 shrink-0 text-stamp" aria-hidden />
                  <span className="truncate">{file.name}</span>
                </span>
                <span className="ml-4 shrink-0 text-base text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
              </div>
            )}
          </section>

          {/* Controls */}
          <section>
            <SectionTitle index="02" title="Nível de compressão" />
            <div className="mt-4 border border-border bg-card p-6">
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={presetIndex}
                onChange={(e) => setPresetIndex(Number(e.target.value))}
                aria-label="Nível de compressão"
                className="accent-stamp w-full"
              />
              <div className="mt-3 grid grid-cols-3 text-base font-medium">
                {PRESET_ORDER.map((id, i) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPresetIndex(i)}
                    className={`py-1 ${i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"} ${
                      presetIndex === i ? "font-semibold text-stamp" : "text-muted-foreground"
                    }`}
                  >
                    {PRESETS[id].label}
                  </button>
                ))}
              </div>
              <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
                <Metric label="Resolução" value={`${PRESETS[preset].scale}×`} />
                <Metric label="Qualidade JPEG" value={`${Math.round(PRESETS[preset].quality * 100)}%`} />
                <Metric label="Perfil" value={PRESETS[preset].note} mono={false} />
              </dl>
              <p className="mt-5 border-l-2 border-stamp bg-secondary/60 px-4 py-3 text-base leading-relaxed text-muted-foreground">
                Cada página é re-renderizada como uma imagem comprimida. Isso reduz bastante o
                tamanho do arquivo, mas o texto deixa de ser selecionável e não poderá mais ser
                pesquisado ou editado.
              </p>
            </div>
          </section>

          {/* Execution */}
          <section>
            <SectionTitle index="03" title="Processar" />
            <div className="mt-4 space-y-4">
              <button
                type="button"
                disabled={!file || status === "working"}
                onClick={run}
                className="w-full bg-stamp px-6 py-4 text-lg font-semibold text-stamp-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === "working" ? "Comprimindo…" : "Comprimir PDF"}
              </button>

              {status === "working" && (
                <div>
                  <div className="h-2 w-full border border-border bg-card">
                    <div
                      className="h-full bg-stamp transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-base text-muted-foreground">
                    Página {progress.done} de {progress.total || "—"} · {pct}%
                  </p>
                </div>
              )}

              {error && (
                <p className="border border-destructive px-4 py-3 text-base text-destructive">{error}</p>
              )}
            </div>
          </section>

          {/* Results */}
          {result && file && (
            <section>
              <SectionTitle index="04" title="Resultado" />
              <div className="mt-4 border border-border bg-card">
                <div className="grid divide-border sm:grid-cols-3 sm:divide-x">
                  <Metric label="Antes" value={formatBytes(file.size)} pad />
                  <Metric label="Depois" value={formatBytes(result.size)} pad />
                  <Metric label="Economia" value={`${Math.round(saved * 100)}%`} pad accent />
                </div>
                <div className="flex flex-wrap gap-3 border-t border-border p-6">
                  <a
                    href={result.url}
                    download={file.name.replace(/\.pdf$/i, "") + "-comprimido.pdf"}
                    className="inline-flex items-center gap-2 bg-foreground px-6 py-3 text-base font-semibold text-primary-foreground"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Baixar PDF
                  </a>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 border border-foreground px-6 py-3 text-base font-medium transition-colors hover:bg-secondary"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Começar de novo
                  </button>
                </div>
                {result.size >= file.size && (
                  <p className="border-t border-border px-6 py-4 text-base leading-relaxed text-muted-foreground">
                    Este PDF já era muito otimizado (pouco conteúdo de imagem), então a versão
                    comprimida ficou maior. Mantenha o arquivo original ou tente o nível Compacto.
                  </p>
                )}
                <p className="border-t border-border px-6 py-4 text-base text-muted-foreground">
                  {result.pages} página(s) processada(s) localmente
                </p>
              </div>
            </section>
          )}

          {/* SEO content */}
          <section className="border-t border-border pt-10">
            <h2 className="text-3xl font-semibold tracking-tight">Como funciona a compressão de PDF</h2>
            <div className="mt-5 space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                Um arquivo PDF costuma pesar mais do que precisa porque guarda imagens em alta
                resolução, fontes incorporadas e dados de digitalização. A forma mais eficaz de
                reduzir esse peso é reamostrar o conteúdo visual de cada página: diminuir a
                resolução para um valor adequado à leitura em tela e recodificar a imagem com
                compressão JPEG, que descarta detalhes que o olho quase não percebe.
              </p>
              <h3 className="pt-2 text-xl font-semibold text-foreground">Privacidade por arquitetura</h3>
              <p>
                Serviços tradicionais de compressão exigem o envio do documento para um servidor
                remoto, onde ele é processado e armazenado por algum tempo. Aqui não existe esse
                trajeto: a leitura do PDF, a renderização das páginas e a gravação do novo arquivo
                acontecem dentro da aba do seu navegador, usando a própria capacidade de
                processamento do seu computador. Nada sai do dispositivo, o que torna a ferramenta
                adequada para contratos, laudos, documentos pessoais e material confidencial.
              </p>
              <h3 className="pt-2 text-xl font-semibold text-foreground">Qual nível escolher</h3>
              <p>
                <strong className="text-foreground">Qualidade</strong> mantém alta resolução e é
                indicada quando o PDF será impresso ou contém gráficos finos.{" "}
                <strong className="text-foreground">Equilíbrio</strong> é a escolha padrão para
                envio por e-mail e leitura em tela.{" "}
                <strong className="text-foreground">Compacto</strong> prioriza o menor arquivo
                possível, ideal para anexos com limite rígido de tamanho.
              </p>
              <h3 className="pt-2 text-xl font-semibold text-foreground">O que muda no arquivo final</h3>
              <p>
                Como cada página passa a ser uma imagem, o texto deixa de ser selecionável e
                pesquisável, e formulários, links e anotações não são preservados. Se você precisa
                manter o texto pesquisável, guarde também o arquivo original. Documentos protegidos
                por senha precisam ser desbloqueados antes da compressão.
              </p>
            </div>
          </section>
        </main>

        <footer className="mt-14 border-t border-border pt-6 text-base text-muted-foreground">
          Processamento local. Nenhum upload.
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-border pb-2">
      <span className="text-sm font-semibold text-stamp">{index}</span>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Metric({
  label,
  value,
  mono = true,
  pad = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  pad?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={pad ? "p-6" : ""}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 ${mono ? "text-2xl font-semibold" : "text-base"} ${
          accent ? "text-stamp" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
