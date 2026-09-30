import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCsZWUziFKC7809d_Ib49vEsT84yB3ASJg",
  authDomain: "unican-33d3b.firebaseapp.com",
  databaseURL: "https://unican-33d3b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "unican-33d3b",
  storageBucket: "unican-33d3b.firebasestorage.app",
  messagingSenderId: "21960939027",
  appId: "1:21960939027:web:0b431fb11637f25d69d1e6",
  measurementId: "G-0NXYZK6Q0W"
};

// Main App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const database = getDatabase(app);

// Secondary App instance so creating staff does not sign out the logged-in admin
const secondaryApp = getApps().find((a) => a.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);