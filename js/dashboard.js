/* Student dashboard: shows only the signed-in student's own registrations (enforced by RLS). */
import { COURSES, hasSupabase, getSupabase } from "./lib.js";

const root = document.getElementById("dashboard");
const list = document.getElementById("registration-list");
const who = document.getElementById("who");
const logout = document.getElementById("logout");
const msg = document.getElementById("dashboard-message");

const STATUS_LABELS = {
  pending: "Pending review",
  confirmed: "Confirmed",
  paid: "Paid",
  cancelled: "Cancelled"
};

function show(text) { msg.textContent = text; msg.hidden = !text; }

async function init() {
  if (!hasSupabase()) { show("Student login isn't switched on yet."); return; }

  const supabase = await getSupabase();

  // detectSessionInUrl exchanges the magic-link tokens for a session on load.
  const { data } = await supabase.auth.getSession();
  const user = data.session && data.session.user;
  if (!user || user.is_anonymous) { location.replace("login.html"); return; }

  // Remove the one-time tokens from the address bar.
  if (location.hash || location.search.includes("code=")) history.replaceState({}, "", location.pathname);

  root.hidden = false;
  who.textContent = user.email;

  logout.addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.href = "index.html";
  });

  const { data: rows, error } = await supabase
    .from("registrations")
    .select("id, course, status, created_at")
    .order("created_at", { ascending: false });

  if (error) { console.error(error.message); show("We couldn't load your courses. Please refresh."); return; }
  if (!rows.length) { show("You haven't registered for a course with this email yet."); return; }

  rows.forEach((row) => {
    const li = document.createElement("li");
    li.className = "dash-item";

    const left = document.createElement("div");
    const h = document.createElement("h3");
    h.textContent = COURSES[row.course] || row.course;
    const p = document.createElement("p");
    p.className = "small-note";
    p.textContent = "Registered " + new Date(row.created_at).toLocaleDateString("en-NG", { dateStyle: "long" });
    left.append(h, p);

    const pill = document.createElement("span");
    pill.className = `status-pill is-${row.status}`;
    pill.textContent = STATUS_LABELS[row.status] || row.status;

    li.append(left, pill);
    list.appendChild(li);
  });
}

init();
