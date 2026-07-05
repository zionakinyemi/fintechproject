import { doc, collection, runTransaction } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "./transferfire.js";

export async function deductBalance(uid, amount, description) {
    const userDocRef = doc(db, "users", uid);
    const txRef = doc(collection(db, "transactions"));
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw "User record not found";

            const currentBalance = userDoc.data().balance || 0;
            if (currentBalance < amount) throw "Insufficient balance";

            transaction.update(userDocRef, { balance: currentBalance - amount });
            transaction.set(txRef, {
                uid,
                type: "debit",
                description,
                amount,
                date: new Date()
            });
        });

        return true;
    } catch (error) {
        alert(error);
        return false;
    }
}
export async function topUpBalance(uid, amount) {
    const userDocRef = doc(db, "users", uid);
    const txRef = doc(collection(db, "transactions"));

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw "User record not found";

            const currentBalance = userDoc.data().balance || 0;
            transaction.update(userDocRef, { balance: currentBalance + amount });
            transaction.set(txRef, {
                uid,
                type: "credit",
                description: "Wallet Top Up",
                amount,
                date: new Date()
            });
        });
        return true;
    } catch (error) {
        alert(error);
        return false;
    }
}

export async function transferFunds(senderUid, senderName, receiverUid, receiverAccountNumber, receiverName, amount) {
    const senderDocRef = doc(db, "users", senderUid);
    const receiverDocRef = doc(db, "users", receiverUid);
    const senderTxRef = doc(collection(db, "transactions"));
    const receiverTxRef = doc(collection(db, "transactions"));

    try {
        await runTransaction(db, async (transaction) => {
            const senderDoc = await transaction.get(senderDocRef);
            const receiverDoc = await transaction.get(receiverDocRef);

            if (!senderDoc.exists()) throw "Sender record not found";
            if (!receiverDoc.exists()) throw "Recipient record not found";

            const senderBalance = senderDoc.data().balance || 0;
            const receiverBalance = receiverDoc.data().balance || 0;

            if (senderBalance < amount) throw "Insufficient balance";

            transaction.update(senderDocRef, { balance: senderBalance - amount });
            transaction.update(receiverDocRef, { balance: receiverBalance + amount });

            transaction.set(senderTxRef, {
                uid: senderUid,
                type: "debit",
                description: `Transfer to ${receiverName} (${receiverAccountNumber})`,
                amount,
                date: new Date()
            });

            transaction.set(receiverTxRef, {
                uid: receiverUid,
                type: "credit",
                description: `Transfer from ${senderName}`,
                amount,
                date: new Date()
            });
        });

        return true;
    } catch (error) {
        alert(error);
        return false;
    }
}
