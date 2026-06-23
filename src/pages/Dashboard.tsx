import { useState, useEffect, useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import { db, storage } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { QRCodeSVG } from "qrcode.react";

type FirestoreDateLike =
  | number
  | string
  | Date
  | { seconds?: number; nanoseconds?: number; toDate?: () => Date }
  | null
  | undefined;

interface Profile {
  role?: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  galleryPhotos?: string[];
  points?: number;
  tier?: string;
  subscription?: string;
  referralCode?: string;
  birthday?: string;
  createdAt?: FirestoreDateLike;
}

interface Activity {
  id: string;
  type?: string;
  points?: number;
  description?: string;
  createdAt?: FirestoreDateLike;
}

interface Club {
  id: string;
  clubName?: string;
  city?: string;
  state?: string;
  coverURL?: string;
  logoURL?: string;
}

interface EventItem {
  id: string;
  title?: string;
  description?: string;
  date?: FirestoreDateLike;
  coverURL?: string;
  clubName?: string;
  gradient?: string;
}

const TIER_COLORS: Record<string, string> = {
  Access: "#888888",
  Silver: "#C0C0C0",
  Gold: "#FFD700",
  Obsidian: "#BF00FF",
};

const TIER_THRESHOLDS: Record<string, number> = {
  Access: 0,
  Silver: 500,
  Gold: 1500,
  Obsidian: 5000,
};

const SUBSCRIPTIONS: Record<string, { label: string; color: string; multiplier: number; price: string }> = {
  free: { label: "Free", color: "#888", multiplier: 1, price: "" },
  starter: { label: "Starter", color: "#ff6b6b", multiplier: 1.25, price: "$9.99/mo" },
  vip: { label: "VIP", color: "#BF00FF", multiplier: 2, price: "$19.99/mo" },
  elite: { label: "Elite", color: "#FFD700", multiplier: 3, price: "$49.99/mo" },
};

const BENEFITS: Record<string, string[]> = {
  free: ["1× points on every scan", "Access to club events", "Basic member profile"],
  starter: ["1.25× points on every purchase", "$20 house credits every month", "Priority entry on regular nights", "Monthly member-only events"],
  vip: ["2× points on every scan", "$35 house credits every month", "Skip the line every visit", "VIP lounge access", "Birthday bonus points"],
  elite: ["3× points on every scan", "$75 house credits every month", "Dedicated host every visit", "Private table priority", "Exclusive elite events", "Free cover every night"],
};

const EVENT_GRADIENTS = [
  "linear-gradient(135deg, #ff6b9d, #c44dff)",
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
];

const NAV = [
  { label: "Home", icon: "🏠" },
  { label: "Events", icon: "🎉" },
  { label: "Profile", icon: "👤" },
];

function toMillis(value: FirestoreDateLike): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object") {
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (typeof value.seconds === "number") return value.seconds * 1000;
  }
  return 0;
}

function formatDate(value: FirestoreDateLike, options?: Intl.DateTimeFormatOptions) {
  const ms = toMillis(value);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", options);
}

function formatTime(value: FirestoreDateLike, options?: Intl.DateTimeFormatOptions) {
  const ms = toMillis(value);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString("en-US", options);
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState<number | null>(null);
  const [savingSubscription, setSavingSubscription] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [birthdayInput, setBirthdayInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [copied, setCopied] = useState(false);

  const uid = user?.uid ?? "";

  const MEMBER_PRICE_IDS: Record<string, string> = {
    starter: "price_1TlYvfBprLkwkiEd4eJzkZUU",
    elite: "price_1TlYvYBprLkwkiEdexU2z1Rl",
    vip: "price_1TlYvcBprLkwkiEdp4vI7kEP",
  };

  async function startCheckout(plan: "starter" | "vip" | "elite") {
  if (!uid) {
    window.location.href = "/signin";
    return;
  }

  setSavingSubscription(plan);

  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId: MEMBER_PRICE_IDS[plan],
        userType: "member",
        email: user?.email ?? "",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Could not start checkout.");
    }

    if (!data?.url) {
      throw new Error("Stripe checkout URL missing.");
    }

    window.location.href = data.url;
  } catch (e) {
    console.error("Checkout start error:", e);
    alert("Could not open Stripe checkout.");
  } finally {
    setSavingSubscription(null);
  }
}

  useEffect(() => {
    if (!user || !uid) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data() as Profile;
          setProfile({
            ...data,
            galleryPhotos: Array.isArray(data.galleryPhotos) ? data.galleryPhotos.slice(0, 3) : [],
          });
          setUsernameInput(data.username ?? "");
          setBirthdayInput(data.birthday ?? "");
          if (!data.username && data.role !== "owner") setShowUsernameModal(true);
        } else {
          const starterProfile: Profile = {
            displayName: user?.displayName ?? "",
            username: "",
            photoURL: user?.photoURL ?? "",
            galleryPhotos: [],
            points: 0,
            tier: "Access",
            subscription: "free",
            referralCode: uid.slice(0, 6).toUpperCase(),
            birthday: "",
            createdAt: Date.now(),
          };

          await setDoc(doc(db, "users", uid), {
            ...starterProfile,
            createdAt: serverTimestamp(),
          });

          setProfile(starterProfile);
          if (!starterProfile.username) setShowUsernameModal(true);
        }

        const actSnap = await getDocs(
          query(collection(db, "users", uid, "activity"), orderBy("createdAt", "desc"), limit(10))
        );
        setActivity(actSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Activity, "id">) })));

        const clubSnap = await getDocs(collection(db, "clubs"));
        const userClubs: Club[] = [];
        const allEvents: EventItem[] = [];

        for (const cd of clubSnap.docs) {
          const clubData = cd.data() as Omit<Club, "id">;
          const memberSnap = await getDoc(doc(db, "clubs", cd.id, "members", uid));

          if (memberSnap.exists()) {
            userClubs.push({ id: cd.id, ...clubData });

            const evSnap = await getDocs(
              query(collection(db, "clubs", cd.id, "events"), orderBy("date", "asc"), limit(5))
            );

            evSnap.docs.forEach((ev, i) => {
              const eventData = ev.data() as Omit<EventItem, "id">;
              allEvents.push({
                id: ev.id,
                ...eventData,
                clubName: clubData.clubName ?? "",
                gradient: EVENT_GRADIENTS[i % EVENT_GRADIENTS.length],
              });
            });
          }
        }

        setClubs(userClubs);
        setEvents(
          allEvents
            .filter((e) => toMillis(e.date) >= Date.now())
            .sort((a, b) => toMillis(a.date) - toMillis(b.date))
        );
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, uid]);

  async function saveUsername() {
    if (!usernameInput.trim() || !uid) return;

    setSavingUsername(true);
    try {
      const trimmedUsername = usernameInput.trim();
      const updates: Record<string, unknown> = { username: trimmedUsername };
      if (birthdayInput) updates.birthday = birthdayInput;

      await updateDoc(doc(db, "users", uid), updates);

      setProfile((p) =>
        p
          ? { ...p, username: trimmedUsername, birthday: birthdayInput || p.birthday }
          : { username: trimmedUsername, birthday: birthdayInput }
      );

      setShowUsernameModal(false);
    } catch (e) {
      console.error("Save username error:", e);
    } finally {
      setSavingUsername(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    setUploadingPhoto(true);
    try {
      const avatarRef = ref(storage, `avatars/${uid}/profile`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);
      await updateDoc(doc(db, "users", uid), { photoURL: url });

      if (!profile?.photoURL) {
        await updateDoc(doc(db, "users", uid), { points: increment(200) });
        await setDoc(doc(db, "users", uid, "activity", "profile_pic"), {
          type: "profile_pic",
          points: 200,
          description: "📸 Profile pic added · +200 pts",
          createdAt: serverTimestamp(),
        });
      }

      setProfile((p) =>
        p ? { ...p, photoURL: url, points: p.photoURL ? p.points : (p.points ?? 0) + 200 } : p
      );
    } catch (e) {
      console.error("Photo upload error:", e);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleGalleryUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    setUploadingGalleryIndex(index);
    try {
      const galleryRef = ref(storage, `member-gallery/${uid}/photo-${index + 1}`);
      await uploadBytes(galleryRef, file);
      const url = await getDownloadURL(galleryRef);

      const currentGallery = Array.isArray(profile?.galleryPhotos) ? [...profile!.galleryPhotos] : [];
      while (currentGallery.length < 3) currentGallery.push("");
      const isNewPhoto = !currentGallery[index];
      currentGallery[index] = url;

      await updateDoc(doc(db, "users", uid), { galleryPhotos: currentGallery });

      if (isNewPhoto) {
        await updateDoc(doc(db, "users", uid), { points: increment(100) });
        await setDoc(doc(db, "users", uid, "activity", `gallery_${index}_${Date.now()}`), {
          type: "gallery_photo",
          points: 100,
          description: `🖼️ Gallery photo ${index + 1} added · +100 pts`,
          createdAt: serverTimestamp(),
        });
      }

      setProfile((p) =>
        p
          ? {
              ...p,
              galleryPhotos: currentGallery,
              points: isNewPhoto ? (p.points ?? 0) + 100 : p.points,
            }
          : p
      );
    } catch (e) {
      console.error("Gallery upload error:", e);
    } finally {
      setUploadingGalleryIndex(null);
    }
  }

  function copyReferral() {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0010", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#BF00FF", fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  const currentSubscription = profile?.subscription ?? "free";
  const sub = SUBSCRIPTIONS[currentSubscription] ?? SUBSCRIPTIONS.free;
  const currentTier = profile?.tier ?? "Access";
  const currentPoints = profile?.points ?? 0;
  const tierKeys = Object.keys(TIER_THRESHOLDS) as (keyof typeof TIER_THRESHOLDS)[];
  const tierIndex = tierKeys.indexOf(currentTier as keyof typeof TIER_THRESHOLDS);
  const nextTier = tierKeys[tierIndex + 1];
  const currentThreshold = TIER_THRESHOLDS[currentTier] ?? 0;
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : currentPoints;
  const progress = nextTier ? (((currentPoints - currentThreshold) / Math.max(nextThreshold - currentThreshold, 1)) * 100) : 100;
  const galleryPhotos = Array.isArray(profile?.galleryPhotos) ? profile!.galleryPhotos.slice(0, 3) : [];
  while (galleryPhotos.length < 3) galleryPhotos.push("");
  const profileComplete = [profile?.photoURL, profile?.username, profile?.birthday, ...galleryPhotos.filter(Boolean)].filter(Boolean).length * 20;

  return (
    <div style={{ minHeight: "100vh", maxWidth: 480, margin: "0 auto", background: "#0a0010", fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>
      {showUsernameModal && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#110018", border: "1px solid #3a0055", borderRadius: 20, padding: 28, width: "100%", maxWidth: 380 }}>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Welcome to Noctü 🌙</div>
            <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Set your username to get started</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>USERNAME</div>
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. alex_noctu"
                style={{ width: "100%", background: "#1a002a", border: "1px solid #3a0055", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, boxSizing: "border-box", outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>
                BIRTHDAY <span style={{ color: "#555" }}>(optional — clubs may send you gifts)</span>
              </div>
              <input
                type="date"
                value={birthdayInput}
                onChange={(e) => setBirthdayInput(e.target.value)}
                style={{ width: "100%", background: "#1a002a", border: "1px solid #3a0055", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, boxSizing: "border-box", outline: "none" }}
              />
            </div>

            <button
              onClick={saveUsername}
              disabled={savingUsername || !usernameInput.trim()}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #BF00FF, #ff6b9d)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              {savingUsername ? "Saving..." : "Let's Go →"}
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #ff6b9d, #BF00FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔑</div>
          <span style={{ color: "#ff6b9d", fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>NOCTÜ</span>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a0030", border: "1px solid #3a0055", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>🔔</div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {activeTab === 0 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, marginBottom: 2 }}>
              Good evening, {profile?.displayName?.split(" ")[0] || profile?.username || "there"}
            </div>
            <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
              {clubs.length > 0 ? `${clubs[0].clubName ?? "Club"} · ${clubs[0].city ?? ""}` : "Find a club to start earning"}
            </div>

            <div
              style={{
                background: "#110018",
                border: `2px solid ${sub.color}`,
                borderRadius: 16,
                padding: "20px",
                marginBottom: 16,
                boxShadow: `0 0 30px ${sub.color}33`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
                  {profile?.displayName || profile?.username || "Member"}
                </div>
                <div style={{ background: sub.color, borderRadius: 20, padding: "4px 14px", color: "#fff", fontSize: 13, fontWeight: 700 }}>
                  {sub.label.toUpperCase()}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
                  <QRCodeSVG value={`noctu:member:${uid}`} size={180} />
                </div>
              </div>

              <div style={{ color: "#888", fontSize: 13, textAlign: "center" }}>Show at door & bar for points</div>
            </div>

            {events.length > 0 && (
              <div style={{ background: "#1a0020", border: "1px solid #2a0040", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>🎟️</div>
                <div>
                  <div style={{ color: "#BF00FF", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                    UPCOMING AT {events[0].clubName?.toUpperCase() ?? "YOUR CLUB"}
                  </div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{events[0].title ?? "Upcoming event"}</div>
                </div>
              </div>
            )}

            <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ color: "#BF00FF", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
                YOUR SUBSCRIPTION
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                {Object.entries(SUBSCRIPTIONS).map(([key, s]) => (
                  <div
                    key={key}
                    style={{
                      background: currentSubscription === key ? s.color : "#1a002a",
                      border: `1px solid ${currentSubscription === key ? s.color : "#3a0055"}`,
                      borderRadius: 10,
                      padding: "10px 4px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ color: currentSubscription === key ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700 }}>
                      {s.label}
                    </div>
                    {s.price && (
                      <div style={{ color: currentSubscription === key ? "#ffffff99" : "#555", fontSize: 10, marginTop: 2 }}>
                        {s.price}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderRadius: 12, overflow: "hidden", border: "1px solid #2a0040" }}>
                {[
                  { label: "POINTS", value: currentPoints.toLocaleString(), color: "#ff6b6b" },
                  { label: "CREDITS", value: currentSubscription === "free" ? "$0.00" : currentSubscription === "starter" ? "$20.00" : currentSubscription === "vip" ? "$35.00" : "$75.00", color: "#BF00FF" },
                  { label: "TIER", value: currentTier.toUpperCase(), color: "#fff" },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    style={{ padding: "14px 10px", background: "#1a002a", borderLeft: i > 0 ? "1px solid #2a0040" : "none", textAlign: "center" }}
                  >
                    <div style={{ color: s.color, fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                    <div style={{ color: "#555", fontSize: 10, marginTop: 4, letterSpacing: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {nextTier && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: TIER_COLORS[currentTier] ?? "#BF00FF", fontSize: 12, fontWeight: 700 }}>
                      {currentTier}
                    </span>
                    <span style={{ color: "#555", fontSize: 12 }}>
                      {Math.max(nextThreshold - currentPoints, 0)} pts to {nextTier}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#0a0015", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(progress, 100))}`,
                        background: `linear-gradient(90deg, ${TIER_COLORS[currentTier] ?? "#888888"}, #BF00FF)`,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {currentSubscription !== "starter" && (
                  <button
                    onClick={() => startCheckout("starter")}
                    disabled={savingSubscription !== null}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #ff6b6b",
                      background: "#ff6b6b22",
                      color: "#ff6b6b",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      opacity: savingSubscription ? 0.7 : 1,
                    }}
                  >
                    {savingSubscription === "starter" ? "Saving..." : "Upgrade to Starter · $9.99/mo"}
                  </button>
                )}

                {currentSubscription !== "vip" && (
                  <button
                    onClick={() => startCheckout("vip")}
                    disabled={savingSubscription !== null}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #BF00FF",
                      background: "#BF00FF22",
                      color: "#BF00FF",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      opacity: savingSubscription ? 0.7 : 1,
                    }}
                  >
                    {savingSubscription === "vip" ? "Saving..." : "Upgrade to VIP · $19.99/mo"}
                  </button>
                )}

                {currentSubscription !== "elite" && (
                  <button
                    onClick={() => startCheckout("elite")}
                    
                    disabled={savingSubscription !== null}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #FFD700",
                      background: "#FFD70022",
                      color: "#FFD700",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      opacity: savingSubscription ? 0.7 : 1,
                    }}
                  >
                    {savingSubscription === "elite" ? "Saving..." : "Upgrade to Elite · $49.99/mo"}
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>REFERRAL CODE</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ color: "#BF00FF", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>
                  {profile?.referralCode || "NOCTU"}
                </div>
                <button
                  onClick={copyReferral}
                  style={{ background: "#BF00FF22", border: "1px solid #BF00FF", borderRadius: 8, padding: "8px 14px", color: "#BF00FF", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                >
                  {copied ? "Copied!" : "Share +150 pts"}
                </button>
              </div>
            </div>

            {activity.length > 0 && (
              <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
                <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>RECENT ACTIVITY</div>
                {activity.map((a) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ color: "#ccc", fontSize: 13 }}>{a.description ?? "Activity"}</div>
                    <div style={{ color: "#BF00FF", fontSize: 13, fontWeight: 700 }}>
                      {a.points ? `+${a.points}` : "•"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 1 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ color: "#fff", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Upcoming events</div>
            <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
              {clubs.length > 0 ? `At ${clubs.map((c) => c.clubName ?? "Club").join(", ")}` : "Join a club to see events"}
            </div>

            {events.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#555" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div style={{ color: "#aaa", fontSize: 15 }}>No upcoming events</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Check back soon</div>
              </div>
            )}

            {events.map((ev) => (
              <div key={ev.id} style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                <div
                  style={{
                    height: 80,
                    background: ev.coverURL ? `url(${ev.coverURL})` : ev.gradient,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{ev.title ?? "Event"}</div>
                </div>

                <div style={{ padding: "14px 16px" }}>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{ev.title ?? "Event"}</div>
                  <div style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>{ev.clubName ?? "Club"}</div>
                  <div style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>
                    {formatDate(ev.date, { weekday: "short", month: "short", day: "numeric" })} · {formatTime(ev.date, { hour: "2-digit", minute: "2-digit" })}
                    {ev.description ? ` · ${ev.description}` : ""}
                  </div>
                  <button style={{ background: "#BF00FF", border: "none", borderRadius: 8, padding: "8px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    RSVP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div
                onClick={() => profileInputRef.current?.click()}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: profile?.photoURL ? "none" : "linear-gradient(135deg, #ff6b9d, #BF00FF)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 6,
                  position: "relative",
                  cursor: "pointer",
                  border: "3px solid #BF00FF",
                }}
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span>{(profile?.displayName || profile?.username || "?")[0].toUpperCase()}</span>
                )}

                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#BF00FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    border: "2px solid #0a0010",
                  }}
                >
                  {uploadingPhoto ? "⏳" : "✏️"}
                </div>
              </div>

              <input ref={profileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />

              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 8 }}>
                {profile?.displayName || profile?.username || "Member"}
              </div>
              <div style={{ color: "#888", fontSize: 14 }}>
                {sub.label} Member{clubs.length > 0 ? ` · ${clubs[0].clubName ?? "Club"}` : ""}
              </div>
              {!profile?.photoURL && (
                <div style={{ color: "#BF00FF", fontSize: 12, marginTop: 6 }}>Tap avatar to add profile pic · +200 pts</div>
              )}
            </div>

            <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>MY PHOTOS</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div
                  onClick={() => profileInputRef.current?.click()}
                  style={{
                    gridRow: "span 2",
                    minHeight: 180,
                    borderRadius: 16,
                    background: profile?.photoURL ? "transparent" : "linear-gradient(135deg, #1a002a, #240038)",
                    border: "1px solid #3a0055",
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ textAlign: "center", color: "#BF00FF" }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>📸</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>Add profile pic</div>
                    </div>
                  )}
                </div>

                {galleryPhotos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => galleryInputRefs.current[index]?.click()}
                    style={{
                      minHeight: 85,
                      borderRadius: 14,
                      background: photo ? "transparent" : "linear-gradient(135deg, #150022, #220033)",
                      border: "1px solid #3a0055",
                      overflow: "hidden",
                      cursor: "pointer",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <input
                      ref={(el) => {
                        galleryInputRefs.current[index] = el;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleGalleryUpload(index, e)}
                      style={{ display: "none" }}
                    />

                    {photo ? (
                      <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center", color: "#888" }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>
                          {uploadingGalleryIndex === index ? "⏳" : "＋"}
                        </div>
                        <div style={{ fontSize: 11 }}>Photo {index + 1}</div>
                      </div>
                    )}

                    {photo && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 6,
                          right: 6,
                          background: "#00000088",
                          borderRadius: 999,
                          padding: "4px 7px",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {uploadingGalleryIndex === index ? "Uploading..." : "Edit"}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ color: "#666", fontSize: 12, marginTop: 12 }}>
                Add up to 3 extra photos to show your vibe and style.
              </div>
            </div>

            <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ color: "#aaa", fontSize: 14 }}>Profile complete</div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{Math.min(profileComplete, 100)}</div>
              </div>
              <div style={{ height: 6, background: "#0a0015", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(profileComplete, 100)}`,
                    background: "linear-gradient(90deg, #BF00FF, #ff6b9d)",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>

            <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              {[
                { label: "Total Points", value: currentPoints.toLocaleString() },
                { label: "Subscription", value: sub.label },
                { label: "Tier", value: currentTier },
                { label: "Referral Code", value: profile?.referralCode ?? "" },
                { label: "Member Since", value: formatDate(profile?.createdAt, { month: "long", year: "numeric" }) },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "#666", fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>YOUR BENEFITS</div>
              {(BENEFITS[currentSubscription] ?? BENEFITS.free).map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ color: "#BF00FF", fontSize: 14 }}>✓</div>
                  <div style={{ color: "#ccc", fontSize: 14 }}>{b}</div>
                </div>
              ))}
            </div>

            {clubs.length > 0 && (
              <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>MY CLUBS</div>
                {clubs.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#BF00FF33", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {c.logoURL ? <img src={c.logoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏛️"}
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{c.clubName ?? "Club"}</div>
                      <div style={{ color: "#888", fontSize: 12 }}>
                        {c.city ?? ""}
                        {c.city && c.state ? ", " : ""}
                        {c.state ?? ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={async () => {
                await logout();
                window.location.href = "/signin";
              }}
              style={{ width: "100%", padding: "14px", background: "transparent", border: "1px solid #3a0055", borderRadius: 12, color: "#888", fontSize: 15, cursor: "pointer", marginBottom: 8 }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#0d0018", borderTop: "1px solid #1a0030", display: "flex", justifyContent: "space-around", padding: "10px 0 16px", zIndex: 100 }}>
        {NAV.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 24px" }}
          >
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, color: activeTab === i ? "#BF00FF" : "#555", fontWeight: activeTab === i ? 700 : 400 }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
    );
}
