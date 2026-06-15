import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { db, storage } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const STEPS = ["Club Info", "Location", "Socials", "Settings", "Done"];

export default function OwnerOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Club Info
  const [clubName, setClubName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Step 2 — Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Step 3 — Socials
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");

  // Step 4 — Settings
  const [autoMessage, setAutoMessage] = useState(false);
  const [autoMessageText, setAutoMessageText] = useState("Welcome to the club! 🎉 Start earning points tonight.");
  const [showBirthdays, setShowBirthdays] = useState(true);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      let coverURL = "";
      let logoURL = "";

      if (coverFile) {
        const coverRef = ref(storage, `clubs/${user.uid}/cover`);
        await uploadBytes(coverRef, coverFile);
        coverURL = await getDownloadURL(coverRef);
      }
      if (logoFile) {
        const logoRef = ref(storage, `clubs/${user.uid}/logo`);
        await uploadBytes(logoRef, logoFile);
        logoURL = await getDownloadURL(logoRef);
      }

      const clubId = user.uid;
      await setDoc(doc(db, "clubs", clubId), {
        ownerId: user.uid,
        ownerEmail: user.email,
        clubName,
        address,
        city,
        state,
        zip,
        instagram,
        tiktok,
        twitter,
        website,
        coverURL,
        logoURL,
        autoMessageEnabled: autoMessage,
        autoMessageText: autoMessage ? autoMessageText : "",
        showBirthdays,
        subscription: "basic",
        createdAt: serverTimestamp(),
      });

      // Default point settings
      await setDoc(doc(db, "clubs", clubId, "settings", "points"), {
        doorScan: 50,
        barScan: 25,
        referral: 150,
        profilePic: 200,
        welcomeBonus: 100,
        tierThresholds: { silver: 500, gold: 1500, obsidian: 5000 },
        tierMultipliers: { free: 1, vip: 2, elite: 3 },
      });

      navigate("/owner-dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a002a",
    border: "1px solid #3a0055",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#fff",
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    color: "#aaa",
    fontSize: 12,
    display: "block",
    marginBottom: 6,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08000F",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#BF00FF", letterSpacing: 4 }}>NOCTU</div>
        <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>Set up your club</div>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: i <= step ? "#BF00FF" : "#2a0040",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}>{i + 1}</div>
            <div style={{ color: i === step ? "#BF00FF" : "#555", fontSize: 10, whiteSpace: "nowrap" }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "#110018",
        border: "1px solid #2a0040",
        borderRadius: 16,
        padding: "28px 24px",
      }}>
        {error && (
          <div style={{
            background: "#2a0010", border: "1px solid #ff3366",
            borderRadius: 8, padding: "10px 14px",
            color: "#ff3366", fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        {/* STEP 0 — Club Info */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Club Info</h3>
            <div>
              <label style={labelStyle}>CLUB NAME</label>
              <input style={inputStyle} value={clubName} onChange={e => setClubName(e.target.value)} placeholder="e.g. Club Onyx" />
            </div>

            {/* Cover Photo */}
            <div>
              <label style={labelStyle}>COVER PHOTO</label>
              <label style={{
                display: "block",
                width: "100%",
                height: 120,
                background: coverPreview ? "none" : "#1a002a",
                border: "2px dashed #3a0055",
                borderRadius: 10,
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
              }}>
                {coverPreview
                  ? <img src={coverPreview} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#555" }}>
                      <div style={{ fontSize: 28 }}>📸</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Tap to upload cover photo</div>
                    </div>
                }
                <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
              </label>
            </div>

            {/* Logo */}
            <div>
              <label style={labelStyle}>CLUB LOGO (optional)</label>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: logoPreview ? "none" : "#1a002a",
                  border: "2px dashed #3a0055",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#555",
                  fontSize: 22,
                  flexShrink: 0,
                }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : "🏛️"
                  }
                </div>
                <div style={{ color: "#BF00FF", fontSize: 13 }}>Upload Logo</div>
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
              </label>
            </div>
          </div>
        )}

        {/* STEP 1 — Location */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Location</h3>
            <div>
              <label style={labelStyle}>STREET ADDRESS</label>
              <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>CITY</label>
                <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Miami" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>STATE</label>
                <input style={inputStyle} value={state} onChange={e => setState(e.target.value)} placeholder="FL" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>ZIP</label>
                <input style={inputStyle} value={zip} onChange={e => setZip(e.target.value)} placeholder="33024" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Socials */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Social Media</h3>
            <div>
              <label style={labelStyle}>INSTAGRAM</label>
              <input style={inputStyle} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@clubonyx" />
            </div>
            <div>
              <label style={labelStyle}>TIKTOK</label>
              <input style={inputStyle} value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@clubonyx" />
            </div>
            <div>
              <label style={labelStyle}>TWITTER / X</label>
              <input style={inputStyle} value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@clubonyx" />
            </div>
            <div>
              <label style={labelStyle}>WEBSITE</label>
              <input style={inputStyle} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://clubonyx.com" />
            </div>
          </div>
        )}

        {/* STEP 3 — Settings */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Club Settings</h3>

            {/* Auto Message Toggle */}
            <div style={{
              background: "#1a002a",
              border: "1px solid #3a0055",
              borderRadius: 12,
              padding: "16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Auto Welcome Message</div>
                  <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>Automatically msg new members when they join</div>
                </div>
                <div
                  onClick={() => setAutoMessage(!autoMessage)}
                  style={{
                    width: 46,
                    height: 26,
                    borderRadius: 13,
                    background: autoMessage ? "#BF00FF" : "#333",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: 3,
                    left: autoMessage ? 23 : 3,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                  }} />
                </div>
              </div>
              {autoMessage && (
                <textarea
                  value={autoMessageText}
                  onChange={e => setAutoMessageText(e.target.value)}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  placeholder="Type your welcome message..."
                />
              )}
            </div>

            {/* Birthday Toggle */}
            <div style={{
              background: "#1a002a",
              border: "1px solid #3a0055",
              borderRadius: 12,
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Member Birthdays</div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>See member birthdays in your dashboard</div>
              </div>
              <div
                onClick={() => setShowBirthdays(!showBirthdays)}
                style={{
                  width: 46,
                  height: 26,
                  borderRadius: 13,
                  background: showBirthdays ? "#BF00FF" : "#333",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 3,
                  left: showBirthdays ? 23 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Done */}
        {step === 4 && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You're all set!</h3>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
              Your club profile is ready. Head to your dashboard to start managing members, events, and rewards.
            </p>
            <button
              onClick={handleFinish}
              disabled={saving}
              style={{
                width: "100%",
                padding: "14px",
                background: saving ? "#5a0099" : "#BF00FF",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Launch My Dashboard →"}
            </button>
          </div>
        )}

        {/* Nav buttons */}
        {step < 4 && (
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: "transparent",
                  border: "1px solid #3a0055",
                  borderRadius: 10,
                  color: "#aaa",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >Back</button>
            )}
            <button
              onClick={() => {
                if (step === 0 && !clubName.trim()) {
                  setError("Please enter your club name.");
                  return;
                }
                setError("");
                setStep(s => s + 1);
              }}
              style={{
                flex: 2,
                padding: "13px",
                background: "#BF00FF",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {step === 3 ? "Review & Finish" : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
