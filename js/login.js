/* Passwordless login: Supabase emails the student a one-time magic link. */
import {
  cfg, hasSupabase, getSupabase, mountTurnstile, hasTurnstile,
  setStatus, setBusy, clean, looksLikeEmail, isSpamTrap
} from "./lib.js";

const form = document.getElementById("login-form");
const status = document.getElementById("form-status");
const button = document.getElementById("login-submit");

if (form) {
  if (!hasSupabase()) {
    form.hidden = true;
    setStatus(status, "error", "Student login isn't switched on yet.");
  } else {
    let turnstile = null;
    if (hasTurnstile()) mountTurnstile(document.getElementById("turnstile-box")).then((t) => { turnstile = t; });

    // Already signed in? Go straight to the dashboard.
    getSupabase().then(async (supabase) => {
      const { data } = await supabase.auth.getSession();
      if (data.session && !data.session.user.is_anonymous) location.replace("dashboard.html");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSpamTrap(form)) return;

      const email = clean(form.elements.email.value, 254).toLowerCase();
      if (!looksLikeEmail(email)) {
        setStatus(status, "error", "Please enter a valid email address.");
        form.elements.email.focus();
        return;
      }
      const captchaToken = turnstile ? turnstile.getToken() : undefined;
      if (turnstile && !captchaToken) {
        setStatus(status, "error", "Please complete the spam check below.");
        return;
      }

      setBusy(button, true, "Sending link…");
      setStatus(status, "", "");
      const supabase = await getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // true = any verified email can log in. That's safe: the dashboard only ever
          // shows rows whose email matches the logged-in address (Row Level Security).
          shouldCreateUser: true,
          emailRedirectTo: new URL("dashboard.html", location.href).href,
          captchaToken
        }
      });
      setBusy(button, false);
      if (turnstile) turnstile.reset();

      if (error) {
        console.error("Login failed:", error.message);
        setStatus(status, "error", /rate|seconds/i.test(error.message)
          ? "Please wait a minute before requesting another link."
          : "We couldn't send the login link. Please try again.");
        return;
      }
      setStatus(status, "success", `Check your inbox. We sent a login link to ${email}. It may take a minute, and check spam if it doesn't arrive.`);
    });
  }
}
