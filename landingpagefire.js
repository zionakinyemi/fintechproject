import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
export const db = getFirestore(app);
