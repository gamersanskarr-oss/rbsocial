"use client";

// Firebase client SDK — only used for sign-in on the login form.
// Web app config for project "rbsocial-a77e8". These values are public by
// design (they ship in the client bundle); env vars can override them.
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDC5IadTQ37pzaEJX1f4OWWtCAmdsrRh8s",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "rbsocial-a77e8.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "rbsocial-a77e8",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:21483940401:web:2e00da40e25395972c0310",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);

export const clientAuth = getAuth(app);
