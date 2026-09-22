import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApQV0kYECIKMW95yAmwBANNfq9N6LV4c",
  authDomain: "phrasal-faculty-476911-h7.firebaseapp.com",
  projectId: "phrasal-faculty-476911-h7",
  storageBucket: "phrasal-faculty-476911-h7.firebasestorage.app",
  messagingSenderId: "352640663359",
  appId: "1:352640663359:web:65043d80f86a6e48dddd8a",
  measurementId: "G-N2MYPRYYG1"
};

let app;
let db;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization warning (replace placeholder config in src/firebase.js):", error);
}

export { db };

// টেলিগ্রাম ইউজার ডাটাবেসে সিঙ্ক করার ফাংশন
export const syncUserWithFirebase = async (tgUser) => {
  if (!tgUser) return null;
  if (!db || firebaseConfig.apiKey === "YOUR_API_KEY") {
    return {
      id: tgUser.id || 40281,
      name: tgUser.first_name || "Rocky",
      username: tgUser.username || "",
      apples: 1250,
      diamonds: 549.0,
      level: 3,
      energy: 100,
      createdAt: new Date().toISOString()
    };
  }

  try {
    const userRef = doc(db, "users", tgUser.id.toString());
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUser = {
        id: tgUser.id,
        name: tgUser.first_name || "Rocky",
        username: tgUser.username || "",
        apples: 1250,
        diamonds: 549.0,
        level: 3,
        energy: 100,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
    return userSnap.data();
  } catch (err) {
    console.warn("Firestore sync warning (check Firestore Rules/Database status):", err);
    return {
      id: tgUser.id || 40281,
      name: tgUser.first_name || "Rocky",
      username: tgUser.username || "",
      apples: 1250,
      diamonds: 549.0,
      level: 3,
      energy: 100,
      createdAt: new Date().toISOString()
    };
  }
};

export const harvestAppleInDB = async (userId) => {
  if (!db || firebaseConfig.apiKey === "YOUR_API_KEY") return;
  try {
    const userRef = doc(db, "users", userId.toString());
    await updateDoc(userRef, {
      apples: increment(1)
    });
  } catch (err) {
    console.error("Firebase harvest update error:", err);
  }
};
