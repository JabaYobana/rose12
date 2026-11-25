// Add your Supabase Project URL and publishable key below.
// Never put a secret/service_role key in this file.
const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";
const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";
const ADMIN_EMAIL = "zabenok4@gmail.com";

const { createClient } = window.supabase || {};
const db = createClient &&
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const pageIds = ["welcome", "signup", "complete", "adminLogin", "controlRoom"];
function showPage(id) {
  pageIds.forEach(page => document.getElementById(page).hidden = page !== id);
}
function status(id, message) {
  document.getElementById(id).textContent = message || "";
}

document.getElementById("proceed").addEventListener("click", () => showPage("signup"));
document.getElementById("homeFromSignup").addEventListener("click", () => showPage("welcome"));
document.getElementById("returnHome").addEventListener("click", () => showPage("welcome"));
document.getElementById("adminLink").addEventListener("click", () => showPage("adminLogin"));
document.getElementById("backToHome").addEventListener("click", () => showPage("welcome"));

document.getElementById("registrationForm").addEventListener("submit", async event => {
  event.preventDefault();
  status("signupStatus", "");

  if (!db) {
    status("signupStatus", "The database is not configured yet.");
    return;
  }

  const entry = {
    name: document.getElementById("name").value.trim(),
    nationality: document.getElementById("nationality").value.trim(),
    age: Number(document.getElementById("age").value),
    email: document.getElementById("email").value.trim()
  };

  if (!Number.isInteger(entry.age) || entry.age < 1 || entry.age > 120) {
    status("signupStatus", "Please enter a valid age.");
    return;
  }

  const button = event.submitter;
  if (button) button.disabled = true;
  status("signupStatus", "Submitting...");

  const { error } = await db.from("rose12_registrations").insert([entry]);
  if (button) button.disabled = false;

  if (error) {
    status("signupStatus", "Could not submit. Please try again.");
    return;
  }

  document.getElementById("registrationForm").reset();
  showPage("complete");
});

document.getElementById("adminForm").addEventListener("submit", async event => {
  event.preventDefault();
  status("adminStatus", "");
  if (!db) {
    status("adminStatus", "The database is not configured yet.");
    return;
  }

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    status("adminStatus", "Sign-in failed.");
    return;
  }

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    status("adminStatus", "Sign-in failed. Check your login details.");
    return;
  }
  await loadRecords();
});

async function loadRecords() {
  status("recordStatus", "Loading...");
  const box = document.getElementById("records");
  box.replaceChildren();

  const { data, error } = await db
    .from("rose12_registrations")
    .select("id, name, nationality, age, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    status("recordStatus", "Could not load registrations. Check administrator access.");
    return;
  }

  status("recordStatus", `${data.length} registration(s)`);
  if (!data.length) {
    box.textContent = "No registrations yet.";
  }

  data.forEach((person, index) => {
    const item = document.createElement("article");
    item.className = "record";
    const heading = document.createElement("strong");
    heading.textContent = `#${index + 1}`;
    item.appendChild(heading);

    [
      ["Name", person.name],
      ["Nationality", person.nationality],
      ["Age", person.age],
      ["Email", person.email],
      ["Date", new Date(person.created_at).toLocaleString()]
    ].forEach(([label, value]) => {
      const line = document.createElement("div");
      line.textContent = `${label}: ${value}`;
      item.appendChild(line);
    });
    box.appendChild(item);
  });
  showPage("controlRoom");
}

document.getElementById("refreshRecords").addEventListener("click", loadRecords);
document.getElementById("signOut").addEventListener("click", async () => {
  if (db) await db.auth.signOut();
  document.getElementById("adminForm").reset();
  showPage("welcome");
});
