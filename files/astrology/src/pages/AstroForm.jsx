import { useState } from "react";

function AstroForm() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setImageUrl(null);

    if (!name || !dob) {
      setError("Please enter both your name and date of birth.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/astrology-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dob }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate image");
      }

      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: 24,
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <h1 style={{ marginBottom: 16 }}>Astrological Portrait</h1>
      <p style={{ marginBottom: 24 }}>
        Enter your name and date of birth to generate a personalized
        astrological image ✨
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && (
        <p style={{ color: "crimson", marginTop: 16, fontSize: 14 }}>{error}</p>
      )}

      {imageUrl && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <img
            src={imageUrl}
            alt="Astrological result"
            style={{
              maxWidth: "100%",
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default AstroForm;
