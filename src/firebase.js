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
  serverTimestamp,
  onSnapshot
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

const FUNCTIONS_URL = (import.meta.env.VITE_FUNCTIONS_URL || 'https://api-duztzw2gwa-uc.a.run.app/api').replace(/\/api$/, '');

// 📢 রেফারকারীকে টেলিগ্রামে নোটিফিকেশন পাঠানোর হেল্পার ফাংশন (Secure Server-Side API)
const sendReferralNotificationToTelegram = async (referrerChatId, friendName) => {
  if (!referrerChatId) return;
  try {
    await fetch(`${FUNCTIONS_URL}/api/telegram/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'referral',
        chatId: referrerChatId,
        payload: { friendName }
      })
    });
  } catch (err) {
    console.warn('Referral Telegram notification error:', err);
  }
};

// ⚡ ব্যবহারকারী উইথড্র দিলে টেলিগ্রামে নোটিফিকেশন পাঠানোর হেল্পার ফাংশন (Secure Server-Side API)
export const sendWithdrawNotificationToTelegram = async (userId, withdrawData) => {
  if (!userId) return;
  try {
    await fetch(`${FUNCTIONS_URL}/api/telegram/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'withdraw',
        chatId: userId,
        payload: withdrawData
      })
    });
  } catch (err) {
    console.warn('Withdraw Telegram notification error:', err);
  }
};

// রেফারেল রিওয়ার্ড প্রসেসিং হেল্পার ফাংশন
const processReferralReward = async (referrerId, newTgUser, fullName) => {
  if (!referrerId || !newTgUser?.id || !db) return;
  const refIdStr = referrerId.toString().trim();
  const myIdStr = newTgUser.id.toString().trim();
  
  if (refIdStr === myIdStr) return; // নিজের রেফারে নিজে জয়েন করলে ইগনোর

  try {
    const referrerRef = doc(db, "users", refIdStr);
    const refSnap = await getDoc(referrerRef);
    
    if (refSnap.exists()) {
      const refData = refSnap.data() || {};
      const existingFriends = Array.isArray(refData.invitedFriends) ? refData.invitedFriends : [];
      
      // ডুপ্লিকেট চেকিং
      const alreadyInvited = existingFriends.some(f => f.id?.toString() === myIdStr);
      if (!alreadyInvited) {
        const newFriendItem = {
          id: newTgUser.id,
          name: fullName || 'Farmer',
          username: newTgUser.username || '',
          avatar: 'avatar-1',
          date: new Date().toLocaleDateString()
        };

        await updateDoc(referrerRef, {
          invitedFriends: arrayUnion(newFriendItem),
          referralsCount: increment(1),
          apples: increment(500) // Instant 500 Apples Referral Reward
        });

        console.log(`[Referral Success] ${fullName} (${myIdStr}) referred by ${refIdStr}`);

        // 📢 রেফারকারীকে টেলিগ্রামে ইনস্ট্যান্ট নোটিফিকেশন পাঠানো
        sendReferralNotificationToTelegram(refIdStr, fullName);
      }
    } else {
      console.warn("Referrer ID not found in Firestore:", refIdStr);
    }
  } catch (err) {
    console.warn("processReferralReward error:", err);
  }
};

// টেলিগ্রাম ইউজার ডাটাবেসে সিঙ্ক করার ফাংশন
export const syncUserWithFirebase = async (tgUser) => {
  if (!tgUser) return null;
  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || "Farmer";
  
  // 🔍 সমস্ত সম্ভাব্য সোর্স থেকে start_param এক্সট্রাক্ট করা (initData, URL search, URL hash)
  let rawStartParam = null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);

    rawStartParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param
      || urlParams.get('tgWebAppStartParam')
      || urlParams.get('startapp')
      || urlParams.get('start_param')
      || urlParams.get('start')
      || urlParams.get('ref')
      || hashParams.get('tgWebAppStartParam')
      || hashParams.get('startapp')
      || hashParams.get('start')
      || null;
  } catch (e) {
    console.warn("Param extraction error:", e);
  }

  const startParam = rawStartParam ? rawStartParam.toString().trim() : null;
  const myIdStr = (tgUser.id || 40281).toString();

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
    const userRef = doc(db, "users", myIdStr);
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
        referredBy: (startParam && startParam !== myIdStr) ? startParam : null,
        invitedFriends: [],
        claimedReferMissions: {},
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);

      // যদি কোনো রেফারেল প্যারামিটার থাকে, রেফারকারী ইউজারের ডাটাবেস আপডেট
      if (startParam && startParam !== myIdStr) {
        await processReferralReward(startParam, tgUser, fullName);
      }

      return newUser;
    } else {
      const existing = userSnap.data();
      
      // যদি ইউজার আগে ঢুকে থাকে কিন্তু কোনো রেফারার লিংক না থাকে, এবং এবার রেফারেল লিংকে ঢুকেছে
      if (!existing.referredBy && startParam && startParam !== myIdStr) {
        try {
          await updateDoc(userRef, {
            referredBy: startParam
          });
          existing.referredBy = startParam;
          await processReferralReward(startParam, tgUser, fullName);
        } catch (rErr) {
          console.warn("Existing user referral link error:", rErr);
        }
      }

      return { 
        ...existing, 
        avatar: existing.avatar || 'avatar-1',
        name: fullName || existing.name,
        referralApplesCommission: Number(existing.referralApplesCommission || 0),
        referralDiamondsCommission: Number(existing.referralDiamondsCommission || 0),
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
      referralApplesCommission: 0,
      referralDiamondsCommission: 0.0,
      invitedFriends: [],
      claimedReferMissions: {},
      createdAt: new Date().toISOString()
    };
  }
};

// ⚡ ইঞ্জিন ১ & ২: ১০% লাইফটাইম রেফারেল কমিশন ডিস্ট্রিবিউশন ইঞ্জিন (Apples & Diamonds)
export const distributeReferralCommission = async (referrerId, earnerUserId, rewardType, amount, sourceName = 'Farm Activity') => {
  if (!referrerId || !earnerUserId || !amount || amount <= 0 || !db) return;
  const refIdStr = referrerId.toString().trim();
  const earnerIdStr = earnerUserId.toString().trim();

  // নিজের রেফারে নিজে কমিশন ক্রেডিট হবে না
  if (refIdStr === earnerIdStr) return;

  try {
    const referrerRef = doc(db, "users", refIdStr);
    
    if (rewardType === 'apple') {
      // ১০% অ্যাপেলস কমিশন
      const commApples = Math.max(1, Math.floor(amount * 0.10));
      if (commApples <= 0) return;

      await updateDoc(referrerRef, {
        referralApplesCommission: increment(commApples),
        totalReferralApplesEarned: increment(commApples)
      });
      console.log(`[Referral Engine 1] +${commApples} 🍎 sent to Referrer ${refIdStr} from ${earnerIdStr} (${sourceName})`);
    } else if (rewardType === 'diamond') {
      // ১০% ডায়মন্ডস কমিশন
      const commDiamonds = Number((amount * 0.10).toFixed(2));
      if (commDiamonds <= 0) return;

      await updateDoc(referrerRef, {
        referralDiamondsCommission: increment(commDiamonds),
        totalReferralDiamondsEarned: increment(commDiamonds)
      });
      console.log(`[Referral Engine 2] +${commDiamonds} 💎 sent to Referrer ${refIdStr} from ${earnerIdStr} (${sourceName})`);
    }
  } catch (err) {
    console.warn("distributeReferralCommission error:", err);
  }
};

// ⚡ রিয়েলটাইম কমিশন সিঙ্ক লিসেনার (লাইভ আপডেট ইঞ্জিন)
export const listenToUserCommissions = (userId, onCommissionUpdate) => {
  if (!userId || !db) return () => {};
  try {
    const userRef = doc(db, "users", userId.toString());
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onCommissionUpdate({
          referralApplesCommission: Number(data.referralApplesCommission || 0),
          referralDiamondsCommission: Number(data.referralDiamondsCommission || 0),
          invitedFriends: Array.isArray(data.invitedFriends) ? data.invitedFriends : [],
          referralsCount: Number(data.referralsCount || (Array.isArray(data.invitedFriends) ? data.invitedFriends.length : 0))
        });
      }
    }, (err) => {
      console.warn("listenToUserCommissions snapshot error:", err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn("listenToUserCommissions init error:", e);
    return () => {};
  }
};

// অ্যাপেল হার্ভেস্ট ডাটাবেসে আপডেট
export const harvestAppleInDB = async (userId, count = 1) => {
  if (!db || !userId) return;
  try {
    const userRef = doc(db, "users", userId.toString());
    await updateDoc(userRef, {
      apples: increment(count)
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
        level: data.apples >= 100 
          ? Math.min(20, Math.max(1, Math.floor(Math.log2(data.apples / 100)) + 2)) 
          : (data.level || 1),
        isVerified: !!(data.isVerified || data.verifiedBadge),
        verifiedBadge: !!(data.verifiedBadge || data.isVerified)
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
      const data = docSnap.data();
      list.push({ 
        ...data, 
        id: docSnap.id,
        joinedCount: Number(data.joinedCount) || 0,
        targetMembers: Number(data.targetMembers) || 50
      });
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
    const { id, ...dataToSave } = taskData;
    const tasksRef = collection(db, "partner_tasks");
    const docRef = await addDoc(tasksRef, {
      ...dataToSave,
      joinedCount: 0,
      targetMembers: Number(dataToSave.targetMembers) || 50,
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
