import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { transferFunds } from "./transaction-utils.js";
export { db, auth };

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

    const logoutBtn = document.getElementById("logoutBtn");
    const senderBalanceEl = document.getElementById("senderBalance");
    const accountInput = document.getElementById("receiverAccountNumber");
    const accountHint = document.getElementById("accountHint");
    const recipientNameEl = document.getElementById("recipientName");
    const amountInput = document.getElementById("transferAmount");
    const transferForm = document.getElementById("transferForm");
    const submitBtn = document.getElementById("transferSubmitBtn");

    let currentUser = null;
    let currentBalance = 0;
    let currentFullName = "";
    let resolvedReceiver = null; 
    let lookupTimer = null;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "signinpage.html";
            return;
        }

        currentUser = user;
        const userDocRef = doc(db, "users", user.uid);
        onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                currentBalance = data.balance || 0;
                currentFullName = data.fullName || data.username || user.email;
                senderBalanceEl.textContent = "₦" + currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 });
            }
        });
    });

    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        signOut(auth).then(() => window.location.href = "signinpage.html");
    });

    function setHint(message, type) {
        accountHint.textContent = message;
        accountHint.className = "field-hint" + (type ? " " + type : "");
    }

    function resetRecipient() {
        resolvedReceiver = null;
        recipientNameEl.style.display = "none";
        recipientNameEl.textContent = "";
        accountInput.classList.remove("invalid");
    }

    accountInput.addEventListener("input", () => {
        accountInput.value = accountInput.value.replace(/\D/g, "").slice(0, 10);
        resetRecipient();

        const value = accountInput.value;

        if (lookupTimer) clearTimeout(lookupTimer);

        if (value.length === 0) {
            setHint("", "");
            return;
        }

        if (value.length !== 10) {
            setHint(`Account number must be exactly 10 digits (currently ${value.length})`, "error");
            accountInput.classList.add("invalid");
            return;
        }

        setHint("Checking account...", "");

        lookupTimer = setTimeout(() => lookupAccount(value), 400);
    });

    async function lookupAccount(accountNumber) {
        if (!currentUser) return;

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("accountNumber", "==", accountNumber));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHint("No account found with this number", "error");
                accountInput.classList.add("invalid");
                return;
            }

            const matchDoc = snapshot.docs[0];
            const matchData = matchDoc.data();

            if (matchDoc.id === currentUser.uid) {
                setHint("You can't transfer money to your own account", "error");
                accountInput.classList.add("invalid");
                return;
            }

            resolvedReceiver = {
                uid: matchDoc.id,
                accountNumber: accountNumber,
                fullName: matchData.fullName || matchData.username || "Unnamed User"
            };

            setHint("Account verified", "success");
            accountInput.classList.remove("invalid");
            recipientNameEl.textContent = "Recipient: " + resolvedReceiver.fullName;
            recipientNameEl.style.display = "block";
        } catch (error) {
            console.error("Account lookup error:", error);
            setHint("Couldn't verify this account. Try again.", "error");
            accountInput.classList.add("invalid");
        }
    }

    transferForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            if (!currentUser) {
                alert("Please wait, checking your account...");
                return;
            }

            const accountNumber = accountInput.value;
            if (accountNumber.length !== 10) {
                alert("Account number must be exactly 10 digits");
                return;
            }

            if (!resolvedReceiver) {
                alert("Please enter a valid, verified account number before sending");
                return;
            }

            const amount = parseFloat(amountInput.value);
            if (!amount || amount <= 0) {
                alert("Enter a valid amount");
                return;
            }

            if (amount > currentBalance) {
                alert("Insufficient balance for this transfer");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";

            const success = await transferFunds(
                currentUser.uid,
                currentFullName,
                resolvedReceiver.uid,
                resolvedReceiver.accountNumber,
                resolvedReceiver.fullName,
                amount
            );

            if (success) {
                alert(`₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} sent to ${resolvedReceiver.fullName}`);
                transferForm.reset();
                resetRecipient();
                setHint("", "");
            }
        } catch (error) {
            console.error("Transfer error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Money";
        }
    });

});