import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { topUpBalance, deductBalance } from "./transaction-utils.js";

const firebaseConfig = {
    apiKey: "AIzaSyBE-zuGT3DP2xLIv3JriTN_Dm7eBGTLYwQ",
    authDomain: "zionwales.firebaseapp.com",
    projectId: "zionwales",
    storageBucket: "zionwales.firebasestorage.app",
    messagingSenderId: "624346566090",
    appId: "1:624346566090:web:d333646861577e32051333",
    measurementId: "G-905PJ79WQ6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {

const userEmailEl = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const balanceEl = document.getElementById("userBalance");
const accountNumberEl = document.getElementById("userAccountNumber");
const balanceToggle = document.getElementById("balanceToggle");
const recentTransfer = document.getElementById("recentTransfer");
const recentTxList = document.getElementById("recentTxList");
let currentUser = null;
let isBalanceVisible = false;
let currentBalanceText = "₦0.00";
let recentTransactions = [];

if (!recentTxList) {
    console.error("recentTxList element not found in the DOM — check your HTML id matches exactly.");
}

balanceEl.textContent = "₦••••••";

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        const userDocRef = doc(db, "users", user.uid);
        onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                userEmailEl.textContent = data.username || user.email;
                accountNumberEl.textContent = data.accountNumber || "";
                currentBalanceText = "₦" + (data.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
                renderBalance();
            }
        });

        const txQuery = query(
            collection(db, "transactions"),
            where("uid", "==", user.uid),
            orderBy("date", "desc"),
            limit(2)
        );
        onSnapshot(txQuery, (snapshot) => {
            recentTransactions = snapshot.docs.map((d) => d.data());
            renderRecentTransactions();
        });
    } else {
        window.location.href = "signinpage.html";
    }
});

function renderBalance() {
    balanceEl.textContent = isBalanceVisible ? currentBalanceText : "₦••••••";
}

function renderRecentTransactions() {
    if (!isBalanceVisible) {
        recentTxList.innerHTML = "";
        return;
    }

    if (recentTransactions.length === 0) {
        recentTxList.innerHTML = '<p class="tx-empty">No transactions yet</p>';
        return;
    }

    recentTxList.innerHTML = recentTransactions.map((tx) => {
        const isCredit = tx.type === "credit";
        const sign = isCredit ? "+" : "-";
        const dateObj = tx.date && tx.date.toDate ? tx.date.toDate() : new Date(tx.date);
        const dateText = dateObj.toLocaleDateString(undefined, { day: "numeric", month: "short" });

        return `
            <div class="tx-row">
                <div>
                    <div class="tx-desc">${tx.description || (isCredit ? "Credit" : "Debit")}</div>
                    <div class="tx-date">${dateText}</div>
                </div>
                <div class="tx-amount ${isCredit ? "credit" : "debit"}">${sign}₦${(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
        `;
    }).join("");
}

balanceToggle.addEventListener("click", () => {
    isBalanceVisible = !isBalanceVisible;
    balanceToggle.textContent = isBalanceVisible ? "visibility_off" : "visibility";
    recentTransfer.classList.toggle("show", isBalanceVisible);
    renderBalance();
    renderRecentTransactions();
});

logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    signOut(auth).then(() => window.location.href = "signinpage.html");
});

document.getElementById("topupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const amount = parseFloat(document.getElementById("topupAmount").value);

        if (!amount || amount <= 0) {
            alert("Enter a valid amount");
            return;
        }

        if (!currentUser) {
            alert("Please wait, checking your account...");
            return;
        }

        const success = await topUpBalance(currentUser.uid, amount);

        if (success) {
            alert("Top up successful");
            document.getElementById("topupModal").style.display = "none";
            e.target.reset();
        }
    } catch (error) {
        console.error("Top up error:", error);
        alert("Something went wrong. Please try again.");
    }
});

document.getElementById("tvForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const amount = parseFloat(document.getElementById("amount").value);

        if (!amount || amount <= 0) {
            alert("Select a plan first");
            return;
        }

        if (!currentUser) {
            alert("Please wait, checking your account...");
            return;
        }

        const service = document.getElementById("modalTitle").innerText;
        const success = await deductBalance(currentUser.uid, amount, `TV Subscription - ${service}`);

        if (success) {
            alert("Payment Successful!");
            document.getElementById("tvModal").style.display = "none";
        }
    } catch (error) {
        console.error("TV subscription error:", error);
        alert("Something went wrong. Please try again.");
    }
});

}); 