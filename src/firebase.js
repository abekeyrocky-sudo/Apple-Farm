import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  arrayUnion,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";

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
  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || "Farmer";
  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param || null;

  if (!db || firebaseConfig.apiKey === "YOUR_API_KEY") {
    return {
      id: tgUser.id || 40281,
      name: fullName,
      username: tgUser.username || "",
      avatar: 'avatar-1',
      apples: 0,
      diamonds: 0.0,
      level: 1,
      energy: 100,
      invitedFriends: [],
      claimedReferMissions: {},
      createdAt: new Date().toISOString()
    };
  }

  try {
    const userRef = doc(db, "users", tgUser.id.toString());
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUser = {
        id: tgUser.id,
        name: fullName,
        username: tgUser.username || "",
        avatar: 'avatar-1',
        apples: 0,
        diamonds: 0.0,
        level: 1,
        energy: 100,
        referredBy: startParam || null,
        invitedFriends: [],
        claimedReferMissions: {},
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);

      // যদি কোনো রেফারেল প্যারামিটার থাকে, রেফারকারী ইউজারের ডাটাবেস আপডেট
      if (startParam && startParam !== tgUser.id.toString()) {
        try {
          const referrerRef = doc(db, "users", startParam.toString());
          const refSnap = await getDoc(referrerRef);
          if (refSnap.exists()) {
            await updateDoc(referrerRef, {
              invitedFriends: arrayUnion({
                id: tgUser.id,
                name: fullName,
                avatar: 'avatar-1',
                date: new Date().toLocaleDateString()
              }),
              apples: increment(100) // Instant 100 Apples Referral Reward
            });
          }
        } catch (rErr) {
          console.warn("Referral tracking error:", rErr);
        }
      }

      return newUser;
    } else {
      const existing = userSnap.data();
      return { 
        ...existing, 
        avatar: existing.avatar || 'avatar-1',
        name: fullName || existing.name,
        invitedFriends: existing.invitedFriends || [],
        claimedReferMissions: existing.claimedReferMissions || {}
      };
    }
  } catch (err) {
    console.warn("Firestore sync warning (check Firestore Rules/Database status):", err);
    return {
      id: tgUser.id || 40281,
      name: fullName,
      username: tgUser.username || "",
      avatar: 'avatar-1',
      apples: 0,
      diamonds: 0.0,
      level: 1,
      energy: 100,
      invitedFriends: [],
      claimedReferMissions: {},
      createdAt: new Date().toISOString()
    };
  }
};

// অ্যাপেল হার্ভেস্ট ডাটাবেসে আপডেট
export const harvestAppleInDB = async (userId) => {
  if (!db || !userId) return;
  try {
    const userRef = doc(db, "users", userId.toString());
    await updateDoc(userRef, {
      apples: increment(1)
    });
  } catch (err) {
    console.error("Firebase harvest update error:", err);
  }
};

// যে কোনো ইউজার ডাটা ফায়ারস্টোরে আপডেট
export const updateUserInDB = async (userId, dataToUpdate) => {
  if (!db || !userId) return;
  try {
    const userRef = doc(db, "users", userId.toString());
    await updateDoc(userRef, dataToUpdate);
  } catch (err) {
    console.error("Firebase updateUser error:", err);
  }
};

// ট্রানজ্যাকশন ফায়ারস্টোর ডাটাবেসে সেভ করা
export const addTransactionToDB = async (userId, txData) => {
  if (!db || !userId) return null;
  try {
    const txColRef = collection(db, "users", userId.toString(), "transactions");
    const docRef = await addDoc(txColRef, {
      ...txData,
      createdAt: serverTimestamp(),
      createdTime: Date.now()
    });
    return docRef.id;
  } catch (err) {
    console.error("Firebase addTransaction error:", err);
    return null;
  }
};

// ডাটাবেস থেকে ইউজারের রিয়েল ট্রানজ্যাকশন হিস্ট্রি ফেচ করা
export const getUserTransactionsFromDB = async (userId) => {
  if (!db || !userId) return [];
  try {
    const txColRef = collection(db, "users", userId.toString(), "transactions");
    const q = query(txColRef, orderBy("createdTime", "desc"), limit(50));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return list;
  } catch (err) {
    console.error("Firebase getUserTransactions error:", err);
    return [];
  }
};

// ডাটাবেস থেকে রিয়েল গ্লোবাল লিডারবোর্ড ফেচ করা
export const getLeaderboardFromDB = async () => {
  if (!db) return [];
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("apples", "desc"), limit(50));
    const snap = await getDocs(q);
    const list = [];
    let rank = 1;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        rank: rank++,
        name: data.name || 'Farmer',
        username: data.username || '',
        avatar: data.avatar || 'avatar-1',
        apples: data.apples || 0,
        level: data.level || 1,
      });
    });
    return list;
  } catch (err) {
    console.error("Firebase getLeaderboard error:", err);
    return [];
  }
};

// 💎 ফায়ারস্টোর থেকে রিয়েল পার্টনার / স্পন্সর টাস্ক ফেচ করা
export const getPartnerTasksFromDB = async () => {
  if (!db) return [];
  try {
    const tasksRef = collection(db, "partner_tasks");
    const q = query(tasksRef, orderBy("createdTime", "desc"), limit(50));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return list;
  } catch (err) {
    console.error("Firebase getPartnerTasks error:", err);
    return [];
  }
};

// 💎 নতুন পার্টনার টাস্ক ফায়ারস্টোর ডাটাবেসে সেভ করা
export const savePartnerTaskToDB = async (taskData) => {
  if (!db) return null;
  try {
    const tasksRef = collection(db, "partner_tasks");
    const docRef = await addDoc(tasksRef, {
      ...taskData,
      createdTime: Date.now(),
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.error("Firebase savePartnerTask error:", err);
    return null;
  }
};

// 💎 পার্টনার টাস্কে মেম্বার জয়েন কাউন্ট বাড়ানো
export const incrementPartnerTaskJoinedInDB = async (taskId) => {
  if (!db || !taskId) return;
  try {
    const taskRef = doc(db, "partner_tasks", taskId.toString());
    await updateDoc(taskRef, {
      joinedCount: increment(1)
    });
  } catch (err) {
    console.error("Firebase incrementPartnerTask error:", err);
  }
};
