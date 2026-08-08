import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/noctu-theme.css";

interface ClubListItem {
  id: string;
  clubName?: string;
  city?: string;
  state?: string;
  coverURL?: string;
  logoURL?: string;
  bio?: string;
  coverPrice?: number;
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadClubs() {
      try {
        const snap = await getDocs(collection(db, "clubs"));
        const list: ClubListItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ClubListItem, "id">),
        }));
        setClubs(list);
      } catch (err) {
        console.error("Failed to load clubs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClubs();
  }, []);

  return (
    <div className="noctu-page" style={{ paddingBottom: 90 }}>
      <div className="noctu-shell">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src="/assets/noctu-logo-transparent.png"
            alt="NOCTU"
            style={{ height: 44, marginBottom: 10 }}
          />
          <div className="noctu-eyebrow">On Noctu</div>
          <p className="noctu-subtext">Clubs live on the platform right now</p>
        </div>

        <div className="noctu-card">
          <div className="noctu-card-title">Clubs ({clubs.length})</div>

          {loading && <p className="noctu-subtext">Loading clubs…</p>}

          {!loading && clubs.length === 0 && (
            <p className="noctu-subtext">
              No clubs have signed up yet. Check back soon.
            </p>
          )}

          {!loading && clubs.length > 0 && (
            <div className="noctu-club-grid">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  className="noctu-club-card"
                  style={{ border: "1px solid rgba(191,0,255,0.22)", padding: 0 }}
                  onClick={() => navigate(`/clubs/${club.id}`)}
                >
                  <img
                    src={club.logoURL || club.coverURL || "/assets/noctu-logo-transparent.png"}
                    alt={club.clubName || "Club"}
                  />
                  <div className="club-info">
                    <div className="club-name">{club.clubName || "Unnamed Club"}</div>
                    <div className="club-meta">
                      {[club.city, club.state].filter(Boolean).join(", ") || "Location TBA"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
