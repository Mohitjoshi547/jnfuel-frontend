import React, { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function SignAgreement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agreement, setAgreement] = useState(null);
  const [signedBy, setSignedBy] = useState("");
  const [signatureFont, setSignatureFont] = useState("signature-1");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = window.location.pathname.split("/").pop();

  useEffect(() => {
    async function loadAgreement() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/applications/agreement-link/${encodeURIComponent(token)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Agreement load nahi ho saka.");
        }

        setAgreement(data.application);
        setSignedBy(data.application.applicantName || "");
      } catch (err) {
        setError(err.message || "Link invalid hai ya expire ho gaya hai.");
      } finally {
        setLoading(false);
      }
    }

    if (token) loadAgreement();
  }, [token]);

  async function handleSign(event) {
    event.preventDefault();
    setError("");

    if (!signedBy.trim()) {
      setError("Apna poora naam enter karein.");
      return;
    }

    const confirmed = window.confirm(
      "Kya aap agreement padhkar apni marzi se sign karna chahte hain?"
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/applications/agreement-link/${encodeURIComponent(token)}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signedBy: signedBy.trim(), signatureFont }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Agreement sign nahi ho saka.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Agreement sign nahi ho saka.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main style={styles.container}>Agreement load ho raha hai...</main>;
  }

  if (success) {
    return (
      <main style={styles.container}>
        <section style={styles.card}>
          <h1>Agreement Signed Successfully ✅</h1>
          <p>Aapka agreement sign ho gaya hai.</p>
          <p>JN Fuel Private Limited ki taraf se dhanyavaad.</p>
        </section>
      </main>
    );
  }

  if (error && !agreement) {
    return (
      <main style={styles.container}>
        <section style={styles.card}>
          <h1>Agreement Link</h1>
          <p style={styles.error}>{error}</p>
          <p>Agar aapko lagta hai ki link galti se expire hua hai, toh JN Fuel se contact karein.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h1>JN Fuel Private Limited</h1>
        <h2>Agreement Signing</h2>

        {agreement && (
          <div style={styles.details}>
            <p><strong>Applicant:</strong> {agreement.applicantName}</p>
            <p><strong>Application No.:</strong> {agreement.applicationNumber}</p>
            <p><strong>Business:</strong> {agreement.businessName || "N/A"}</p>
          </div>
        )}

        <p>
          Sign karne se pehle apna agreement poora padhein. Neeche diye gaye
          button se agreement PDF khol sakte hain.
        </p>

        <a
          href={`${API_BASE_URL}/api/applications/agreement-link/${encodeURIComponent(token)}/pdf`}
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          View Agreement PDF
        </a>

        <form onSubmit={handleSign} style={styles.form}>
          <label htmlFor="signedBy">Apna poora naam</label>
          <input
            id="signedBy"
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            required
            maxLength={100}
            style={styles.input}
          />

          <label htmlFor="signatureFont">Signature style</label>
          <select
            id="signatureFont"
            value={signatureFont}
            onChange={(e) => setSignatureFont(e.target.value)}
            style={styles.input}
          >
            <option value="signature-1">Style 1</option>
            <option value="signature-2">Style 2</option>
            <option value="signature-3">Style 3</option>
          </select>

          <p style={styles.notice}>
            Confirm karne se pehle agreement aur uski saari conditions padh lein.
          </p>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? "Signing..." : "I Agree & Sign"}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px 16px",
    background: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    width: "100%",
    maxWidth: "700px",
    padding: "28px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },
  details: {
    padding: "12px 18px",
    margin: "20px 0",
    background: "#f4f7fb",
    borderRadius: "8px",
  },
  form: {
    display: "grid",
    gap: "12px",
    marginTop: "24px",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccd3df",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "16px",
  },
  link: {
    display: "inline-block",
    marginTop: "8px",
    padding: "12px 18px",
    background: "#165dca",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
  },
  button: {
    padding: "14px",
    background: "#071b45",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
  },
  notice: {
    fontSize: "14px",
    color: "#667085",
    lineHeight: 1.5,
  },
  error: {
    color: "#b42318",
  },
};