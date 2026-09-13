import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const ADSENSE_CLIENT = "ca-pub-2393175590954194";

/**
 * IDs dos blocos de anúncio criados no painel do AdSense
 * (Anúncios → Por bloco de anúncios). Enquanto um ID estiver vazio,
 * o espaço correspondente não renderiza nada.
 */
export const AD_SLOTS = {
  sidebarLeft: "",
  sidebarRight: "",
  footer: "",
} as const;

type AdSlotProps = {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
};

export function AdSlot({ slot, format = "auto", className = "" }: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script ainda não carregou ou bloqueador de anúncios ativo.
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <div className={className} aria-label="Publicidade">
      <span className="mb-1 block text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        Publicidade
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
