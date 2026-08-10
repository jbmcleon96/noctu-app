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
    const { clubId, memberId, message, activityType, activityDescription, 
bonusPoints } = req.body || {};

    if (!clubId || !memberId || !message || !activityType) {
      res.status(400).json({ error: "Missing clubId, memberId, message, or 
activityType" });
      return;
    }

    const userRef = db.collection("users").doc(memberId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const userData = userSnap.data() || {};
    const phone: string | undefined = userData.phone;

    if (!phone) {
      res.status(400).json({ error: "Member has no phone number on file" 
});
      return;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      res.status(500).json({ error: "Twilio is not configured on the 
server" });
      return;
    }

    const twilioResp = await fetch(
      
`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic 
${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phone,
          From: fromNumber,
          Body: message,
        }).toString(),
      }
    );

    const twilioResult = await twilioResp.json();

    if (!twilioResp.ok) {
      console.error("Twilio error:", twilioResult);
      res.status(502).json({ error: twilioResult?.message || "Failed to 
send SMS via Twilio" });
      return;
    }

    if (bonusPoints && bonusPoints > 0) {
      await userRef.update({
        points: admin.firestore.FieldValue.increment(bonusPoints),
      });
    }

    await userRef.collection("activity").add({
      type: activityType,
      points: bonusPoints || 0,
      description: activityDescription || message,
      clubId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("clubs").doc(clubId).collection("activity").add({
      type: activityType,
      memberId,
      points: bonusPoints || 0,
      description: activityDescription || message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, sid: twilioResult.sid });
  } catch (err: any) {
    console.error("send-sms error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" 
});
  }
}
