// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth"); // Note: Firebase Auth for Node.js typically uses Admin SDK
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage'); // Note: Firebase Storage for Node.js typically uses Admin SDK

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAH3vseit9HZWMR95VJizCVDBpBIiU56nU",
  authDomain: "internstud0411.firebaseapp.com",
  projectId: "internstud0411",
  storageBucket: "internstud0411.firebasestorage.app",
  messagingSenderId: "21270154998",
  appId: "1:21270154998:web:af3c8c631689d07427a6d7",
  measurementId: "G-FZFQQT4J88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { auth, db, storage }; 