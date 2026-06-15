import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function OwnerSignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, "owner");
      navigate("/owner-onboarding");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

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
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#BF00FF", letterSpacing: 4 }}>NOCTU</div>
        <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>Club Owner Portal</div>
      </div>

      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#110018",
        border: "1px solid #2a0040",
        borderRadius: 16,
        padding: "32px 24px",
      }}>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>
          Create Club Account
        </h2>
        <p style={{ color: "#888", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
          Set up your club's presence on Noctu
        </p>

        {error && (
          <div style={{
            background: "#2a0010",
            border: "1px solid #ff3366",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#ff3366",
            fontSize: 13,
            marginBottom: 16,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="owner@yourclub.com"
              style={{
                width: "100%",
                background: "#1a002a",
                border: "1px solid #3a0055",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#fff",
                fontSize: 15,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                background: "#1a002a",
                border: "1px solid #3a0055",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#fff",
                fontSize: 15,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                background: "#1a002a",
                border: "1px solid #3a0055",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#fff",
                fontSize: 15,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#5a0099" : "#BF00FF",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
            }}
          >
            {loading ? "Creating Account..." : "Create Club Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#666", fontSize: 13, marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/owner-login" style={{ color: "#BF00FF", textDecoration: "none" }}>Sign In</Link>
        </p>
        <p style={{ textAlign: "center", color: "#666", fontSize: 13, marginTop: 8 }}>
          <Link to="/" style={{ color: "#666", textDecoration: "none" }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
