/* Chat: WhatsApp click-to-chat button (bottom-left) + Tawk.to live chat (bottom-right). */
import { cfg, isSet } from "./lib.js";

/* ---------- WhatsApp ---------- */

/** Digits only, with country code. A leading 0 on an 11-digit number means Nigeria. */
export function normaliseWhatsAppNumber(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = "234" + digits.slice(1);
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : "";
}

const wa = cfg.whatsapp || {};
const waNumber = normaliseWhatsAppNumber(wa.number);

if (waNumber) {
  const text = isSet(wa.message) ? wa.message : "Hello, I'd like to know more about your courses.";
  const href = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

  // Any link marked data-whatsapp-link becomes visible and points at the chat.
  document.querySelectorAll("[data-whatsapp-link]").forEach((a) => {
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.hidden = false;
  });

  // Floating button
  const float = document.createElement("a");
  float.className = "wa-float";
  float.href = href;
  float.target = "_blank";
  float.rel = "noopener";
  float.setAttribute("aria-label", "Chat with us on WhatsApp (opens in a new tab)");
  float.innerHTML =
    '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.19 1.6 6.01L4 29l8.13-1.57a12.02 12.02 0 0 0 3.9.65h.01C22.68 28.08 28 22.68 28 16.04 28 9.4 22.68 3 16.04 3Zm0 22.03h-.01a10 10 0 0 1-5.1-1.4l-.37-.22-4.83.93.96-4.7-.24-.38a9.97 9.97 0 0 1-1.53-5.3c0-5.52 4.5-10.02 10.04-10.02 5.52 0 10.02 4.5 10.02 10.04 0 5.53-4.5 10.05-10.04 10.05Zm5.5-7.5c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.17.2-.35.23-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.5-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.23 5.13 4.53.72.3 1.28.5 1.72.64.72.23 1.37.2 1.89.12.57-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.12-.28-.2-.58-.35Z"/></svg>' +
    '<span class="wa-float-label">Chat on WhatsApp</span>';
  document.body.appendChild(float);
}

/* ---------- Tawk.to (loaded on first interaction so it never slows the page) ---------- */

const tawk = cfg.tawk || {};

if (isSet(tawk.propertyId)) {
  const prop = tawk.propertyId.trim();
  const widget = isSet(tawk.widgetId) ? tawk.widgetId.trim() : "default";

  // Only plain id characters are allowed into the script URL.
  if (/^[A-Za-z0-9]+$/.test(prop) && /^[A-Za-z0-9]+$/.test(widget)) {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      ["pointerdown", "keydown", "scroll", "touchstart"].forEach((e) => window.removeEventListener(e, start));
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://embed.tawk.to/${prop}/${widget}`;
      s.charset = "UTF-8";
      s.setAttribute("crossorigin", "*");
      document.head.appendChild(s);
    };
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach((e) =>
      window.addEventListener(e, start, { once: true, passive: true }));
    setTimeout(start, 6000);
  }
}
