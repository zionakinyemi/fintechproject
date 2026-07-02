import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let currentUser = null;
const tableBody = document.getElementById("tableBody");

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        listenForTransactions(user.uid);
    } else {
        window.location.href = "signinpage.html";
    }
});

function listenForTransactions(uid) {
    const q = query(collection(db, "transactions"), where("uid", "==", uid));

    onSnapshot(q, (snapshot) => {
        const transactions = [];
        snapshot.forEach((docSnap) => {
            transactions.push({ id: docSnap.id, ...docSnap.data() });
        });

        // sort newest first in JS, avoids needing a Firestore composite index
        transactions.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB - dateA;
        });

        renderTransactions(transactions);
    });
}

function renderTransactions(transactions) {
    tableBody.innerHTML = "";

    if (transactions.length === 0) {
        tableBody.innerHTML = `<div style="text-align:center; padding:30px; color:gray; background:white; border-radius:10px;">No transactions yet</div>`;
        return;
    }

    transactions.forEach((tx) => {
        const dateObj = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
        const formattedDate = dateObj.toLocaleString();
        const isCredit = tx.type === "credit";

        tableBody.innerHTML += `
            <div class="transaction-card">
                <div class="transaction-top">
                    <div>
                        <div class="tx-description">${tx.description}</div>
                        <div class="date-text">${formattedDate}</div>
                    </div>
                    <div class="amount" style="color:${isCredit ? '#3bae4a' : '#ee202b'};">
                        ${isCredit ? '+' : '-'}₦${Number(tx.amount).toLocaleString()}
                    </div>
                </div>
                <div class="transaction-footer">
                    <span class="status ${tx.type}">${tx.type.toUpperCase()}</span>
                    <button class="delete-btn" data-id="${tx.id}">Delete</button>
                </div>
            </div>
        `;
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            await deleteDoc(doc(db, "transactions", id));
        });
    });
}

document.getElementById("deleteAllBtn").addEventListener("click", async () => {
    if (!currentUser) return;

    const confirmDelete = confirm("Delete all transaction history? This cannot be undone.");
    if (!confirmDelete) return;

    const q = query(collection(db, "transactions"), where("uid", "==", currentUser.uid));

    onSnapshot(q, async (snapshot) => {
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
            batch.delete(doc(db, "transactions", docSnap.id));
        });
        await batch.commit();
    }, { onlyOnce: true });
});