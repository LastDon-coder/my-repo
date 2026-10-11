/* Runs on every page: analytics, login-aware nav, newsletter signup. */
import {
  cfg, isSet, hasSupabase, setStatus, setBusy, clean, looksLikeEmail,
  isSpamTrap, insertRow, sendToFormspree
} from "./lib.js";
import "./chat.js";

/* ---------- Analytics (privacy-friendly, no cookies) ---------- */

function addScript(attrs) {
  const s = document.createElement("script");
  s.defer = true;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

if (isSet(cfg.cloudflareAnalyticsToken)) {
  addScript({
    src: "https://static.cloudflareinsights.com/beacon.min.js",
    "data-cf-beacon": JSON.stringify({ token: cfg.cloudflareAnalyticsToken.trim() })
  });
}
if (cfg.umami && isSet(cfg.umami.scriptUrl) && isSet(cfg.umami.websiteId)) {
  addScript({ src: cfg.umami.scriptUrl.trim(), "data-website-id": cfg.umami.websiteId.trim() });
}

/* ---------- Nav: swap "Log in" for "My courses" when a real session exists ---------- */

function hasRealSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/^sb-.+-auth-token$/.test(key)) {
        const data = JSON.parse(localStorage.getItem(key));
        const user = data && data.user;
        if (user && !user.is_anonymous) return true;
      }
    }
  } catch (_) { /* storage blocked: treat as logged out */ }
  return false;
}

const authLink = document.querySelector("[data-auth-link]");
if (authLink) {
  if (!hasSupabase()) {
    authLink.closest("li")?.remove();          // no backend configured: hide login
  } else if (hasRealSession()) {
    authLink.textContent = "My courses";
    authLink.setAttribute("href", "dashboard.html");
    if (location.pathname.endsWith("/dashboard.html")) authLink.setAttribute("aria-current", "page");
  }
}

/* ---------- Newsletter signup (footer) ---------- */

const newsletter = document.getElementById("newsletter-form");
if (newsletter) {
  const status = newsletter.querySelector(".form-status");
  const button = newsletter.querySelector("button");

  newsletter.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSpamTrap(newsletter)) { setStatus(status, "success", "Thanks, you're subscribed."); return; }

    const email = clean(newsletter.elements.email.value, 254).toLowerCase();
    if (!looksLikeEmail(email)) {
      setStatus(status, "error", "Please enter a valid email address.");
      newsletter.elements.email.focus();
      return;
    }

    setBusy(button, true, "Subscribing…");
    setStatus(status, "", "");

    const db = await insertRow("newsletter_subscribers", { email });
    let mailed = { ok: false, skipped: true };
    if (!db.duplicate) {
      mailed = await sendToFormspree({
        _subject: "Newsletter signup: Cosman Tech Academy",
        form_type: "newsletter",
        email
      });
    }
    setBusy(button, false);

    if (db.ok || db.duplicate || mailed.ok) {
      newsletter.reset();
      setStatus(status, "success", db.duplicate
        ? "You're already on the list. Thank you!"
        : "Thanks, you're subscribed.");
    } else if (db.skipped && mailed.skipped) {
      setStatus(status, "error", "Signup isn't switched on yet. Please check back soon.");
    } else {
      setStatus(status, "error", "Something went wrong. Please try again in a moment.");
    }
  });
}
