/* ==================================================
   SITE CONFIGURATION
   Fill these in after creating your free accounts.
   Every value here is PUBLIC (it ships to the browser),
   so never put a Supabase service_role key here.
   Leave a value empty to switch that feature off.
   ================================================== */

window.APP_CONFIG = {
  // Formspree: https://formspree.io  -> New Form -> copy the endpoint
  // Example: "https://formspree.io/f/abcdwxyz"
  formspreeEndpoint: "https://formspree.io/f/mnjwyzpb",

  // Supabase: Project Settings -> API
  supabaseUrl: "https://ngkgdjrwbzrisdczrhtp.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2dkanJ3YnpyaXNkY3pyaHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDYxNjQsImV4cCI6MjEwNzIyMjE2NH0.-6THjiBD_Z7ZUm3y8nAE0zPzfLNsisOTFdFpqxfEHb0", // public "anon" key: safe to expose because Row Level Security is on

  // Cloudflare Turnstile (free CAPTCHA): dash.cloudflare.com -> Turnstile
  // Use the SITE key here. The secret key goes into Supabase (Auth -> Attack Protection).
  turnstileSiteKey: "",

  // Strict mode: registrations require a passed Turnstile check, enforced by Supabase
  // (anonymous sign-in + CAPTCHA). Turn on ONLY after following the "Hardening" step in README.md.
  strictRegistration: false,

  // Analytics (pick one, or neither)
  cloudflareAnalyticsToken: "",   // Cloudflare Web Analytics beacon token
  umami: { scriptUrl: "", websiteId: "" },

  // WhatsApp click-to-chat (no signup, no API). Number with country code,
  // e.g. "2348030000000" or "08030000000" (a leading 0 is read as Nigeria, +234).
  whatsapp: {
    number: "08162629105",
    message: "Hello Cosman Tech Academy, I'd like to know more about your courses."
  },

  // Tawk.to live chat (free): dashboard.tawk.to -> Administration -> Channels -> Chat Widget.
  // The embed link looks like https://embed.tawk.to/PROPERTY_ID/WIDGET_ID
  tawk: { propertyId: "6acae1ffe3906234c203e997", widgetId: "1k4k85jvj" },

  // Optional payment links (Paystack / Flutterwave payment pages), one per course.
  // When set, the registration success message shows a "Pay now" button.
  paymentLinks: {
    "html": "",
    "css": "",
    "javascript": "",
    "web-development": ""
  }
};
