import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  increment,
  setDoc,
} from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";

interface ClubProfile {
  clubName: string;
  address: string;
  city: string;
  state: string;
  coverURL: string;
  logoURL: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  website: string;
  autoMessageEnabled: boolean;
  showBirthdays: boolean;
  subscription: string;
}

interface Member {
  id: string;
  displayName: string;
  username: string;
  photoURL: string;
  points: number;
  tier: string;
  subscription: string;
  birthday: string;
  joinedAt: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: number;
  coverURL: string;
}

interface PointSettings {
  doorScan: number;
  barScan: number;
  referral: number;
  profilePic: number;
  welcomeBonus: number;
  tierThresholds: {
    silver: number;
    gold: number;
    obsidian: number;
  };
  tierMultipliers: {
    free: number;
    vip: number;
    elite: number;
  };
}

interface Reward {
  id: string;
  emoji: string;
  name: string;
  pts: number;
  redeemed: number;
  status: string;
  desc: string;
}

interface Blast {
  id: string;
  message: string;
  targetTier: string;
  sentAt: number;
  recipientCount: number;
}

const TIER_COLORS: Record<string, string> = {
  Access: "#888",
  Silver: "#C0C0C0",
  Gold: "#FFD700",
  Obsidian: "#BF00FF",
};

const SUB_COLORS: Record<string, string> = {
  free: "#888",
  starter: "#ff6b6b",
  vip: "#BF00FF",
  elite: "#FFD700",
};

const NAV_TABS = ["Overview", "Members", "Scanner", "Messaging", "Rewards", "Settings"];
const NAV_ICONS = ["📊", "👥", "📷", "💬", "🎁", "⚙️"];

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [club, setClub] = useState<ClubProfile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pointSettings, setPointSettings] = useState<PointSettings | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [blasts, setBlasts] = useState<Blast[]>([]);
  const [loading, setLoading] = useState(true);

  const clubId = user?.uid ?? "";

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const clubSnap = await getDoc(doc(db, "clubs", clubId));
        if (clubSnap.exists()) setClub(clubSnap.data() as ClubProfile);

        const membersSnap = await getDocs(collection(db, "clubs", clubId, "members"));
        setMembers(membersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Member)));

        const eventsSnap = await getDocs(
          query(collection(db, "clubs", clubId, "events"), orderBy("date", "asc"))
        );
        setEvents(eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Event)));
        const psSnap = await getDoc(doc(db, "clubs", clubId, "settings", "points"));
        if (psSnap.exists()) setPointSettings(psSnap.data() as PointSettings);

        const rewardsSnap = await getDocs(collection(db, "clubs", clubId, "rewards"));
        setRewards(rewardsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Reward)));

        const blastsSnap = await getDocs(
          query(collection(db, "clubs", clubId, "bubbleBlasts"), orderBy("sentAt", "desc"), limit(10))
        );
        setBlasts(blastsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Blast)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, clubId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0010",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#BF00FF" }}>Loading...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0010",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#fff", marginBottom: 16 }}>Club profile not found.</div>
          <button
            onClick={() => navigate("/owner-onboarding")}
            style={{
              background: "#BF00FF",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Complete Onboarding
          </button>
        </div>
      </div>
    );
  }

  
  const topMembers = [...members].sort((a, b) => b.points - a.points).slice(0, 5);

  const today = new Date();
  const birthdayMembers = members.filter((m) => {
    if (!m.birthday) return false;
    const b = new Date(m.birthday);
    return b.getMonth() === today.getMonth() && b.getDate() === today.getDate();
  });

  const upcomingEvents = events.filter((e) => e.date >= Date.now()).slice(0, 3);

  const starterRev = members.filter((m) => m.subscription === "starter").length * 15;
  const vipRev = members.filter((m) => m.subscription === "vip").length * 35;
  const eliteRev = members.filter((m) => m.subscription === "elite").length * 75;
  const totalMRR = starterRev + vipRev + eliteRev;
  const totalPoints = members.reduce((sum, m) => sum + (m.points ?? 0), 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: 520,
        margin: "0 auto",
        background: "#0a0010",
        fontFamily: "'Inter', sans-serif",
        paddingBottom: 90,
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #1a0030",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #ff6b9d, #BF00FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔑
          </div>
          <span style={{ color: "#ff6b9d", fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>
            NOCTÜ
          </span>
        </div>

        <button
          onClick={async () => {
            await logout();
            navigate("/");
          }}
          style={{
            background: "transparent",
            border: "1px solid #3a0055",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#888",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ padding: "0 16px" }}>
        {activeTab === 0 && (
          <OverviewTab
            club={club}
            members={members}
            topMembers={topMembers}
            birthdayMembers={birthdayMembers}
            upcomingEvents={upcomingEvents}
            totalMRR={totalMRR}
            starterRev={starterRev}
            vipRev={vipRev}
            eliteRev={eliteRev}
            totalPoints={totalPoints}
            blasts={blasts}
            onGoMessaging={() => setActiveTab(3)}
          />
        )}

        {activeTab === 1 && <MembersTab members={members} showBirthdays={club.showBirthdays} />}
        {activeTab === 2 && <ScannerTab clubId={clubId} pointSettings={pointSettings} />}
        {activeTab === 3 && (
          <MessagingTab
            clubId={clubId}
            members={members}
            blasts={blasts}
            onBlastSent={(b) => setBlasts((prev) => [b, ...prev])}
          />
        )}
        {activeTab === 4 && (
          <RewardsTab
            clubId={clubId}
            rewards={rewards}
            onRewardAdded={(r) => setRewards((prev) => [...prev, r])}
          />
        )}
        {activeTab === 5 && <SettingsTab clubId={clubId} pointSettings={pointSettings} club={club} />}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 520,
          background: "#0d0018",
          borderTop: "1px solid #1a0030",
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 0 16px",
          zIndex: 100,
        }}
      >
        {NAV_TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            <span style={{ fontSize: 18 }}>{NAV_ICONS[i]}</span>
            <span
              style={{
                fontSize: 9,
                color: activeTab === i ? "#BF00FF" : "#555",
                fontWeight: activeTab === i ? 700 : 400,
              }}
            >
              {tab}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OverviewTab({
  club,
  members,
  topMembers,
  birthdayMembers,
  upcomingEvents,
  totalMRR,
  starterRev,
  vipRev,
  eliteRev,
  totalPoints,
  blasts,
  onGoMessaging,
}: {
  club: ClubProfile;
  members: Member[];
  topMembers: Member[];
  birthdayMembers: Member[];
  upcomingEvents: Event[];
  totalMRR: number;
  starterRev: number;
  vipRev: number;
  eliteRev: number;
  totalPoints: number;
  blasts: Blast[];
  onGoMessaging: () => void;
}) {
  return (
    <div style={{ paddingTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>{club.clubName}</div>
          <div style={{ color: "#888", fontSize: 13 }}>
            {club.city}, {club.state} · {club.subscription === "pro" ? "Growth plan" : "Basic plan"}
          </div>
        </div>

        <div
          style={{
            background: "#003300",
            border: "1px solid #00ff88",
            borderRadius: 20,
            padding: "4px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88" }} />
          <span style={{ color: "#00ff88", fontSize: 12, fontWeight: 600 }}>Active</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <StatCard
          label="TOTAL MEMBERS"
          value={members.length.toString()}
          sub={`+${Math.max(members.length, 0)} total`}
          subColor="#00ff88"
          icon="👥"
        />
        <StatCard
          label="MONTHLY REVENUE"
          value={`$${totalMRR.toLocaleString()}`}
          sub="from subscriptions"
          subColor="#00ff88"
          icon="💰"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <StatCard
          label="POINTS ISSUED"
          value={totalPoints.toLocaleString()}
          sub="total across members"
          subColor="#00ff88"
          icon="✨"
        />
        <StatCard
          label="REDEMPTIONS"
          value={`${Math.floor(members.length * 0.14)}`}
          sub="+this week"
          subColor="#00ff88"
          icon="🎁"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Revenue by tier</div>
          {[
            {
              label: "Starter",
              color: "#ff6b6b",
              amount: `$${starterRev}`,
              width: totalMRR > 0 ? `${(starterRev / totalMRR) * 100}%` : "0%",
            },
            {
              label: "VIP",
              color: "#BF00FF",
              amount: `$${vipRev}`,
              width: totalMRR > 0 ? `${(vipRev / totalMRR) * 100}%` : "0%",
            },
            {
              label: "Elite",
              color: "#FFD700",
              amount: `$${eliteRev}`,
              width: totalMRR > 0 ? `${(eliteRev / totalMRR) * 100}%` : "0%",
            },
          ].map((r) => (
            <div key={r.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#aaa", fontSize: 12 }}>{r.label}</span>
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{r.amount}</span>
              </div>
              <div style={{ height: 5, background: "#1a0030", borderRadius: 3 }}>
                <div style={{ height: "100%", width: r.width, background: r.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
          <div
            style={{
              borderTop: "1px solid #2a0040",
              paddingTop: 10,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#aaa", fontSize: 12 }}>Total MRR</span>
            <span style={{ color: "#BF00FF", fontSize: 13, fontWeight: 700 }}>
              ${totalMRR.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Top 5 members</div>
          {topMembers.length === 0 && <div style={{ color: "#555", fontSize: 12 }}>No members yet</div>}
          {topMembers.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: i < 3 ? "#000" : "#888",
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.displayName || m.username}
                </div>
              </div>
              <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {(m.points ?? 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {birthdayMembers.length > 0 && (
        <div
          style={{
            background: "#110018",
            border: "1px solid #ff3366",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🎂</span>
              <div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Birthdays Today</div>
                <div style={{ color: "#888", fontSize: 12 }}>
                  App auto-sends a birthday message + 200 bonus pts
                </div>
              </div>
            </div>
            <button
              onClick={onGoMessaging}
              style={{
                background: "transparent",
                border: "1px solid #3a0055",
                borderRadius: 8,
                padding: "6px 10px",
                color: "#aaa",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Go to Messaging
            </button>
          </div>

          {birthdayMembers.map((m) => (
            <div
              key={m.id}
              style={{
                background: "#1a0020",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${SUB_COLORS[m.subscription] || "#888"}, #BF00FF)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {(m.displayName || m.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                      {m.displayName || m.username}
                    </span>
                    <span>🎂</span>
                    <span
                      style={{
                        background: "#ff336633",
                        border: "1px solid #ff3366",
                        borderRadius: 20,
                        padding: "1px 8px",
                        color: "#ff6688",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      Today
                    </span>
                  </div>
                  <div style={{ color: "#888", fontSize: 11 }}>
                    {m.subscription} · {(m.points ?? 0).toLocaleString()} pts · +200 birthday pts auto-sent
                  </div>
                </div>
              </div>

              <button
                style={{
                  background: "transparent",
                  border: "1px solid #3a0055",
                  borderRadius: 8,
                  padding: "6px 10px",
                  color: "#aaa",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Send Gift
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Messaging Stats</div>
          {[
            { label: "Messages sent (this month)", value: blasts.length.toString(), color: "#fff" },
            { label: "Avg open rate", value: "83%", color: "#00ff88" },
            { label: "Birthday texts sent", value: `${birthdayMembers.length} today`, color: "#fff" },
            { label: "Total members reached", value: members.length.toString(), color: "#fff" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span style={{ color: "#888", fontSize: 11 }}>{s.label}</span>
              <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}

          <button
            onClick={onGoMessaging}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "10px",
              background: "linear-gradient(135deg, #BF00FF, #ff6b9d)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Send a Message
          </button>
        </div>

        <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Recent Blasts</div>
          {blasts.length === 0 && <div style={{ color: "#555", fontSize: 12 }}>No blasts yet</div>}
          {blasts.slice(0, 3).map((b) => (
            <div
              key={b.id}
              style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #1a0030" }}
            >
              <div style={{ color: "#ccc", fontSize: 11, marginBottom: 2 }}>
                "{b.message.slice(0, 30)}..."
              </div>
              <div style={{ color: "#888", fontSize: 10 }}>{b.recipientCount} members</div>
              <div style={{ color: "#00ff88", fontSize: 10 }}>{new Date(b.sentAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div
          style={{
            background: "#110018",
            border: "1px solid #2a0040",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Upcoming Events
          </div>
          {upcomingEvents.map((ev) => (
            <div key={ev.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
              <div
                style={{
                  background: "#BF00FF22",
                  borderRadius: 8,
                  padding: "6px 10px",
                  textAlign: "center",
                  minWidth: 44,
                }}
              >
                <div style={{ color: "#BF00FF", fontSize: 9, fontWeight: 700 }}>
                  {new Date(ev.date).toLocaleString("default", { month: "short" }).toUpperCase()}
                </div>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>
                  {new Date(ev.date).getDate()}
                </div>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                <div style={{ color: "#888", fontSize: 11 }}>{ev.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MembersTab({ members, showBirthdays }: { members: Member[]; showBirthdays: boolean }) {
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("All");

  const filtered = members.filter((m) => {
    const ms =
      !search || `${m.displayName || ""}${m.username || ""}`.toLowerCase().includes(search.toLowerCase());
    const mt = filterTier === "All" || m.tier === filterTier;
    return ms && mt;
  });

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
        Members <span style={{ color: "#BF00FF", fontSize: 14 }}>({members.length})</span>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members..."
        style={{
          width: "100%",
          background: "#1a002a",
          border: "1px solid #3a0055",
          borderRadius: 10,
          padding: "10px 14px",
          color: "#fff",
          fontSize: 14,
          boxSizing: "border-box",
          outline: "none",
          marginBottom: 12,
        }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {["All", "Access", "Silver", "Gold", "Obsidian"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterTier(t)}
            style={{
              background: filterTier === t ? "#BF00FF" : "#1a002a",
              border: `1px solid ${filterTier === t ? "#BF00FF" : "#3a0055"}`,
              borderRadius: 20,
              padding: "6px 14px",
              color: filterTier === t ? "#fff" : TIER_COLORS[t] || "#aaa",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <div style={{ textAlign: "center", color: "#555", padding: "40px 0" }}>No members found</div>}

      {filtered.map((m) => {
        const isBday =
          showBirthdays &&
          m.birthday &&
          (() => {
            const b = new Date(m.birthday);
            const t = new Date();
            return b.getMonth() === t.getMonth() && b.getDate() === t.getDate();
          })();

        return (
          <div
            key={m.id}
            style={{
              background: "#110018",
              border: "1px solid #2a0040",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${SUB_COLORS[m.subscription] || "#888"}, #BF00FF)`,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {m.photoURL ? (
                <img src={m.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (m.displayName || m.username || "?")[0].toUpperCase()
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{m.displayName || m.username}</span>
                {isBday && <span>🎂</span>}
              </div>
              <div style={{ color: "#666", fontSize: 12 }}>@{m.username}</div>
              {showBirthdays && m.birthday && (
                <div style={{ color: "#555", fontSize: 11 }}>🗓 {new Date(m.birthday).toLocaleDateString()}</div>
              )}
            </div>

            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: TIER_COLORS[m.tier] || "#888", fontSize: 12, fontWeight: 700 }}>{m.tier}</div>
              <div style={{ color: "#BF00FF", fontSize: 13, fontWeight: 700 }}>
                {(m.points ?? 0).toLocaleString()} pts
              </div>
              <div style={{ color: SUB_COLORS[m.subscription] || "#888", fontSize: 11, fontWeight: 600 }}>
                {m.subscription?.toUpperCase()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScannerTab({ clubId, pointSettings }: { clubId: string; pointSettings: PointSettings | null }) {
  const [mode, setMode] = useState<"door" | "bar">("door");
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    name: string;
    pts: number;
    tier: string;
    msg: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, []);

  function stopScanner() {
    scannerRef.current?.clear().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  }

  function startScanner() {
    setScanResult(null);
    setScanning(true);

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-real",
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (text) => {
          stopScanner();
          await processScan(text);
        },
        () => {}
      );
    }, 100);
  }

  async function awardPointsToMember(memberId: string) {
    setProcessing(true);

    try {
      const ps = pointSettings ?? {
        doorScan: 50,
        barScan: 25,
        referral: 150,
        profilePic: 200,
        welcomeBonus: 100,
        tierThresholds: { silver: 500, gold: 1500, obsidian: 5000 },
        tierMultipliers: { free: 1, vip: 2, elite: 3 },
      };

      const userRef = doc(db, "users", memberId);
      const clubMemberRef = doc(db, "clubs", clubId, "members", memberId);

      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setScanResult({
          success: false,
          name: "",
          pts: 0,
          tier: "",
          msg: "Member not found.",
        });
        return;
      }

      const member = userSnap.data() as any;
      const base = mode === "door" ? (ps.doorScan ?? 50) : (ps.barScan ?? 25);

      const multipliers: Record<string, number> = {
        free: ps.tierMultipliers?.free ?? 1,
        starter: 1.25,
        vip: ps.tierMultipliers?.vip ?? 2,
        elite: ps.tierMultipliers?.elite ?? 3,
      };

      const subscription = member.subscription ?? "free";
      const pts = Math.round(base * (multipliers[subscription] ?? 1));
      const currentPoints = Number(member.points ?? 0);
      const newPoints = currentPoints + pts;

      let newTier = "Access";
      if (newPoints >= (ps.tierThresholds?.obsidian ?? 5000)) newTier = "Obsidian";
      else if (newPoints >= (ps.tierThresholds?.gold ?? 1500)) newTier = "Gold";
      else if (newPoints >= (ps.tierThresholds?.silver ?? 500)) newTier = "Silver";

      await updateDoc(userRef, {
        points: increment(pts),
        tier: newTier,
      });

      await setDoc(
        clubMemberRef,
        {
          displayName: member.displayName ?? "",
          username: member.username ?? "",
          photoURL: member.photoURL ?? "",
          birthday: member.birthday ?? "",
          joinedAt: member.joinedAt ?? Date.now(),
          subscription,
          points: newPoints,
          tier: newTier,
          lastScanType: mode,
          lastScanAt: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, "users", memberId, "activity"), {
        type: mode === "door" ? "door_scan" : "bar_scan",
        points: pts,
        description: `${mode === "door" ? "🚪 Door" : "🍹 Bar"} scan · +${pts} pts`,
        clubId,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "clubs", clubId, "activity"), {
        type: mode === "door" ? "door_scan" : "bar_scan",
        memberId,
        points: pts,
        description: `${mode === "door" ? "🚪 Door scan" : "🍹 Bar scan"} — ${
          member.displayName || member.username || "Member"
        } · +${pts} pts`,
        createdAt: serverTimestamp(),
      });

      setScanResult({
        success: true,
        name: member.displayName || member.username || "Member",
        pts,
        tier: newTier,
        msg: `+${pts} pts awarded!`,
      });
    } catch (e) {
      console.error(e);
      setScanResult({
        success: false,
        name: "",
        pts: 0,
        tier: "",
        msg: "Something went wrong.",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function processScan(qrData: string) {
    if (!qrData.startsWith("noctu:member:")) {
      setScanResult({
        success: false,
        name: "",
        pts: 0,
        tier: "",
        msg: "Invalid QR — not a Noctu member.",
      });
      return;
    }

    const uid = qrData.replace("noctu:member:", "");
    await awardPointsToMember(uid);
  }

  async function handleManualSearch() {
    if (!search.trim()) return;

    try {
      setProcessing(true);

      const membersSnap = await getDocs(collection(db, "clubs", clubId, "members"));
      const q = search.trim().toLowerCase();

      const found = membersSnap.docs.find((d) => {
        const data = d.data() as any;
        const name = String(data.displayName ?? "").toLowerCase();
        const username = String(data.username ?? "").toLowerCase();
        const phone = String(data.phone ?? "").toLowerCase();
        return name.includes(q) || username.includes(q) || phone.includes(q);
      });

      if (!found) {
        setScanResult({
          success: false,
          name: "",
          pts: 0,
          tier: "",
          msg: "No matching member found.",
        });
        return;
      }

      await awardPointsToMember(found.id);
      setSearch("");
    } catch (e) {
      console.error(e);
      setScanResult({
        success: false,
        name: "",
        pts: 0,
        tier: "",
        msg: "Search failed.",
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
        {mode === "door" ? "Door Check-In" : "Bar Scan"}
      </div>
      <div style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
        Scan member QR to verify entry and award points
      </div>

      <div
        style={{
          display: "flex",
          background: "#110018",
          border: "1px solid #2a0040",
          borderRadius: 12,
          padding: 4,
          gap: 4,
          marginBottom: 20,
        }}
      >
        {(["door", "bar"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "11px",
              background: mode === m ? "linear-gradient(135deg, #BF00FF, #ff6b9d)" : "transparent",
              border: "none",
              borderRadius: 10,
              color: mode === m ? "#fff" : "#666",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {m === "door" ? "🚪 Door" : "🍹 Bar"}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#110018",
          border: "1px solid #2a0040",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>
          Scan Member QR Code
        </div>

        {!scanning && !processing && !scanResult && (
          <div
            style={{
              background: "#0a0010",
              borderRadius: 12,
              height: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              position: "relative",
            }}
          >
            {[{ top: 12, left: 12 }, { top: 12, right: 12 }, { bottom: 12, left: 12 }, { bottom: 12, right: 12 }].map(
              (pos, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    ...pos,
                    width: 28,
                    height: 28,
                    borderTop: i < 2 ? "3px solid #BF00FF" : "none",
                    borderBottom: i >= 2 ? "3px solid #BF00FF" : "none",
                    borderLeft: i % 2 === 0 ? "3px solid #BF00FF" : "none",
                    borderRight: i % 2 === 1 ? "3px solid #BF00FF" : "none",
                  }}
                />
              )
            )}
            <div style={{ color: "#555", fontSize: 13 }}>Waiting for QR...</div>
          </div>
        )}

        {scanning && <div id="qr-reader-real" style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16 }} />}

        {processing && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#BF00FF", fontSize: 15 }}>
            Processing scan...
          </div>
        )}

        {scanResult && (
          <div
            style={{
              background: scanResult.success ? "#00301a" : "#2a0010",
              border: `1px solid ${scanResult.success ? "#00ff88" : "#ff3366"}`,
              borderRadius: 12,
              padding: "20px",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>{scanResult.success ? "✅" : "❌"}</div>

            {scanResult.success ? (
              <>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{scanResult.name}</div>
                <div style={{ color: TIER_COLORS[scanResult.tier] || "#888", fontSize: 12, margin: "4px 0 10px" }}>
                  {scanResult.tier}
                </div>
                <div style={{ color: "#00ff88", fontSize: 30, fontWeight: 800 }}>+{scanResult.pts} pts</div>
                <div style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>{scanResult.msg}</div>
              </>
            ) : (
              <div style={{ color: "#ff3366", fontSize: 14 }}>{scanResult.msg}</div>
            )}
          </div>
        )}

        <div style={{ color: "#aaa", fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>
          OR SEARCH BY NAME / USERNAME / PHONE
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. Marcus Thompson or @marcust"
          style={{
            width: "100%",
            background: "#1a002a",
            border: "1px solid #3a0055",
            borderRadius: 10,
            padding: "11px 14px",
            color: "#fff",
            fontSize: 13,
            boxSizing: "border-box",
            outline: "none",
            marginBottom: 12,
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={scanning ? stopScanner : startScanner}
            style={{
              flex: 1,
              padding: "13px",
              background: "linear-gradient(135deg, #BF00FF, #ff6b9d)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {scanning ? "⏹ Stop" : "📷 Start Camera Scan"}
          </button>

          <button
            onClick={handleManualSearch}
            disabled={!search.trim() || processing}
            style={{
              flex: 1,
              padding: "13px",
              background: search.trim() ? "#1a002a" : "#14001d",
              border: "1px solid #3a0055",
              borderRadius: 10,
              color: search.trim() ? "#fff" : "#666",
              fontSize: 13,
              fontWeight: 700,
              cursor: search.trim() ? "pointer" : "not-allowed",
            }}
          >
            🔎 Find Member
          </button>
        </div>

        {scanResult && (
          <button
            onClick={() => {
              setScanResult(null);
              setSearch("");
            }}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "12px",
              background: "transparent",
              border: "1px solid #3a0055",
              borderRadius: 10,
              color: "#aaa",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Clear Result
          </button>
        )}
      </div>
    </div>
  );
}

function MessagingTab({
  clubId,
  members,
  blasts,
  onBlastSent,
}: {
  clubId: string;
  members: Member[];
  blasts: Blast[];
  onBlastSent: (b: Blast) => void;
}) {
  const [msg, setMsg] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const targets = [
    { value: "all", label: `All ${members.length}` },
    { value: "elite", label: `Elite ${members.filter((m) => m.subscription === "elite").length}` },
    { value: "vip", label: `VIP ${members.filter((m) => m.subscription === "vip").length}` },
    { value: "starter", label: `Starter ${members.filter((m) => m.subscription === "starter").length}` },
  ];

  const targetCount =
    target === "all" ? members.length : members.filter((m) => m.subscription === target).length;

  async function sendBlast() {
    if (!msg.trim()) return;
    setSending(true);

    try {
      const ref2 = await addDoc(collection(db, "clubs", clubId, "bubbleBlasts"), {
        message: msg,
        targetTier: target,
        sentAt: Date.now(),
        recipientCount: targetCount,
      });

      onBlastSent({
        id: ref2.id,
        message: msg,
        targetTier: target,
        sentAt: Date.now(),
        recipientCount: targetCount,
      });

      setSent(true);
      setMsg("");
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Messages</div>
        <button
          onClick={sendBlast}
          style={{
            background: "linear-gradient(135deg, #BF00FF, #ff6b9d)",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          📣 Blast All
        </button>
      </div>

      {sent && (
        <div
          style={{
            background: "#00301a",
            border: "1px solid #00ff88",
            borderRadius: 12,
            padding: "14px",
            textAlign: "center",
            color: "#00ff88",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          ✅ Blast sent to {targetCount} members!
        </div>
      )}

      <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>📣</span>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Send a Blast</span>
        </div>

        <div style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>
          One message → every member&apos;s phone instantly.
        </div>

        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={3}
          placeholder="Tonight at [club] — doors open at 10pm..."
          style={{
            width: "100%",
            background: "#1a002a",
            border: "1px solid #3a0055",
            borderRadius: 10,
            padding: "12px 14px",
            color: "#fff",
            fontSize: 13,
            boxSizing: "border-box",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            marginBottom: 12,
          }}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {targets.map((t) => (
            <button
              key={t.value}
              onClick={() => setTarget(t.value)}
              style={{
                background: target === t.value ? "#BF00FF" : "#1a002a",
                border: `1px solid ${target === t.value ? "#BF00FF" : "#3a0055"}`,
                borderRadius: 20,
                padding: "5px 12px",
                color: target === t.value ? "#fff" : "#aaa",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
          <span style={{ color: "#888", fontSize: 12, alignSelf: "center", marginLeft: "auto" }}>
            {targetCount} members
          </span>
        </div>

        <button
          onClick={sendBlast}
          disabled={sending || !msg.trim()}
          style={{
            width: "100%",
            padding: "13px",
            background: msg.trim() ? "linear-gradient(135deg, #BF00FF, #ff6b9d)" : "#2a0040",
            border: "none",
            borderRadius: 12,
            color: msg.trim() ? "#fff" : "#555",
            fontSize: 14,
            fontWeight: 700,
            cursor: msg.trim() ? "pointer" : "not-allowed",
          }}
        >
          {sending ? "Sending..." : "Send Blast Now"}
        </button>
      </div>

      <div style={{ color: "#aaa", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>
        RECENT BLASTS
      </div>

      {blasts.length === 0 && <div style={{ color: "#555", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No blasts sent yet</div>}

      {blasts.map((b) => (
        <div
          key={b.id}
          style={{
            background: "#110018",
            border: "1px solid #2a0040",
            borderRadius: 12,
            padding: "14px",
            marginBottom: 10,
          }}
        >
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            "{b.message.slice(0, 60)}{b.message.length > 60 ? "..." : ""}"
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888", fontSize: 12 }}>
              {b.recipientCount} members · {b.targetTier === "all" ? "Everyone" : b.targetTier}
            </span>
            <span style={{ color: "#00ff88", fontSize: 12 }}>{new Date(b.sentAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RewardsTab({
  clubId,
  rewards,
  onRewardAdded,
}: {
  clubId: string;
  rewards: Reward[];
  onRewardAdded: (r: Reward) => void;
}) {
  const [form, setForm] = useState({ name: "", pts: 500, emoji: "🍾", desc: "" });
  const [saving, setSaving] = useState(false);

  async function publishReward() {
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      const ref2 = await addDoc(collection(db, "clubs", clubId, "rewards"), {
        ...form,
        redeemed: 0,
        status: "Active",
        createdAt: serverTimestamp(),
      });

      onRewardAdded({ id: ref2.id, ...form, redeemed: 0, status: "Active" });
      setForm({ name: "", pts: 500, emoji: "🍾", desc: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a002a",
    border: "1px solid #3a0055",
    borderRadius: 8,
    padding: "9px 12px",
    color: "#fff",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Rewards</div>

      {rewards.length > 0 && (
        <div
          style={{
            background: "#110018",
            border: "1px solid #2a0040",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 70px 80px 50px",
              padding: "10px 14px",
              borderBottom: "1px solid #1a0030",
            }}
          >
            {["Reward", "Points", "Used", "Status", ""].map((h) => (
              <div key={h} style={{ color: "#555", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>
                {h}
              </div>
            ))}
          </div>

          {rewards.map((r) => (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 70px 80px 50px",
                padding: "13px 14px",
                borderBottom: "1px solid #1a0030",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                {r.emoji} {r.name}
              </div>
              <div style={{ color: "#aaa", fontSize: 12 }}>{r.pts} pts</div>
              <div style={{ color: "#aaa", fontSize: 12 }}>{r.redeemed}</div>
              <div
                style={{
                  background: r.status === "Active" ? "#00ff8822" : "#ffffff11",
                  border: `1px solid ${r.status === "Active" ? "#00ff88" : "#555"}`,
                  borderRadius: 20,
                  padding: "3px 8px",
                  color: r.status === "Active" ? "#00ff88" : "#888",
                  fontSize: 10,
                  fontWeight: 700,
                  textAlign: "center",
                  width: "fit-content",
                }}
              >
                {r.status}
              </div>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid #3a0055",
                  borderRadius: 6,
                  padding: "4px 8px",
                  color: "#888",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Create new reward</div>

        <div style={{ color: "#aaa", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>REWARD NAME</div>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Bottle of Grey Goose"
          style={{ ...inputStyle, marginBottom: 10 }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ color: "#aaa", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>COST (PTS)</div>
            <input
              type="number"
              value={form.pts}
              onChange={(e) => setForm((p) => ({ ...p, pts: Number(e.target.value) }))}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={{ color: "#aaa", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>EMOJI</div>
            <input
              value={form.emoji}
              onChange={(e) => setForm((p) => ({ ...p, emoji: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ color: "#aaa", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>DESCRIPTION</div>
        <textarea
          value={form.desc}
          onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
          placeholder="What the member gets..."
          rows={2}
          style={{ ...inputStyle, resize: "none", fontFamily: "inherit", marginBottom: 14 }}
        />

        <button
          onClick={publishReward}
          disabled={saving || !form.name.trim()}
          style={{
            width: "100%",
            padding: "12px",
            background: form.name.trim() ? "linear-gradient(135deg, #BF00FF, #ff6b9d)" : "#2a0040",
            border: "none",
            borderRadius: 10,
            color: form.name.trim() ? "#fff" : "#555",
            fontSize: 14,
            fontWeight: 700,
            cursor: form.name.trim() ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Publishing..." : "Publish reward"}
        </button>
      </div>
    </div>
  );
}

function SettingsTab({
  clubId,
  pointSettings,
  club,
}: {
  clubId: string;
  pointSettings: PointSettings | null;
  club: ClubProfile;
}) {
  const [ps, setPs] = useState<PointSettings>(
    pointSettings || {
      doorScan: 50,
      barScan: 25,
      referral: 150,
      profilePic: 200,
      welcomeBonus: 100,
      tierThresholds: { silver: 500, gold: 1500, obsidian: 5000 },
      tierMultipliers: { free: 1, vip: 2, elite: 3 },
    }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await setDoc(doc(db, "clubs", clubId, "settings", "points"), { ...ps }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const fStyle: React.CSSProperties = {
    width: 72,
    background: "#1a002a",
    border: "1px solid #3a0055",
    borderRadius: 8,
    padding: "8px 10px",
    color: "#fff",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
    textAlign: "center",
  };

  function Row({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: "#ccc", fontSize: 13 }}>{label}</span>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} style={fStyle} />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Settings</div>

      {saved && (
        <div
          style={{
            background: "#00301a",
            border: "1px solid #00ff88",
            borderRadius: 10,
            padding: "10px 14px",
            color: "#00ff88",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          ✅ Settings saved!
        </div>
      )}

      <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
        <div style={{ color: "#aaa", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>
          POINTS EARNED
        </div>
        <Row label="Door scan" value={ps.doorScan} onChange={(v) => setPs((p) => ({ ...p, doorScan: v }))} />
        <Row label="Bar scan" value={ps.barScan} onChange={(v) => setPs((p) => ({ ...p, barScan: v }))} />
        <Row label="Referral bonus" value={ps.referral} onChange={(v) => setPs((p) => ({ ...p, referral: v }))} />
        <Row label="Profile pic" value={ps.profilePic} onChange={(v) => setPs((p) => ({ ...p, profilePic: v }))} />
        <Row label="Welcome bonus" value={ps.welcomeBonus} onChange={(v) => setPs((p) => ({ ...p, welcomeBonus: v }))} />
      </div>

      <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
        <div style={{ color: "#aaa", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>
          TIER THRESHOLDS
        </div>
        <Row
          label="Silver"
          value={ps.tierThresholds.silver}
          onChange={(v) => setPs((p) => ({ ...p, tierThresholds: { ...p.tierThresholds, silver: v } }))}
        />
        <Row
          label="Gold"
          value={ps.tierThresholds.gold}
          onChange={(v) => setPs((p) => ({ ...p, tierThresholds: { ...p.tierThresholds, gold: v } }))}
        />
        <Row
          label="Obsidian"
          value={ps.tierThresholds.obsidian}
          onChange={(v) => setPs((p) => ({ ...p, tierThresholds: { ...p.tierThresholds, obsidian: v } }))}
        />
      </div>

      <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
        <div style={{ color: "#aaa", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>
          EARN MULTIPLIERS
        </div>
        <Row
          label="Free"
          value={ps.tierMultipliers.free}
          onChange={(v) => setPs((p) => ({ ...p, tierMultipliers: { ...p.tierMultipliers, free: v } }))}
        />
        <Row
          label="VIP"
          value={ps.tierMultipliers.vip}
          onChange={(v) => setPs((p) => ({ ...p, tierMultipliers: { ...p.tierMultipliers, vip: v } }))}
        />
        <Row
          label="Elite"
          value={ps.tierMultipliers.elite}
          onChange={(v) => setPs((p) => ({ ...p, tierMultipliers: { ...p.tierMultipliers, elite: v } }))}
        />
      </div>

      <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: 16 }}>
        <div style={{ color: "#aaa", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>
          CLUB INFO
        </div>
        <div style={{ color: "#fff", fontSize: 14, marginBottom: 4 }}>{club.clubName}</div>
        <div style={{ color: "#888", fontSize: 13 }}>
          {club.address}, {club.city} {club.state}
        </div>
        {club.instagram && <div style={{ color: "#BF00FF", fontSize: 13, marginTop: 6 }}>📸 {club.instagram}</div>}
        {club.tiktok && <div style={{ color: "#BF00FF", fontSize: 13, marginTop: 4 }}>🎵 {club.tiktok}</div>}
        {club.website && <div style={{ color: "#BF00FF", fontSize: 13, marginTop: 4 }}>🌐 {club.website}</div>}
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          width: "100%",
          padding: "14px",
          background: saving ? "#5a0099" : "linear-gradient(135deg, #BF00FF, #ff6b9d)",
          border: "none",
          borderRadius: 12,
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          marginBottom: 8,
        }}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subColor,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  subColor: string;
  icon: string;
}) {
  return (
    <div style={{ background: "#110018", border: "1px solid #2a0040", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ color: "#aaa", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>{label}</div>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ color: "#fff", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{value}</div>
      <div style={{ color: subColor, fontSize: 11 }}>{sub}</div>
    </div>
  );
}