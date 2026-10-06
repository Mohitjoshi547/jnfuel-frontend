import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./CertificateVerification.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function CertificateVerification() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] =
    useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/applications/certificate/verify/${token}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Certificate verification failed"
          );
        }

        setCertificate(data.certificate);
      } catch (error) {
        console.error(
          "Certificate verification error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyCertificate();
    }
  }, [token]);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

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

  if (error || !certificate) {
    return (
      <div className="certificate-verification-page">
        <div className="verification-card">

          <div className="verification-failed-icon">
            !
          </div>

          <h1>
            Certificate Verification Failed
          </h1>

          <p>
            {error ||
              "Certificate could not be verified."}
          </p>

          <div className="verification-invalid">
            Invalid or expired certificate
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="certificate-verification-page">

      <div className="verification-card">

        <div className="verification-success-icon">
          ✓
        </div>

        <span className="verification-label">
          JN FUEL PRIVATE LIMITED
        </span>

        <h1>
          Certificate Verified
        </h1>

        <p className="verification-subtitle">
          This certificate has been successfully
          verified from the JNFuel database.
        </p>

        <div className="verification-status">
          <span>✓ VERIFIED</span>
        </div>

        <div className="verification-details">

          <div>
            <span>
              Customer / Partner Name
            </span>

            <strong>
              {certificate.applicantName}
            </strong>
          </div>

          <div>
            <span>
              Business Name
            </span>

            <strong>
              {certificate.businessName ||
                certificate.businessModel ||
                "-"}
            </strong>
          </div>

          <div>
            <span>
              Certificate Number
            </span>

            <strong>
              {certificate.certificateNumber}
            </strong>
          </div>

          <div>
            <span>
              DP ID / License No.
            </span>

            <strong>
              {certificate.licenseNumber ||
                "-"}
            </strong>
          </div>

          <div>
            <span>
              Authorized Area
            </span>

            <strong>
              {certificate.preferredLocation ||
                "-"}
            </strong>
          </div>

          <div>
            <span>
              Issue Date
            </span>

            <strong>
              {formatDate(
                certificate.certificateDate
              )}
            </strong>
          </div>

          <div>
            <span>
              Valid Upto
            </span>

            <strong>
              {formatDate(
                certificate.certificateValidUpto
              )}
            </strong>
          </div>

          <div>
            <span>
              Application Number
            </span>

            <strong>
              {certificate.applicationNumber}
            </strong>
          </div>

        </div>

        <div className="verification-footer">
          <span>
            JN Fuel Private Limited
          </span>

          <small>
            Certificate verification portal
          </small>
        </div>

      </div>

    </div>
  );
}

export default CertificateVerification;