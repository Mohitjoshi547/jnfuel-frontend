import React, { useMemo, useState } from "react";
import "./Payment.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Payment({ application, onPaymentSubmitted }) {
   console.log("PAYMENT APPLICATION DATA:", application);
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [paymentType, setPaymentType] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const paymentAmount = useMemo(() => {
    const amounts = {
      FDP: 25000,
      "Mini Pump": 30000,
      Bowser: 50000,
    };

    return amounts[application?.businessModel] || 0;
  }, [application?.businessModel]);

  const paymentStatus = application?.paymentStatus || "Pending";

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusClass = () => {
    switch (paymentStatus) {
      case "Verified":
        return "payment-status verified";

      case "Rejected":
        return "payment-status rejected";

      case "Submitted":
        return "payment-status submitted";

      default:
        return "payment-status pending";
    }
  };

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) {
      setPaymentScreenshot("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please JPG, PNG, WEBP ya PDF payment screenshot upload karein.",
      );
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Payment screenshot maximum 5 MB ka hona chahiye.");
      event.target.value = "";
      return;
    }

    /*
      Backend currently expects paymentScreenshot as a string.
      File ko Data URL mein convert kar rahe hain.
    */
    const reader = new FileReader();

    reader.onload = () => {
      setPaymentScreenshot(reader.result);
    };

    reader.onerror = () => {
      setError("Screenshot read nahi ho saka.");
      setPaymentScreenshot("");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem("jnfuel_token");

    if (!token) {
      setError("Session expired. Please login again.");
      return;
    }

    if (!application?._id) {
      setError("Application information available nahi hai.");
      return;
    }
    if (!paymentType) {
      setError("Please payment type select karein.");
      return;
    }
    if (!transactionId.trim()) {
      setError("Payment Transaction ID / UTR required hai.");
      return;
    }

    if (!paymentDate) {
      setError("Payment date required hai.");
      return;
    }

    if (!paymentScreenshot) {
      setError("Payment screenshot upload karna required hai.");
      return;
    }

    if (!paymentAmount) {
      setError("Payment amount determine nahi ho saka.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/api/applications/${application._id}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentTransactionId: transactionId.trim(),
            paymentDate,
            paymentScreenshot,
            paymentType,
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("jnfuel_token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment submit nahi ho saka.");
      }

      setSuccess(
        "Payment details successfully submit ho gayi hain. Admin verification ka wait karein.",
      );

      setTransactionId("");
      setPaymentDate("");
      setPaymentScreenshot("");
      setPaymentType("");

      const fileInput = document.getElementById("payment-screenshot-input");

      if (fileInput) {
        fileInput.value = "";
      }

      if (onPaymentSubmitted) {
        onPaymentSubmitted(data.application);
      }
    } catch (err) {
      console.error("Payment submit error:", err);

      setError(err.message || "Payment submit nahi ho saka. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-page">
      {/* HEADER */}

      <div className="payment-page-header">
        <div>
          <span className="payment-eyebrow">PAYMENT</span>

          <h2>Application Payment</h2>

          <p>
            Complete your payment and submit the transaction details for
            verification.
          </p>
        </div>

        <div className={getStatusClass()}>
          <span className="payment-status-dot"></span>
          {paymentStatus}
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="payment-alert payment-alert-error">
          <span>!</span>
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="payment-alert payment-alert-success">
          <span>✓</span>
          <div>{success}</div>
        </div>
      )}

      <div className="payment-layout">
        {/* LEFT */}

        <section className="payment-card payment-form-card">
          <div className="payment-card-header">
            <div>
              <h3>Submit Payment Details</h3>
              <p>
                Enter the payment information exactly as shown in your payment
                receipt.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* PAYMENT TYPE */}

            <div className="payment-field">
              <label htmlFor="payment-type">
                Payment Type
                <span>*</span>
              </label>

              <select
                id="payment-type"
                value={paymentType}
                onChange={(event) => setPaymentType(event.target.value)}
                disabled={submitting || paymentStatus === "Submitted"}
              >
                <option value="">Select Payment Type</option>

                <option value="Full Payment">Full Payment</option>

                <option value="Token Money">Token Money</option>
              </select>

              <small>
                Select whether you are making full payment or token payment.
              </small>
            </div>
            {/* TRANSACTION ID */}

            <div className="payment-field">
              <label htmlFor="payment-transaction-id">
                Transaction ID / UTR
                <span>*</span>
              </label>

              <input
                id="payment-transaction-id"
                type="text"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="Enter UTR / Transaction ID"
                maxLength={100}
                disabled={submitting || paymentStatus === "Submitted"}
              />

              <small>
                Enter the transaction reference number from your payment
                receipt.
              </small>
            </div>

            {/* DATE */}

            <div className="payment-field">
              <label htmlFor="payment-date">
                Payment Date
                <span>*</span>
              </label>

              <input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                max={new Date().toISOString().split("T")[0]}
                disabled={submitting || paymentStatus === "Submitted"}
              />
            </div>

            {/* SCREENSHOT */}

            <div className="payment-field">
              <label htmlFor="payment-screenshot-input">
                Payment Screenshot / Receipt
                <span>*</span>
              </label>

              <div className="payment-upload-box">
                <input
                  id="payment-screenshot-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleScreenshotChange}
                  disabled={submitting || paymentStatus === "Submitted"}
                />

                <div className="payment-upload-content">
                  <div className="payment-upload-icon">↑</div>

                  <strong>Click to upload payment proof</strong>

                  <span>JPG, PNG, WEBP or PDF · Maximum 5 MB</span>
                </div>
              </div>

              {paymentScreenshot && (
                <div className="payment-file-selected">
                  <span>✓</span>
                  <strong>Payment proof selected</strong>
                </div>
              )}
            </div>

            {/* BUTTON */}

            <button
              type="submit"
              className="payment-submit-btn"
              disabled={submitting || paymentStatus === "Submitted"}
            >
              {submitting ? (
                <>
                  <span className="payment-spinner"></span>
                  Submitting Payment...
                </>
              ) : paymentStatus === "Submitted" ? (
                "Payment Already Submitted"
              ) : (
                "Submit Payment"
              )}
            </button>
          </form>
        </section>

        {/* RIGHT */}

        <div className="payment-side">
          {/* PAYMENT QR */}

          <section className="payment-card payment-qr-card">
            <span className="payment-card-label">SCAN TO PAY</span>

            <div className="payment-qr-wrapper">
              <img
                src="/payment-qr.png"
                alt="Payment QR Code"
                className="payment-qr-image"
              />
            </div>

            <p className="payment-qr-text">
              Scan this QR code to make your payment.
            </p>

            <div className="payment-plan">
              <span>Business Model</span>
              <strong>{application.businessModel}</strong>
            
            </div>

            <div className="payment-plan">
              <span>Application No.</span>
              <strong>{application.applicationNumber}</strong>
            </div>
          </section>
          {/* PAYMENT INSTRUCTIONS */}

          <section className="payment-card payment-instructions">
            <div className="payment-instruction-header">
              <div className="payment-info-icon">i</div>

              <div>
                <h3>Payment Instructions</h3>
                <p>Follow these steps carefully.</p>
              </div>
            </div>

            <ol>
              <li>Pay the required amount for your selected business model.</li>

              <li>Keep your transaction ID / UTR number safely.</li>

              <li>Take a clear screenshot of your successful payment.</li>

              <li>Enter the transaction details and upload the proof here.</li>

              <li>Wait for admin verification after submission.</li>
            </ol>
          </section>

          {/* SECURITY */}

          <div className="payment-security">
            <span>🔒</span>

            <div>
              <strong>Secure Payment Verification</strong>
              <p>
                Your payment details are submitted securely for administrative
                verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMITTED STATE */}

      {paymentStatus === "Submitted" && (
        <div className="payment-submitted-card">
          <div className="payment-submitted-icon">✓</div>

          <div>
            <h3>Payment Submitted Successfully</h3>

            <p>
              Your payment proof has been submitted and is waiting for admin
              verification.
            </p>
          </div>

          <span className="payment-submitted-badge">Under Verification</span>
        </div>
      )}

      {/* VERIFIED STATE */}

      {paymentStatus === "Verified" && (
        <div className="payment-verified-card">
          <div className="payment-submitted-icon">✓</div>

          <div>
            <h3>Payment Verified</h3>

            <p>
              Your payment has been successfully verified by the administration.
            </p>
          </div>

          <span className="payment-verified-badge">Verified</span>
        </div>
      )}

      {/* REJECTED STATE */}

      {paymentStatus === "Rejected" && (
        <div className="payment-rejected-card">
          <div className="payment-rejected-icon">!</div>

          <div>
            <h3>Payment Rejected</h3>

            <p>
              {application?.payment?.rejectionReason ||
                "Your payment submission was rejected. Please review the details and submit again."}
            </p>
          </div>

          <span className="payment-rejected-badge">Rejected</span>
        </div>
      )}
    </div>
  );
}

export default Payment;
