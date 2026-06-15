import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#08000F", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <h1 style={{ color: "white", fontSize: "28px", fontWeight: "bold", textAlign: "center", marginBottom: "8px" }}>Join Noctu</h1>
        <p style={{ color: "#BF00FF", textAlign: "center", marginBottom: "32px", fontSize: "14px" }}>You either have it or you don't.</p>

        {error && (
          <div style={{ background: "rgba(220,38,38,0.2)", border: "1px solid #ef4444", color: "#fca5a5", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "14px 16px", color: "white", fontSize: "15px", outline: "none" }}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "14px 16px", color: "white", fontSize: "15px", outline: "none" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ background: "#BF00FF", color: "white", fontWeight: "600", padding: "14px", borderRadius: "10px", border: "none", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", textAlign: "center", marginTop: "24px" }}>
          Already a member?{" "}
          <Link to="/login" style={{ color: "#BF00FF" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}