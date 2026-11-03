// Studio contact settings. Values come from Vite env variables (see .env.example).

/** WhatsApp number in international format, digits only. VITE_WHATSAPP_NUMBER overrides the studio's own. */
export const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || "6282299417885").replace(/\D/g, "");

/** Endpoint the inquiry form posts to. Defaults to the bundled Vercel function. */
export const INQUIRY_ENDPOINT = import.meta.env.VITE_INQUIRY_ENDPOINT || "/api/inquiry";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Halo END. YOURCREATIVE! Saya ingin ngobrol soal proyek.";

/**
 * Builds a wa.me link. Without a configured number, WhatsApp opens its
 * contact picker with the message pre-filled, so the link never breaks.
 */
export function whatsappLink(message = DEFAULT_WHATSAPP_MESSAGE) {
  const text = encodeURIComponent(message);
  return WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
    : `https://wa.me/?text=${text}`;
}
