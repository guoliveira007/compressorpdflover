import { useEffect } from "react";
import { ADSENSE_CLIENT } from "./AdSlot";

export function AdSenseScript() {
  useEffect(() => {
    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    if (document.querySelector(`script[src="${src}"]`)) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, []);

  return null;
}
