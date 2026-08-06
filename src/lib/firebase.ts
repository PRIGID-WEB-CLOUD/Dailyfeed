
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error(`
    -------------------------------------------------------------------------------
    Firebase API Key is not set.
    Please create a .env file in the root of your project and add the following:

    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

    Replace "YOUR_API_KEY", "YOUR_AUTH_DOMAIN", etc. with your actual Firebase
    project credentials. You can find these in your Firebase project settings.
    -------------------------------------------------------------------------------
    `);
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize primary Firebase app
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize a secondary Firebase app for admin authentication
// This prevents session conflicts between public users and admin users.
const adminAppName = 'adminApp';
const adminApp: FirebaseApp = getApps().find(app => app.name === adminAppName) || initializeApp(firebaseConfig, adminAppName);
const adminAuth: Auth = getAuth(adminApp);


export { app, auth, db, adminAuth, storage };
