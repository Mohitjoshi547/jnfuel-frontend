import React, { useEffect, useState } from "react";
import "./Agreement.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Agreement({ application, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [agreementPdfUrl, setAgreementPdfUrl] = useState("");
  const [agreementPdfLoading, setAgreementPdfLoading] = useState(false);

  const [showSignBox, setShowSignBox] = useState(false);

  const [signedBy, setSignedBy] = useState(
    application?.applicantName || ""
  );

  const [signatureFont, setSignatureFont] = useState(
    application?.agreement?.signatureFont || "signature-1"
  );

  const getToken = () => localStorage.getItem("jnfuel_token");

  /* =========================================
     RESET WHEN APPLICATION CHANGES
  ========================================= */

  useEffect(() => {
    setError("");
    setShowSignBox(false);

    setSignedBy(application?.applicantName || "");

    setSignatureFont(
      application?.agreement?.signatureFont || "signature-1"
    );
  }, [application]);

  /* =========================================
     LOAD AGREEMENT PDF
  ========================================= */

  useEffect(() => {
    let objectUrl = "";

    const loadAgreementPDF = async () => {
      if (
        !application?._id ||
        application?.agreementStatus !== "Sent"
      ) {
        setAgreementPdfUrl("");
        return;
      }

      const token = getToken();

      if (!token) {
        setError("Session expired. Please login again.");
        return;
      }

      try {
        setAgreementPdfLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/applications/${application._id}/agreement`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          let message = "Agreement PDF load nahi ho saka.";

          try {
            const data = await response.json();
            message = data.message || message;
          } catch {
            // Ignore non JSON response
          }

          throw new Error(message);
        }

        const blob = await response.blob();

        objectUrl = URL.createObjectURL(blob);

        setAgreementPdfUrl(objectUrl);
      } catch (err) {
        console.error("Agreement PDF load error:", err);

        setError(
          err.message || "Agreement PDF load nahi ho saka."
        );

        setAgreementPdfUrl("");
      } finally {
        setAgreementPdfLoading(false);
      }
    };

    loadAgreementPDF();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [application]);

  /* =========================================
     OPEN SIGNING
  ========================================= */

  const handleOpenSigning = () => {
    setError("");

    setSignedBy(application?.applicantName || "");

    setSignatureFont(
      application?.agreement?.signatureFont || "signature-1"
    );

    setShowSignBox(true);
  };

  /* =========================================
     SIGN AGREEMENT
  ========================================= */

  const handleSignAgreement = async () => {
    if (!application?._id) {
      setError(
        "Application information available nahi hai."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Session expired. Please login again."
      );
      return;
    }

    if (!signedBy.trim()) {
      setError("Signer name required hai.");
      return;
    }

    if (
      !["signature-1", "signature-2", "signature-3"].includes(
        signatureFont
      )
    ) {
      setError("Please signature style select karein.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/applications/${application._id}/agreement/sign`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            signedBy: signedBy.trim(),
            signatureFont,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Agreement sign nahi ho saka."
        );
      }

      setShowSignBox(false);

      /*
       * Reload dashboard so the latest
       * agreement status/data is available.
       */
      window.location.reload();
    } catch (err) {
      console.error(
        "Agreement signing error:",
        err
      );

      setError(
        err.message ||
          "Agreement signing failed."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     OPEN SIGNED AGREEMENT PDF
  ========================================= */

  const handleViewSignedAgreement = async () => {
    try {
      const token = getToken();

      if (!token) {
        setError(
          "Session expired. Please login again."
        );
        return;
      }

      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/applications/${application._id}/agreement`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data.message ||
            "Agreement PDF load nahi ho saka."
        );
      }

      const blob = await response.blob();

      const pdfUrl =
        window.URL.createObjectURL(blob);

      window.open(pdfUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (err) {
      console.error(
        "Agreement PDF error:",
        err
      );

      setError(
        err.message ||
          "Agreement PDF load nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     NO APPLICATION
  ========================================= */

  if (!application) {
    return (
      <section className="agreement-empty-card">
        <div className="agreement-empty-icon">
          📄
        </div>

        <h3>Agreement</h3>

        <p>
          Application information available nahi hai.
        </p>

        <button
          className="agreement-back-btn"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </section>
    );
  }

  const agreementStatus =
    application.agreementStatus || "Pending";

  /* =========================================
     SIGNATURE PREVIEW STYLE
  ========================================= */

  const signatureStyle = {
    "signature-1": {
      fontFamily: "'Caveat', cursive",
      fontWeight: 500,
    },

    "signature-2": {
      fontFamily: "'Caveat', cursive",
      fontWeight: 600,
      fontStyle: "italic",
    },

    "signature-3": {
      fontFamily: "'Caveat', cursive",
      fontWeight: 700,
    },
  };

  return (
    <div className="agreement-page">

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="agreement-alert error">
          <span>⚠</span>

          <div>
            <strong>Something went wrong</strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      {/* =====================================
          MAIN CARD
      ===================================== */}

      <section className="agreement-card">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="agreement-header">

          <div className="agreement-title-area">

            <div className="agreement-icon">
              📄
            </div>

            <div>
              <h1>JNF Fuel Agreement</h1>

              <p>
                Review your dealership agreement
                and complete the signing process.
              </p>
            </div>

          </div>

          <span
            className={`agreement-status agreement-status-${agreementStatus
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            {agreementStatus}
          </span>

        </div>

        {/* =====================================
            APPLICANT DETAILS
        ===================================== */}

        <div className="agreement-section">

          <div className="section-heading">

            <div>
              <h3>Applicant Details</h3>

              <p>
                Information associated with your
                application.
              </p>
            </div>

          </div>

          <div className="agreement-details-grid">

            <div className="agreement-detail">
              <span>Applicant Name</span>

              <strong>
                {application.applicantName || "-"}
              </strong>
            </div>

            <div className="agreement-detail">
              <span>Father's Name</span>

              <strong>
                {application.fatherName || "-"}
              </strong>
            </div>

            <div className="agreement-detail">
              <span>Mobile</span>

              <strong>
                {application.mobile || "-"}
              </strong>
            </div>

            <div className="agreement-detail">
              <span>Email</span>

              <strong>
                {application.email || "-"}
              </strong>
            </div>

            <div className="agreement-detail">
              <span>Business Model</span>

              <strong>
                {application.businessModel || "-"}
              </strong>
            </div>

            <div className="agreement-detail">
              <span>Application Number</span>

              <strong>
                {application.applicationNumber || "-"}
              </strong>
            </div>

          </div>

        </div>

        {/* =====================================
            AGREEMENT STATUS
        ===================================== */}

        <div className="agreement-info-box">

          <div className="info-icon">
            ℹ
          </div>

          <div>

            <h4>Agreement Status</h4>

            {agreementStatus === "Pending" && (
              <p>
                Agreement abhi administration ki
                taraf se send nahi kiya gaya hai.
              </p>
            )}

            {agreementStatus === "Generated" && (
              <p>
                Agreement generate ho gaya hai aur
                administration ke approval ka wait hai.
              </p>
            )}

            {agreementStatus === "Sent" && (
              <p>
                Agreement aapke liye available hai.
                Neeche original agreement carefully
                read karein aur uske baad sign karein.
              </p>
            )}

            {agreementStatus === "Signed" && (
              <p>
                Aapne agreement successfully sign
                kar diya hai.
              </p>
            )}

            {agreementStatus === "Completed" && (
              <p>
                Agreement process successfully
                complete ho gaya hai.
              </p>
            )}

          </div>

        </div>

        {/* =====================================
            ACTUAL AGREEMENT PDF
        ===================================== */}

        {agreementStatus === "Sent" && (
          <div className="agreement-document-section">

            <div className="agreement-document-header">

              <div>
                <h3>Agreement Document</h3>

                <p>
                  Original JN Fuel Agreement PDF
                </p>
              </div>

              {agreementPdfUrl && (
                <a
                  href={agreementPdfUrl}
                  download={`JN-Fuel-Agreement-${application.applicationNumber}.pdf`}
                  className="agreement-download-btn"
                >
                  ↓ Download PDF
                </a>
              )}

            </div>

            {agreementPdfLoading && (
              <div className="agreement-pdf-loading">

                <div className="agreement-spinner"></div>

                <span>
                  Loading agreement PDF...
                </span>

              </div>
            )}

            {!agreementPdfLoading &&
              agreementPdfUrl && (
                <div className="agreement-pdf-viewer">

                  <iframe
                    src={agreementPdfUrl}
                    title="JN Fuel Agreement"
                  />

                </div>
              )}

            {!agreementPdfLoading &&
              !agreementPdfUrl && (
                <div className="agreement-pdf-error">

                  <div>📄</div>

                  <strong>
                    Agreement PDF unavailable
                  </strong>

                  <p>
                    Agreement document load nahi ho
                    saka. Please page refresh karein.
                  </p>

                </div>
              )}

          </div>
        )}

        {/* =====================================
            REVIEW & SIGN BUTTON
        ===================================== */}

        {agreementStatus === "Sent" &&
          !showSignBox && (

            <div className="agreement-action-area">

              <div>
                <h3>Ready to sign?</h3>

                <p>
                  Agreement ko carefully review
                  karne ke baad neeche button se
                  apni electronic signature select
                  karein.
                </p>
              </div>

              <button
                type="button"
                className="primary-agreement-btn"
                onClick={handleOpenSigning}
                disabled={
                  loading ||
                  agreementPdfLoading ||
                  !agreementPdfUrl
                }
              >
                Review & Sign Agreement
                <span>→</span>
              </button>

            </div>
          )}

        {/* =====================================
            SIGNATURE STYLE SELECTION
        ===================================== */}

        {agreementStatus === "Sent" &&
          showSignBox && (

            <div className="agreement-sign-box">

              <div className="sign-box-header">

                <div>
                  <h3>
                    Electronic Signature
                  </h3>

                  <p>
                    Apna naam confirm karein aur
                    neeche se signature style select
                    karein.
                  </p>
                </div>

                <span className="sign-step">
                  Step 1 of 1
                </span>

              </div>

              {/* SIGNER NAME */}

              <div className="agreement-sign-field">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  value={signedBy}
                  onChange={(e) =>
                    setSignedBy(e.target.value)
                  }
                  placeholder="Enter your full name"
                  maxLength={100}
                />

              </div>

              {/* SIGNATURE STYLE */}

              <div className="signature-style-section">

                <div className="signature-style-heading">

                  <div>
                    <label>
                      Choose Signature Style
                    </label>

                    <p>
                      Aapka naam selected handwritten
                      style mein agreement par appear hoga.
                    </p>
                  </div>

                </div>

                <div className="signature-style-grid">

                  {/* STYLE 1 */}

                  <button
                    type="button"
                    className={`signature-style-card ${
                      signatureFont === "signature-1"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSignatureFont("signature-1")
                    }
                  >

                    <span className="signature-style-number">
                      1
                    </span>

                    <div
                      className="signature-preview signature-preview-1"
                      style={
                        signatureStyle["signature-1"]
                      }
                    >
                      {signedBy || "Your Name"}
                    </div>

                    <span className="signature-style-name">
                      Signature Style 1
                    </span>

                    {signatureFont ===
                      "signature-1" && (
                      <span className="signature-selected">
                        ✓ Selected
                      </span>
                    )}

                  </button>

                  {/* STYLE 2 */}

                  <button
                    type="button"
                    className={`signature-style-card ${
                      signatureFont === "signature-2"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSignatureFont("signature-2")
                    }
                  >

                    <span className="signature-style-number">
                      2
                    </span>

                    <div
                      className="signature-preview signature-preview-2"
                      style={
                        signatureStyle["signature-2"]
                      }
                    >
                      {signedBy || "Your Name"}
                    </div>

                    <span className="signature-style-name">
                      Signature Style 2
                    </span>

                    {signatureFont ===
                      "signature-2" && (
                      <span className="signature-selected">
                        ✓ Selected
                      </span>
                    )}

                  </button>

                  {/* STYLE 3 */}

                  <button
                    type="button"
                    className={`signature-style-card ${
                      signatureFont === "signature-3"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSignatureFont("signature-3")
                    }
                  >

                    <span className="signature-style-number">
                      3
                    </span>

                    <div
                      className="signature-preview signature-preview-3"
                      style={
                        signatureStyle["signature-3"]
                      }
                    >
                      {signedBy || "Your Name"}
                    </div>

                    <span className="signature-style-name">
                      Signature Style 3
                    </span>

                    {signatureFont ===
                      "signature-3" && (
                      <span className="signature-selected">
                        ✓ Selected
                      </span>
                    )}

                  </button>

                </div>

              </div>

              {/* FINAL PREVIEW */}

              <div className="selected-signature-preview">

                <span>
                  Signature Preview
                </span>

                <div
                  style={
                    signatureStyle[signatureFont]
                  }
                >
                  {signedBy || "Your Name"}
                </div>

              </div>

              {/* BUTTONS */}

              <div className="signature-actions">

                <button
                  type="button"
                  className="secondary-sign-btn"
                  onClick={() =>
                    setShowSignBox(false)
                  }
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-sign-btn"
                  onClick={handleSignAgreement}
                  disabled={
                    loading ||
                    !signedBy.trim()
                  }
                >
                  {loading
                    ? "Signing..."
                    : "Confirm & Sign Agreement"}
                </button>

              </div>

            </div>
          )}

        {/* =====================================
            SIGNED INFORMATION
        ===================================== */}

        {(agreementStatus === "Signed" ||
          agreementStatus === "Completed") && (

          <div className="agreement-signed-box">

            <div className="signed-check">
              ✓
            </div>

            <div className="signed-content">

              <h3>
                Agreement Signed Successfully
              </h3>

              <p>
                Your electronic agreement has been
                successfully signed.
              </p>

              <div className="signed-meta">

                <div>
                  <span>Signed By</span>

                  <strong>
                    {application.agreement?.signedBy ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>Signed On</span>

                  <strong>
                    {application.agreement?.signedAt
                      ? new Date(
                          application.agreement.signedAt
                        ).toLocaleString("en-IN")
                      : "-"}
                  </strong>
                </div>

              </div>

              <div className="signed-style-preview">

                <span>
                  Signature Style
                </span>

                <div
                  style={
                    signatureStyle[
                      application.agreement
                        ?.signatureFont ||
                        "signature-1"
                    ]
                  }
                >
                  {application.agreement?.signedBy ||
                    application.applicantName ||
                    "Signed"}
                </div>

              </div>

              <button
                type="button"
                className="agreement-pdf-btn"
                onClick={handleViewSignedAgreement}
                disabled={loading}
              >
                {loading
                  ? "Opening Agreement..."
                  : "📄 View Signed Agreement PDF"}
              </button>

            </div>

          </div>
        )}

        {/* =====================================
            FOOTER
        ===================================== */}

        <div className="agreement-footer-actions">

          <button
            type="button"
            className="agreement-back-btn"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>

        </div>

      </section>
    </div>
  );
}

export default Agreement;