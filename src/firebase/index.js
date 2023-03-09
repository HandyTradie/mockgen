// Import the functions you need from the SDKs you need
import { getApp, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

import { connectStorageEmulator, getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAquA-UeW-6YfkZycTGLQluCf9rYryLOr8",
  authDomain: "quizmine-a809e.firebaseapp.com",
  projectId: "quizmine-a809e",
  storageBucket: "quizmine-a809e.appspot.com",
  messagingSenderId: "1009077697724",
  appId: "1:1009077697724:web:837674cbbb1eab0832e4b9",
  measurementId: "G-HXVZLJ7RES"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(getApp());
const auth = getAuth();

if (process.env.NODE_ENV === "development") {
  // connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001);
  // connectFirestoreEmulator(firestore, "localhost", 8082);
  // connectStorageEmulator(storage, "localhost", 9199);
}

export { app, analytics, firestore, storage, auth, functions };
