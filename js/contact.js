/* Contact form: delivered to your inbox by Formspree. */
import {
  hasFormspree, sendToFormspree, setStatus, setBusy, clean, looksLikeEmail, isSpamTrap
} from "./lib.js";

const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");
const button = document.getElementById("contact-submit");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSpamTrap(form)) { setStatus(status, "success", "Thanks! Your message has been sent."); return; }

    const name = clean(form.elements.name.value, 120);
    const email = clean(form.elements.email.value, 254).toLowerCase();
    const message = String(form.elements.message.value).trim().slice(0, 4000);

    if (name.length < 2) { setStatus(status, "error", "Please enter your name."); form.elements.name.focus(); return; }
    if (!looksLikeEmail(email)) { setStatus(status, "error", "Please enter a valid email address."); form.elements.email.focus(); return; }
    if (message.length < 10) { setStatus(status, "error", "Please write a little more (at least 10 characters)."); form.elements.message.focus(); return; }

    if (!hasFormspree()) {
      setStatus(status, "error", "The contact form isn't switched on yet. The site owner still needs to add a Formspree endpoint (see README.md).");
      return;
    }

    setBusy(button, true, "Sending…");
    setStatus(status, "", "");
    const res = await sendToFormspree({
      _subject: `Website message from ${name}`,
      form_type: "contact",
      name, email, message
    });
    setBusy(button, false);

    if (res.ok) {
      form.reset();
      setStatus(status, "success", "Thanks! Your message has been sent. We'll reply by email.");
    } else {
      setStatus(status, "error", "We couldn't send your message. Please try again in a moment.");
    }
  });
}
