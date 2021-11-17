import { getAnalytics } from "firebase/analytics";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAvZdFDTlq1RNTxRZEOGcyHJ9KlzGB3amo",
    authDomain: "pi-color-picker.firebaseapp.com",
    projectId: "pi-color-picker",
    storageBucket: "pi-color-picker.appspot.com",
    messagingSenderId: "167253563320",
    appId: "1:167253563320:web:e5047e4fe88be0f5e5214d",
    measurementId: "G-6MVKMEX3JV"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
