import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

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

    const profileInitial = document.getElementById("profileInitial");
    const profileFullName = document.getElementById("profileFullName");
    const profileEmail = document.getElementById("profileEmail");
    const cardFullName = document.getElementById("cardFullName");
    const cardEmail = document.getElementById("cardEmail");
    const cardAccountNumber = document.getElementById("cardAccountNumber");
    const cardLocation = document.getElementById("cardLocation");
    const cardBalance = document.getElementById("cardBalance");
    const cardJoined = document.getElementById("cardJoined");
    const logoutBtn = document.getElementById("logoutBtn");

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "signinpage.html";
            return;
        }

        // Joined date comes from Firebase Auth's own account creation record,
        // so this works even for users created before this page existed.
        const joinedDate = user.metadata && user.metadata.creationTime
            ? new Date(user.metadata.creationTime)
            : null;
        cardJoined.textContent = joinedDate
            ? joinedDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
            : "—";

        const userDocRef = doc(db, "users", user.uid);
        onSnapshot(userDocRef, (docSnap) => {
            if (!docSnap.exists()) {
                console.error("No user profile document found for this account.");
                return;
            }

            const data = docSnap.data();
            const fullName = data.fullName || data.username || "Unnamed User";
            const email = data.email || user.email || "—";
            const accountNumber = data.accountNumber || "—";
            const location = data.location || "Not provided";
            const balance = "₦" + (data.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

            profileFullName.textContent = fullName;
            profileEmail.textContent = email;
            profileInitial.textContent = fullName.charAt(0).toUpperCase();

            cardFullName.textContent = fullName;
            cardEmail.textContent = email;
            cardAccountNumber.textContent = accountNumber;
            cardLocation.textContent = location;
            cardBalance.textContent = balance;
        });
    });

    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        signOut(auth).then(() => window.location.href = "signinpage.html");
    });

});