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
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  runTransaction
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

export { db, increment };

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
          claimablePartnerGram: Number(data.claimablePartnerGram || 0),
          totalPartnerGramEarned: Number(data.totalPartnerGramEarned || 0),
          claimedPartnerGram: Number(data.claimedPartnerGram || 0),
          partnerReferralTaskCount: Number(data.partnerReferralTaskCount || 0),
          gramBalance: Number(data.gramBalance || 0),
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

// ডায়মন্ড ডাটাবেসে নিরাপদে বাড়ানো (Atomic Increment)
export const addDiamondsInDB = async (userId, count = 1) => {
  if (!db || !userId) return;
  try {
    const userRef = doc(db, "users", userId.toString());
    await updateDoc(userRef, {
      diamonds: increment(Number(count))
    });
  } catch (err) {
    console.error("Firebase addDiamondsInDB error:", err);
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

// 💎 নতুন পার্টনার টাস্ক ফায়ারস্টোর ডাটাবেসে সেভ করা & রেফারেল ট্র্যাকিং
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

    const savedId = docRef.id;

    // ⚡ ১৫% পার্টনার টাস্ক রেফারেল প্রফিট ট্র্যাকিং ইঞ্জিন এক্সিকিউট করা
    if (taskData.creatorId && Number(taskData.totalPaidGram) > 0) {
      try {
        await trackPartnerTaskCommission({
          taskId: savedId,
          creatorId: taskData.creatorId,
          creatorName: taskData.creatorName || taskData.creatorUsername || 'Friend',
          creatorUsername: taskData.creatorUsername || '',
          taskTitle: taskData.title,
          totalPaidGram: taskData.totalPaidGram,
          creatorReferredBy: taskData.creatorReferredBy
        });
      } catch (trackErr) {
        console.warn('trackPartnerTaskCommission failed:', trackErr);
      }
    }

    return savedId;
  } catch (err) {
    console.error("Firebase savePartnerTask error:", err);
    return null;
  }
};

// ⚡ পার্টনার টাস্ক কমিশন ট্র্যাকিং ইঞ্জিন (১৫% লাইফটাইম GRAM কমিশন)
export const trackPartnerTaskCommission = async ({
  taskId,
  creatorId,
  creatorName = 'Friend',
  creatorUsername = '',
  taskTitle = 'Partner Campaign',
  totalPaidGram = 0,
  creatorReferredBy = null
}) => {
  if (!db || !taskId || !creatorId) return null;
  const gramAmount = Number(totalPaidGram) || 0;
  if (gramAmount <= 0) return null;

  try {
    const creatorIdStr = creatorId.toString().trim();
    let referrerIdStr = creatorReferredBy ? creatorReferredBy.toString().trim() : null;

    // ১. সিকিউরিটি চেক: যদি creatorReferredBy ক্লায়েন্ট স্টেটে না থাকে, সরাসরি ফায়ারস্টোর থেকে ভেরিফাই করা
    if (!referrerIdStr) {
      const creatorDocSnap = await getDoc(doc(db, "users", creatorIdStr));
      if (creatorDocSnap.exists()) {
        const creatorData = creatorDocSnap.data();
        referrerIdStr = creatorData.referredBy ? creatorData.referredBy.toString().trim() : null;
      }
    }

    // ২. রেফারার নেই অথবা নিজেকে নিজে রেফার করেছে
    if (!referrerIdStr || referrerIdStr === creatorIdStr) {
      console.log(`[Partner Commission Engine] No valid referrer for user ${creatorIdStr}`);
      return null;
    }

    // ৩. ১৫% কমিশন হিসেব (Strict rounding to 4 decimals)
    const commissionGram = Number((gramAmount * 0.15).toFixed(4));
    if (commissionGram <= 0) return null;

    // ৪. ডাবল ট্র্যাকিং রোধ (Idempotent Atomic Transaction)
    const commDocId = `comm_${taskId}`;
    const commRef = doc(db, "partner_task_commissions", commDocId);
    const referrerRef = doc(db, "users", referrerIdStr);

    await runTransaction(db, async (transaction) => {
      // চেক করি আগেই এই টাস্কের কমিশন রেকর্ড হয়েছে কিনা
      const commDocSnap = await transaction.get(commRef);
      if (commDocSnap.exists()) {
        console.warn(`[Partner Commission Engine] Commission already recorded for task ${taskId}`);
        return;
      }

      // রেফারার ডকুমেন্ট চেক
      const refDocSnap = await transaction.get(referrerRef);
      if (!refDocSnap.exists()) {
        console.warn(`[Partner Commission Engine] Referrer document ${referrerIdStr} does not exist`);
        return;
      }

      // ১. কমিশন রেকর্ড তৈরি
      transaction.set(commRef, {
        id: commDocId,
        taskId: taskId.toString(),
        taskTitle: taskTitle || 'Partner Task',
        creatorId: creatorIdStr,
        creatorName: creatorName || 'Friend',
        creatorUsername: creatorUsername || '',
        referrerId: referrerIdStr,
        taskGramAmount: gramAmount,
        commissionRate: 0.15,
        profitGram: commissionGram,
        claimed: false,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

      // ২. রেফারারের একাউন্টে ক্লেইমেবল প্রফিট যোগ
      transaction.update(referrerRef, {
        claimablePartnerGram: increment(commissionGram),
        totalPartnerGramEarned: increment(commissionGram),
        partnerReferralTaskCount: increment(1)
      });

      // ৩. রেফারারের ট্রানজেকশন হিস্ট্রিতে রেকর্ড
      const userTxRef = doc(collection(db, "users", referrerIdStr, "transactions"));
      transaction.set(userTxRef, {
        title: 'Partner 15% Profit',
        subtitle: `${creatorName} launched: ${taskTitle}`,
        amount: `+${commissionGram} GRAM`,
        currency: 'gram',
        type: 'earn',
        category: 'partner_commission',
        status: 'Completed',
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });
    });

    console.log(`[Partner Commission Engine] 🚀 Successfully credited +${commissionGram} GRAM (15%) to Referrer ${referrerIdStr} for task ${taskId}`);

    // ৫. বট থেকে রেফারারকে টেলিগ্রামে ইনস্ট্যান্ট নোটিফিকেশন পাঠানো
    try {
      await fetch(`${FUNCTIONS_URL}/api/telegram/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner_profit',
          chatId: referrerIdStr,
          payload: {
            friendName: creatorName,
            taskTitle: taskTitle,
            profitGram: commissionGram
          }
        })
      });
    } catch (notifyErr) {
      console.warn('Telegram notify error for partner profit:', notifyErr);
    }

    return {
      success: true,
      referrerId: referrerIdStr,
      commissionGram
    };
  } catch (err) {
    console.error("[Partner Commission Engine Error]:", err);
    return null;
  }
};

// ⚡ ক্লেইম প্রফিট ফাংশন (Atomic & Secure)
export const claimPartnerProfitInDB = async (userId) => {
  if (!db || !userId) {
    return { success: false, message: 'Invalid user id' };
  }

  const userIdStr = userId.toString().trim();
  const userRef = doc(db, "users", userIdStr);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found in database');
      }

      const userData = userSnap.data();
      const claimable = Number(userData.claimablePartnerGram || 0);

      if (claimable <= 0) {
        throw new Error('No partner profit available to claim');
      }

      // ক্লেইমেবল ০ করা এবং ক্লেইমড ও ব্যালেন্সে ক্রেডিট
      transaction.update(userRef, {
        claimablePartnerGram: 0,
        claimedPartnerGram: increment(claimable),
        gramBalance: increment(claimable)
      });

      // ট্রানজেকশন হিস্ট্রি লগ
      const txRef = doc(collection(db, "users", userIdStr, "transactions"));
      transaction.set(txRef, {
        title: 'Partner Profit Claimed',
        subtitle: '15% Partner Task Profit Payout',
        amount: `+${claimable} GRAM`,
        currency: 'gram',
        type: 'earn',
        category: 'partner_claim',
        status: 'Completed',
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });

      return {
        success: true,
        claimedGram: claimable,
        newGramBalance: (Number(userData.gramBalance || 0) + claimable)
      };
    });

    return result;
  } catch (err) {
    console.error("[claimPartnerProfitInDB error]:", err);
    return { success: false, message: err.message };
  }
};

// ⚡ রেফারেল পার্টনার টাস্ক হিস্ট্রি রিড করা
export const getPartnerProfitHistoryFromDB = async (userId) => {
  if (!db || !userId) return [];
  try {
    const userIdStr = userId.toString().trim();
    const commsRef = collection(db, "partner_task_commissions");
    const q = query(
      commsRef,
      where("referrerId", "==", userIdStr),
      limit(50)
    );
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return list;
  } catch (err) {
    console.warn("getPartnerProfitHistoryFromDB error:", err);
    return [];
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

// 🎁 Cloud Firestore Promo Code / Redeem System (Atomic & Secure)
export const redeemPromoCodeInDB = async (code, userId) => {
  if (!db || !code || !userId) {
    return { success: false, message: 'Invalid request' };
  }
  const cleanCode = code.trim().toUpperCase();
  const codeRef = doc(db, "promo_codes", cleanCode);
  const userRef = doc(db, "users", userId.toString());

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Fetch promo code document
      const codeSnap = await transaction.get(codeRef);
      if (!codeSnap.exists()) {
        throw new Error('Invalid promo code!');
      }
      const promoData = codeSnap.data();

      // 2. Fetch user document to check verification in Firestore database
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User profile not found in database!');
      }
      const userData = userSnap.data();

      // 🔒 Security Check: ONLY verified users can redeem (checked directly from database)
      if (!userData.isVerified && !userData.verifiedBadge) {
        throw new Error('Verified Farmers Only! Unlock your Verify Badge to redeem.');
      }

      // 3. Check if promo code is active
      if (promoData.active === false) {
        throw new Error('This promo code is expired or inactive!');
      }

      // 4. Check if already claimed by this user
      const claimedBy = Array.isArray(promoData.claimed_by) ? promoData.claimed_by.map(String) : [];
      if (claimedBy.includes(String(userId))) {
        throw new Error('You have already redeemed this promo code!');
      }

      // 5. Check max claims limit
      const currentClaims = Number(promoData.current_claims || 0);
      const maxClaims = Number(promoData.max_claims || 0);
      if (maxClaims > 0 && currentClaims >= maxClaims) {
        throw new Error('This promo code has reached its maximum claim limit!');
      }

      // 6. Calculate reward directly from server record
      const rewardAmount = Number(promoData.reward_amount || 0);
      const rawType = (promoData.reward_type || 'apple').toLowerCase();
      const rewardType = (rawType === 'diamond' || rawType === 'diamonds') ? 'diamond' : 'apple';

      // 7. Atomic Writes to DB:
      // a) Update promo code claims and claimed_by list
      const newClaims = currentClaims + 1;
      const isNowMaxed = maxClaims > 0 && newClaims >= maxClaims;
      transaction.update(codeRef, {
        current_claims: newClaims,
        claimed_by: [...claimedBy, String(userId)],
        active: isNowMaxed ? false : promoData.active
      });

      // b) Update user balance in Firestore directly on database level
      if (rewardType === 'diamond') {
        const nextDiamonds = Number(((userData.diamonds || 0) + rewardAmount).toFixed(2));
        transaction.update(userRef, { diamonds: nextDiamonds });
      } else {
        const nextApples = (userData.apples || 0) + rewardAmount;
        transaction.update(userRef, { apples: nextApples });
      }

      return {
        rewardAmount,
        rewardType,
        newApples: rewardType === 'apple' ? (userData.apples || 0) + rewardAmount : userData.apples,
        newDiamonds: rewardType === 'diamond' ? Number(((userData.diamonds || 0) + rewardAmount).toFixed(2)) : userData.diamonds
      };
    });

    return {
      success: true,
      rewardAmount: result.rewardAmount,
      rewardType: result.rewardType,
      newApples: result.newApples,
      newDiamonds: result.newDiamonds,
      message: `Code Redeemed! +${result.rewardAmount} ${result.rewardType === 'diamond' ? 'Diamonds' : 'Apples'}`
    };
  } catch (err) {
    console.error("redeemPromoCodeInDB error:", err);
    return { success: false, message: err.message || 'Failed to redeem promo code' };
  }
};

