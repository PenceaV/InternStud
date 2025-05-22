// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };
