import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { deductBalance } from "./transaction-utils.js";

let currentUser = null;
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        window.location.href = "signinpage.html";
    }
});


document.getElementById("savePin").addEventListener("click", async () => {
    const amount = parseFloat(document.getElementById("amount").value);
    const network = document.getElementById("network").value.toUpperCase();
    if (!amount || amount <= 0) {
        alert("Select an amount first");
        return;
    }

    if (!currentUser) {
        alert("Please wait, checking your account...");
        return;
    }

    const success = await deductBalance(currentUser.uid, amount, `Airtime - ${network}`);

    if (success) {
        console.log("₦" + amount + " deducted for airtime purchase");
    }
});