import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import {
  doc, getDoc, updateDoc, addDoc,
  collection, serverTimestamp, increment
} from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Props {
  clubId: string;
}

type ScanMode = "door" | "bar";

interface ScanResult {
  success: boolean;
  memberName: string;
  points: number;
  tier: string;
  message: string;
}

export default function OwnerQRScanner({ clubId }: Props) {
  const [mode, setMode] = useState<ScanMode>("door");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  function startScanner() {
    setResult(null);
    setScanning(true);

    setTimeout(() => {
      if (!containerRef.current) return;
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current = scanner;
      scanner.render(
        (decodedText) => {
          scanner.clear().catch(() => {});
          setScanning(false);
          handleScan(decodedText);
        },
        (error) => {
          // ignore scan errors
          void error;
        }
      );
    }, 100);
  }

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }

  async function handleScan(qrData: string) {
    // QR format: noctu:member:{uid}
    if (!qrData.startsWith("noctu:member:")) {
      setResult({ success: false, memberName: "", points: 0, tier: "", message: "Invalid QR code. Not a Noctu member QR." });
      return;
    }

    const uid = qrData.replace("noctu:member:", "");
    setProcessing(true);

    try {
      // Get point settings for this club
      const psSnap = await getDoc(doc(db, "clubs", clubId, "settings", "points"));
      const ps = psSnap.exists() ? psSnap.data() : { doorScan: 50, barScan: 25 };

      // Get member profile
      const memberSnap = await getDoc(doc(db, "users", uid));
      if (!memberSnap.exists()) {
        setResult({ success: false, memberName: "Unknown", points: 0, tier: "", message: "Member not found in Noctu." });
        setProcessing(false);
        return;
      }

      const member = memberSnap.data();
      const basePoints = mode === "door" ? (ps.doorScan ?? 50) : (ps.barScan ?? 25);
      const multipliers: Record<string, number> = { free: 1, vip: 2, elite: 3, starter: 1.25 };
      const multiplier = multipliers[member.subscription ?? "free"] ?? 1;
      const pointsEarned = Math.round(basePoints * multiplier);

      // Get club name for activity label
      const clubSnap = await getDoc(doc(db, "clubs", clubId));
      const clubName = clubSnap.exists() ? (clubSnap.data().clubName ?? "the club") : "the club";

      // Award points to member
      await updateDoc(doc(db, "users", uid), {
        points: increment(pointsEarned),
      });

      // Log activity for member
      await addDoc(collection(db, "users", uid, "activity"), {
        type: mode === "door" ? "door_scan" : "bar_scan",
        points: pointsEarned,
        description: `${mode === "door" ? "🚪 Checked in at" : "🍹 Bar scan at"} ${clubName} · +${pointsEarned} pts`,
        createdAt: serverTimestamp(),
      });

      // Add member to club's members subcollection (upsert)
      await updateDoc(doc(db, "clubs", clubId, "members", uid), {
        points: increment(pointsEarned),
        lastScan: serverTimestamp(),
      }).catch(async () => {
        // Member not in club yet — create them
        await addDoc(collection(db, "clubs", clubId, "members"), {
          ...member,
          points: pointsEarned,
          joinedAt: serverTimestamp(),
          lastScan: serverTimestamp(),
        });
      });

      // Log activity for club
      await addDoc(collection(db, "clubs", clubId, "activity"), {
        type: mode === "door" ? "door_scan" : "bar_scan",
        description: `${mode === "door" ? "🚪 Door scan" : "🍹 Bar scan"} — ${member.displayName || member.username} · +${pointsEarned} pts`,
        createdAt: serverTimestamp(),
      });

      setResult({
        success: true,
        memberName: member.displayName || member.username || "Member",
        points: pointsEarned,
        tier: member.tier || "Access",
        message: `+${pointsEarned} pts awarded!`,
      });
    } catch (e) {
      console.error(e);
      setResult({ success: false, memberName: "", points: 0, tier: "", message: "Something went wrong. Try again." });
    } finally {
      setProcessing(false);
    }
  }

  const TIER_COLORS: Record<string, string> = {
    Access: "#888888", Silver: "#C0C0C0", Gold: "#FFD700", Obsidian: "#BF00FF",
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>QR Scanner</div>
      <div style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>Scan a member's QR code to award points</div>

      {/* Mode Toggle */}
      <div style={{
        display: "flex",
        background: "#1a002a",
        border: "1px solid #3a0055",
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        gap: 4,
      }}>
        {(["door", "bar"] as ScanMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "12px",
              background: mode === m ? "#BF00FF" : "transparent",
              border: "none",
              borderRadius: 10,
              color: mode === m ? "#fff" : "#666",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {m === "door" ? "🚪 Door" : "🍹 Bar"}
          </button>
        ))}
      </div>

      <div style={{ color: "#555", fontSize: 12, textAlign: "center", marginBottom: 16 }}>
        {mode === "door" ? "Awarding door scan points to members at entry" : "Awarding bar scan points to members at the bar"}
      </div>

      {/* Scanner Area */}
      {!scanning && !processing && (
        <button
          onClick={startScanner}
          style={{
            width: "100%",
            padding: "18px",
            background: "#BF00FF",
            border: "none",
            borderRadius: 14,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 24px #BF00FF44",
            marginBottom: 20,
          }}
        >
          📷 Start Scanning
        </button>
      )}

      {processing && (
        <div style={{
          textAlign: "center",
          padding: "30px",
          background: "#110018",
          border: "1px solid #2a0040",
          borderRadius: 14,
          marginBottom: 20,
          color: "#BF00FF",
          fontSize: 15,
        }}>
          Processing scan...
        </div>
      )}

      {scanning && (
        <div style={{ marginBottom: 16 }}>
          <div ref={containerRef} id="qr-reader" style={{ borderRadius: 14, overflow: "hidden" }} />
          <button
            onClick={stopScanner}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px",
              background: "transparent",
              border: "1px solid #3a0055",
              borderRadius: 10,
              color: "#888",
              fontSize: 14,
              cursor: "pointer",
            }}
          >Cancel</button>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div style={{
          background: result.success ? "#00301a" : "#2a0010",
          border: `1px solid ${result.success ? "#00ff88" : "#ff3366"}`,
          borderRadius: 14,
          padding: "20px",
          textAlign: "center",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {result.success ? "✅" : "❌"}
          </div>
          {result.success ? (
            <>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{result.memberName}</div>
              <div style={{ color: TIER_COLORS[result.tier] || "#888", fontSize: 13, marginTop: 4 }}>{result.tier}</div>
              <div style={{ color: "#00ff88", fontSize: 28, fontWeight: 800, margin: "12px 0" }}>
                +{result.points} pts
              </div>
              <div style={{ color: "#888", fontSize: 13 }}>{mode === "door" ? "🚪 Door scan" : "🍹 Bar scan"} recorded</div>
            </>
          ) : (
            <div style={{ color: "#ff3366", fontSize: 14 }}>{result.message}</div>
          )}

          <button
            onClick={() => { setResult(null); startScanner(); }}
            style={{
              marginTop: 16,
              padding: "11px 24px",
              background: "#BF00FF",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >Scan Next Member</button>
        </div>
      )}
    </div>
  );
}
