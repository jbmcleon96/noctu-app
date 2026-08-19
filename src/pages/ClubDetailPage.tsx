import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
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
}

export default function ClubDetailPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

        <div className="noctu-card">
          <img
            src={club.coverURL || club.logoURL || "/assets/noctu-logo-transparent.png"}
            alt={club.clubName || "Club"}
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 16, marginBottom: 16 }}
          />

          <h1 className="noctu-heading">{club.clubName || "Unnamed Club"}</h1>
          {(club.city || club.state) && (
            <p className="noctu-subtext" style={{ marginBottom: 10 }}>
              {[club.city, club.state].filter(Boolean).join(", ")}
            </p>
          )}

          <span className="noctu-badge">
            Cover tonight: {club.coverPrice != null ? `$${club.coverPrice.toFixed(2)}` : "TBA"}
          </span>

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
