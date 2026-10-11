/* Shared helpers for Cosman Tech Academy (no build step, plain ES modules) */

export const cfg = window.APP_CONFIG || {};

export const COURSES = {
  "html": "HTML Fundamentals",
  "css": "CSS Fundamentals",
  "javascript": "JavaScript Fundamentals",
  "web-development": "Web Development"
};

export function isSet(value) {
  return typeof value === "string" && value.trim() !== "" && !/YOUR_/i.test(value);
}

export const hasSupabase = () => isSet(cfg.supabaseUrl) && isSet(cfg.supabaseAnonKey);
export const hasFormspree = () => isSet(cfg.formspreeEndpoint);
export const hasTurnstile = () => isSet(cfg.turnstileSiteKey);

/* ---------- Supabase (lazy, vendored, one shared client) ---------- */

let clientPromise = null;

export function getSupabase() {
  if (!hasSupabase()) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("./vendor/supabase.js").then(({ createClient }) =>
      createClient(cfg.supabaseUrl.trim(), cfg.supabaseAnonKey.trim(), {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    );
  }
  return clientPromise;
}

/* ---------- Formspree ---------- */

export async function sendToFormspree(fields) {
  if (!hasFormspree()) return { ok: false, skipped: true };
  try {
    const res = await fetch(cfg.formspreeEndpoint.trim(), {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(fields)
    });
    if (res.ok) return { ok: true };
    let detail = "";
    try { detail = (await res.json()).error || ""; } catch (_) { /* ignore */ }
    return { ok: false, error: detail || `Formspree responded ${res.status}` };
  } catch (err) {
    return { ok: false, error: "Network error" };
  }
}

/* ---------- Cloudflare Turnstile ---------- */

let turnstileLoader = null;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileLoader) {
    turnstileLoader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Turnstile failed to load"));
      document.head.appendChild(s);
    });
  }
  return turnstileLoader;
}

/** Renders a Turnstile widget into `container`. Returns null when Turnstile is off. */
export async function mountTurnstile(container) {
  if (!container || !hasTurnstile()) return null;
  let token = "";
  let widgetId = null;
  try {
    await loadTurnstileScript();
    widgetId = window.turnstile.render(container, {
      sitekey: cfg.turnstileSiteKey.trim(),
      callback: (t) => { token = t; },
      "expired-callback": () => { token = ""; },
      "error-callback": () => { token = ""; }
    });
  } catch (_) {
    container.textContent = "Spam check could not load. Please refresh the page.";
  }
  return {
    getToken: () => token,
    reset: () => { token = ""; if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId); }
  };
}

/* ---------- UI helpers ---------- */

export function setStatus(el, type, message) {
  if (!el) return;
  el.className = "form-status" + (type ? ` is-${type}` : "");
  el.textContent = "";
  if (message instanceof Node) el.appendChild(message);
  else el.textContent = message || "";
  el.hidden = !message;
}

export function setBusy(button, busy, busyLabel) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = busyLabel || "Sending…";
  } else if (button.dataset.label) {
    button.textContent = button.dataset.label;
  }
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
}

export const clean = (v, max = 500) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

export const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** True when the hidden spam-trap field has been filled in (bots only). */
export const isSpamTrap = (form) => !!(form.querySelector('[name="_gotcha"]')?.value);

/** Insert one row. Uses return=minimal, so only an INSERT policy is needed. */
export async function insertRow(table, row) {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, skipped: true };
  const { error } = await supabase.from(table).insert(row);
  if (!error) return { ok: true };
  if (error.code === "23505") return { ok: false, duplicate: true };
  return { ok: false, error: error.message };
}
