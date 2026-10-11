/* Registration: saves to Supabase AND emails you through Formspree. */
import {
  cfg, COURSES, hasSupabase, hasFormspree, getSupabase, sendToFormspree, insertRow,
  mountTurnstile, setStatus, setBusy, clean, looksLikeEmail, isSpamTrap
} from "./lib.js";

const form = document.getElementById("register-form");
const status = document.getElementById("form-status");
const button = document.getElementById("register-submit");

if (form) {
  const strict = !!cfg.strictRegistration && hasSupabase();
  let turnstile = null;

  // Pre-select a course from ?course=css (used by the "Register" links on the course cards)
  const wanted = new URLSearchParams(location.search).get("course");
  if (wanted && COURSES[wanted]) form.elements.course.value = wanted;

  if (strict) mountTurnstile(document.getElementById("turnstile-box")).then((t) => { turnstile = t; });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSpamTrap(form)) { setStatus(status, "success", "Thank you. Your registration has been received."); return; }

    const data = {
      full_name: clean(form.elements.fullname.value, 120),
      email: clean(form.elements.email.value, 254).toLowerCase(),
      phone: clean(form.elements.phone.value, 20),
      course: form.elements.course.value,
      gender: form.elements.gender.value || null,
      address: clean(form.elements.address.value, 500) || null
    };

    // ----- Validation (the database re-checks all of this) -----
    const problems = [];
    if (data.full_name.length < 2) problems.push(["fullname", "Please enter your full name."]);
    if (!looksLikeEmail(data.email)) problems.push(["email", "Please enter a valid email address."]);
    if (!/^\+?[0-9\s()-]{7,20}$/.test(data.phone)) problems.push(["phone", "Please enter a valid phone number."]);
    if (!COURSES[data.course]) problems.push(["course", "Please choose a course."]);
    if (!form.elements.consent.checked) problems.push(["consent", "Please agree to the privacy notice to continue."]);
    if (problems.length) {
      setStatus(status, "error", problems.map((p) => p[1]).join(" "));
      form.elements[problems[0][0]].focus();
      return;
    }

    setBusy(button, true, "Registering…");
    setStatus(status, "", "");

    // ----- Strict mode: real CAPTCHA enforced by Supabase via anonymous sign-in -----
    if (strict) {
      const token = turnstile && turnstile.getToken();
      if (!token) {
        setBusy(button, false);
        setStatus(status, "error", "Please complete the spam check below before submitting.");
        return;
      }
      const supabase = await getSupabase();
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const { error } = await supabase.auth.signInAnonymously({ options: { captchaToken: token } });
        if (error) {
          setBusy(button, false);
          turnstile.reset();
          setStatus(status, "error", "The spam check failed. Please try again.");
          return;
        }
      }
    }

    // ----- 1) Save to Supabase, 2) email via Formspree -----
    const db = await insertRow("registrations", data);

    let mailed = { ok: false, skipped: true };
    if (!db.duplicate) {
      mailed = await sendToFormspree({
        _subject: `New registration: ${COURSES[data.course]}`,
        form_type: "registration",
        name: data.full_name,
        email: data.email,          // Formspree uses this as the reply-to address
        phone: data.phone,
        course: COURSES[data.course],
        gender: data.gender || "Not given",
        address: data.address || "Not given",
        saved_to_database: db.ok ? "yes" : "no"
      });
    }

    setBusy(button, false);
    if (strict && turnstile) turnstile.reset();

    if (db.duplicate) {
      setStatus(status, "info", `You have already registered for ${COURSES[data.course]} with this email. We'll be in touch soon.`);
      return;
    }

    if (db.ok || mailed.ok) {
      showSuccess(data);
      form.reset();
      return;
    }

    if (db.skipped && mailed.skipped) {
      setStatus(status, "error", "Registration isn't switched on yet. The site owner still needs to connect Formspree or Supabase (see README.md).");
    } else {
      setStatus(status, "error", "We couldn't submit your registration. Please check your connection and try again.");
    }
    if (db.error) console.error("Supabase insert failed:", db.error);
  });
}

function showSuccess(data) {
  const box = document.createElement("div");
  const p = document.createElement("p");
  p.textContent = `Thank you, ${data.full_name.split(" ")[0]}! Your registration for ${COURSES[data.course]} has been received. We will contact you at ${data.email}.`;
  box.appendChild(p);

  const pay = (cfg.paymentLinks || {})[data.course];
  if (pay && /^https:\/\//.test(pay)) {
    const a = document.createElement("a");
    a.className = "button";
    a.href = pay;
    a.rel = "noopener";
    a.textContent = "Pay now to secure your place";
    a.style.marginTop = "1rem";
    box.appendChild(a);
  }
  if (hasSupabase()) {
    const l = document.createElement("a");
    l.className = "text-link";
    l.href = "login.html";
    l.textContent = "Log in with your email to track your courses →";
    box.appendChild(document.createElement("br"));
    box.appendChild(l);
  }
  setStatus(status, "success", box);
  status.setAttribute("tabindex", "-1");
  status.focus();
}
