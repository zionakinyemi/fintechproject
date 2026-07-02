
import { db } from "./landingpagefire.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById("year").textContent = new Date().getFullYear();

const ledgerList = document.getElementById("ledger-list");
const ledgerTotal = document.getElementById("ledger-total");

const sampleEntries = [
  { label: "Bill payment · DSTV", amt: 8400 },
  { label: "Transfer · GTBank", amt: 52000 },
  { label: "Savings deposit", amt: 15000 },
  { label: "Airtime top-up", amt: 1000 },
  { label: "Transfer · received", amt: 23500 },
  { label: "Bill payment · IKEDC", amt: 9800 },
  { label: "ZIONWALES Remit", amt: 134000 },
];

function formatNaira(n) {
  return "₦" + n.toLocaleString("en-NG");
}

const MAX_VISIBLE = 4;
let runningTotal = 0;
let i = 0;

function pushEntry() {
  const entry = sampleEntries[i % sampleEntries.length];
  i++;

  const li = document.createElement("li");
  li.className = "ledger-entry";
  li.innerHTML = `
    <span class="ledger-entry-label">${entry.label}</span>
    <span class="ledger-entry-amt mono">${formatNaira(entry.amt)}</span>
  `;
  ledgerList.prepend(li);

  while (ledgerList.children.length > MAX_VISIBLE) {
    ledgerList.removeChild(ledgerList.lastChild);
  }

  runningTotal += entry.amt;
  ledgerTotal.textContent = formatNaira(runningTotal);
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (ledgerList) {
  pushEntry();
  if (!reduceMotion) {
    pushEntry();
    pushEntry();
    setInterval(pushEntry, 2600);
  }
}

const form = document.getElementById("waitlist-form");
const status = document.getElementById("wl-status");
const submitBtn = document.getElementById("wl-submit");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("wl-name").value.trim();
  const email = document.getElementById("wl-email").value.trim();

  if (!email || !email.includes("@")) {
    setStatus("Enter a valid email address.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Joining…";

  try {
    await addDoc(collection(db, "waitlist"), {
      name: name || null,
      email,
      createdAt: serverTimestamp(),
      source: "landing-page"
    });
    form.reset();
    setStatus("You're on the list — we'll be in touch.", "success");
  } catch (err) {
    console.error("Waitlist submission failed:", err);
    setStatus("Something went wrong. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Join the waitlist";
  }
});

function setStatus(message, kind) {
  status.textContent = message;
  status.className = "form-status" + (kind ? ` is-${kind}` : "");
}
