import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB5Ej4_88-5GLWERQcElSMc8XXfUioLkfs",
    authDomain: "nextools-f93cf.firebaseapp.com",
    projectId: "nextools-f93cf",
    storageBucket: "nextools-f93cf.firebasestorage.app",
    messagingSenderId: "704445346870",
    appId: "1:704445346870:web:d773674ead184dc3265497",
    measurementId: "G-8LS1R5GJGG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
