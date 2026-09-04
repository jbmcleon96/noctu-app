import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import "../styles/noctu-theme.css";

interface ClubDetail {
  clubName?: string;
  city?: string;
  state?: string;
  coverURL?: string;
  logoURL?: string;
  bio?: string;
  coverPrice?: number;
  perks?: {
    starter?: string;
    vip?: string;
    elite?: string;
  };
  primaryColor?: string;
}

export default function ClubDetailPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [joining, setJoining] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!clubId) return;
    const safeClubId: string = clubId;
    async function loadClub() {
      try {
        const snap = await getDoc(doc(db, "clubs", safeClubId));
        if (snap.exists()) {
          setClub(snap.data() as ClubDetail);
        }
      } catch (err) {
        console.error("Failed to load club:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClub();
  }, [clubId]);

  useEffect(() => {
    if (!clubId || !user) {
      setCheckingMembership(false);
      return;
    }
    const safeClubId: string = clubId;
    async function checkMembership() {
      try {
        const memberSnap = await getDoc(doc(db, "clubs", safeClubId, "members", user!.uid));
        setIsMember(memberSnap.exists());
      } catch (err) {
        console.error("Failed to check membership:", err);
      } finally {
        setCheckingMembership(false);
      }
    }
    checkMembership();
  }, [clubId, user]);

  async function handleJoin() {
    if (!clubId || !user) {
      navigate("/login");
      return;
    }
    setJoining(true);
    try {
      let displayName = user.displayName || "";
      let username = "";
      let photoURL = user.photoURL || "";

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const ud = userSnap.data() as { displayName?: string; username?: string; photoURL?: string };
          displayName = ud.displayName || displayName;
          username = ud.username || username;
          photoURL = ud.photoURL || photoURL;
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }

      await setDoc(doc(db, "clubs", clubId, "members", user.uid), {
        id: user.uid,
        displayName: displayName || user.email || "Member",
        username: username || "",
        photoURL: photoURL || "",
        points: 100,
        tier: "Free",
        subscription: "free",
        birthday: "",
        joinedAt: Date.now(),
      });

      setIsMember(true);
      setJustJoined(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1600);
    } catch (err) {
      console.error("Failed to join club:", err);
      alert("Something went wrong joining this club. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="noctu-page">
        <div className="noctu-shell">
          <p className="noctu-subtext">Loading club…</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="noctu-page">
        <div className="noctu-shell">
          <p className="noctu-subtext">Club not found.</p>
          <button className="noctu-secondary-btn" style={{ marginTop: 12 }} onClick={() => navigate("/clubs")}>
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="noctu-page" style={{ paddingBottom: 90 }}>
      <div className="noctu-shell">
        <button
          className="noctu-secondary-btn"
          style={{ width: "auto", padding: "8px 16px", marginBottom: 16 }}
          onClick={() => navigate("/clubs")}
        >
          ← Back
        </button>

        {justJoined && (
          <div
            style={{
              background: "linear-gradient(135deg, #BF00FF33, #ff6b9d33)",
              border: "1px solid #BF00FF",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
              textAlign: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            🎉 You're in! Taking you to your dashboard…
          </div>
        )}

        <div className="noctu-card">
          <img
            src={club.coverURL || club.logoURL || "/assets/noctu-logo-transparent.png"}
            alt={club.clubName || "Club"}
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 16, marginBottom: 16 }}
          />

          <h1 className="noctu-heading" style={club.primaryColor ? { color: club.primaryColor } : undefined}>{club.clubName || "Unnamed Club"}</h1>
          {(club.city || club.state) && (
            <p className="noctu-subtext" style={{ marginBottom: 10 }}>
              {[club.city, club.state].filter(Boolean).join(", ")}
            </p>
          )}

          <span className="noctu-badge" style={club.primaryColor ? { borderColor: club.primaryColor, color: club.primaryColor } : undefined}>
            Cover tonight: {club.coverPrice != null ? `$${club.coverPrice.toFixed(2)}` : "TBA"}
          </span>

          <div style={{ marginTop: 16 }}>
            {checkingMembership ? (
              <button className="noctu-secondary-btn" disabled style={{ width: "100%" }}>
                Checking…
              </button>
            ) : isMember ? (
              <button className="noctu-secondary-btn" disabled style={{ width: "100%", opacity: 0.8 }}>
                ✓ Joined
              </button>
            ) : (
              <button
                className="noctu-primary-btn"
                style={{ width: "100%" }}
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? "Joining…" : "Join Club"}
              </button>
            )}
          </div>

          <div className="noctu-divider" />

          <div className="noctu-card-title">About</div>
          <p className="noctu-subtext">{club.bio || "This club hasn't added a bio yet."}</p>

          {(club.perks?.starter || club.perks?.vip || club.perks?.elite) && (
            <>
              <div className="noctu-divider" />
              <div className="noctu-card-title">What you unlock</div>
              {club.perks?.starter && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: "#BF00FF", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>STARTER</div>
                  <p className="noctu-subtext" style={{ margin: 0 }}>{club.perks.starter}</p>
                </div>
              )}
              {club.perks?.vip && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: "#ff6b9d", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>VIP</div>
                  <p className="noctu-subtext" style={{ margin: 0 }}>{club.perks.vip}</p>
                </div>
              )}
              {club.perks?.elite && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: "#ffd700", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>ELITE</div>
                  <p className="noctu-subtext" style={{ margin: 0 }}>{club.perks.elite}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
