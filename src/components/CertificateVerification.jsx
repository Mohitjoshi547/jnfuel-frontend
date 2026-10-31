
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./CertificateVerification.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function CertificateVerification() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyCertificate = async () => {
      setLoading(true);
      setError("");
      setCertificate(null);

      try {
        if (!token) {
          throw new Error("Verification token missing.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/applications/certificate/verify/${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.verified) {
          throw new Error(
            data.message || "Certificate verification failed."
          );
        }

        if (!data.certificate) {
          throw new Error("Certificate details not found.");
        }

        setCertificate(data.certificate);
      } catch (err) {
        console.error("Certificate verification error:", err);
        setError(err.message || "Certificate verification failed.");
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [token]);

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const isExpired = certificate?.certificateValidUpto
    ? new Date(certificate.certificateValidUpto).getTime() <
      new Date().setHours(0, 0, 0, 0)
    : false;

  if (loading) {
    return (
      <div className="certificate-verification-page">
        <div className="verification-card">
          <div className="verification-loading">
            Verifying certificate...
          </div>
        </div>
      </div>
    );
  }

  if (error || !certificate || isExpired) {
    return (
      <div className="certificate-verification-page">
        <div className="verification-card">
          <div className="verification-failed-icon">!</div>

          <span className="verification-label">
            JN FUEL PRIVATE LIMITED
          </span>

          <h1>
            {isExpired
              ? "Certificate Expired"
              : "Certificate Verification Failed"}
          </h1>

          <p>
            {isExpired
              ? "This certificate has passed its validity date."
              : error || "Certificate could not be verified."}
          </p>

          <div className="verification-invalid">
            {isExpired
              ? "EXPIRED CERTIFICATE"
              : "INVALID OR UNVERIFIED CERTIFICATE"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-verification-page">
      <div className="verification-card">
        <div className="verification-success-icon">✓</div>

        <span className="verification-label">
          JN FUEL PRIVATE LIMITED
        </span>

        <h1>Certificate Verified</h1>

        <p className="verification-subtitle">
          This certificate has been successfully verified
          from the official JNFuel database.
        </p>

        <div className="verification-status">
          <span>✓ VERIFIED</span>
        </div>

        <div className="verification-details">
          <div>
            <span>Customer / Partner Name</span>
            <strong>{certificate.applicantName || "-"}</strong>
          </div>

          <div>
            <span>Business Name</span>
            <strong>{certificate.businessName || "-"}</strong>
          </div>

          <div>
            <span>Selected Business Plan</span>
            <strong>{certificate.businessModel || "-"}</strong>
          </div>

          <div>
            <span>Certificate Number</span>
            <strong>{certificate.certificateNumber || "-"}</strong>
          </div>

          <div>
            <span>DP ID / License Number</span>
            <strong>{certificate.licenseNumber || "-"}</strong>
          </div>

          <div>
            <span>Business Address / Authorized Area</span>
            <strong>{certificate.preferredLocation || "-"}</strong>
          </div>

          <div>
            <span>Issue Date</span>
            <strong>{formatDate(certificate.certificateDate)}</strong>
          </div>

          <div>
            <span>Valid Upto</span>
            <strong>
              {formatDate(certificate.certificateValidUpto)}
            </strong>
          </div>

          <div>
            <span>Application Number</span>
            <strong>{certificate.applicationNumber || "-"}</strong>
          </div>
        </div>

        <div className="verification-footer">
          <span>JN Fuel Private Limited</span>
          <small>Official Certificate Verification Portal</small>
        </div>
      </div>
    </div>
  );
}

export default CertificateVerification;
