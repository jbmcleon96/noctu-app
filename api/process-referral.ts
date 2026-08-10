import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req: VercelRequest, res: 
VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { referralCode, newUserId } = req.body || {};

    if (!referralCode || !newUserId) {
      res.status(400).json({ error: "Missing referralCode or newUserId" 
});
      return;
    }

    const referrerQuery = await db
      .collection("users")
      .where("referralCode", "==", referralCode)
      .limit(1)
      .get();

    if (referrerQuery.empty) {
      res.status(404).json({ error: "Referral code not found" });
      return;
    }

    const referrerDoc = referrerQuery.docs[0];
    const referrerId = referrerDoc.id;

    if (referrerId === newUserId) {
      res.status(400).json({ error: "Cannot refer yourself" });
      return;
    }

    const newUserRef = db.collection("users").doc(newUserId);
    const newUserSnap = await newUserRef.get();

    if (!newUserSnap.exists) {
      res.status(404).json({ error: "New user not found" });
      return;
    }

    const newUserData = newUserSnap.data() || {};
    if (newUserData.referredBy) {
      res.status(409).json({ error: "This account already used a referral" 
});
      return;
    }

    const batch = db.batch();

    batch.update(referrerDoc.ref, {
      points: admin.firestore.FieldValue.increment(100),
    });
    batch.set(referrerDoc.ref.collection("activity").doc(), {
      type: "referral_sent",
      points: 100,
      description: `🎉 Referral bonus · +100 pts`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.update(newUserRef, {
      points: admin.firestore.FieldValue.increment(200),
      referredBy: referrerId,
    });
    batch.set(newUserRef.collection("activity").doc(), {
      type: "referral_signup",
      points: 200,
      description: `🎉 Welcome bonus (referred) · +200 pts`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    res.status(200).json({ success: true, referrerId, referrerBonus: 100, 
newUserBonus: 200 });
  } catch (err: any) {
    console.error("process-referral error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" 
});
  }
}
