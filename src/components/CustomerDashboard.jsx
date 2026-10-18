import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerDashboard.css";
import Payment from "./Payment";
import Agreement from "./Agreement";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialForm = {
  applicantName: "",
  fatherName: "",
  dateOfBirth: "",
  gender: "",
  mobile: "",
  email: "",
  businessName: "",
  businessModel: "",
  preferredLocation: "",
  address: {
    line: "",
    villageTownCity: "",
    district: "",
    state: "",
    pinCode: "",
  },
  remarks: "",
};

function CustomerDashboard() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [customer, setCustomer] = useState(null);
  const [application, setApplication] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const menuItems = [
    { name: "Dashboard", icon: "⌂" },
    { name: "My Application", icon: "▣" },
    { name: "Documents / KYC", icon: "▤" },
    { name: "Payment", icon: "₹" },
    { name: "Agreement", icon: "▥" },
    { name: "Certificate", icon: "✓" },
    { name: "Profile", icon: "◉" },
  ];

  const getToken = () => localStorage.getItem("jnfuel_token");

  const clearSession = () => {
    [
      "jnfuel_token",
      "jnfuel_user",
      "jnfuel_customer",
      "jnfuel_user_role",
      "jnfuel_application_number",
      "jnfuel_must_change_password",
    ].forEach((key) => localStorage.removeItem(key));
  };

  const loadApplication = useCallback(
    async (applicationNumber, token) => {
      const response = await fetch(
        `${API_BASE_URL}/api/applications/number/${encodeURIComponent(
          applicationNumber,
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Application load nahi ho saki");
      }

      setApplication(data.application);
      setError("");
    },
    [navigate],
  );

  /* LOAD CUSTOMER */

  useEffect(() => {
    let cancelled = false;

    const loadCustomerData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();
        const role = localStorage.getItem("jnfuel_user_role");

        if (!token || role !== "customer") {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Partner data load nahi ho saka");
        }

        if (cancelled) return;

        const customerInfo = data.customer;

        setCustomer(customerInfo);

        localStorage.setItem("jnfuel_user", JSON.stringify(customerInfo));

        localStorage.setItem("jnfuel_customer", JSON.stringify(customerInfo));

        setForm((previous) => ({
          ...previous,
          applicantName: customerInfo.name || previous.applicantName,
          mobile: customerInfo.mobile || previous.mobile,
          email: customerInfo.email || previous.email,
        }));

        const applicationNumber = customerInfo.applicationNumber;

        if (!applicationNumber) {
          setApplication(null);
          localStorage.removeItem("jnfuel_application_number");
          return;
        }

        localStorage.setItem("jnfuel_application_number", applicationNumber);

        await loadApplication(applicationNumber, token);
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard error:", err);
          setError(err.message || "Dashboard load nahi ho saka");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCustomerData();

    return () => {
      cancelled = true;
    };
  }, [navigate, loadApplication]);

  /* FORM HANDLERS */

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];

      setForm((previous) => ({
        ...previous,
        address: {
          ...previous.address,
          [addressField]: value,
        },
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleApplicationSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      clearSession();
      navigate("/login", { replace: true });
      return;
    }

    if (!form.applicantName.trim() || !form.mobile.trim()) {
      setError("Applicant name aur mobile number required hain.");
      return;
    }

    if (!form.businessModel) {
      setError("Please select a business model.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Application submit nahi ho saki");
      }

      const submittedApplication = data.application;

      if (!submittedApplication?.applicationNumber) {
        throw new Error(
          "Application submit response mein application number nahi mila. Please refresh karke status check karein.",
        );
      }

      setApplication(submittedApplication);

      setCustomer((previous) => ({
        ...previous,
        applicationNumber: submittedApplication.applicationNumber,
      }));

      const updatedCustomer = {
        ...customer,
        applicationNumber: submittedApplication.applicationNumber,
      };

      localStorage.setItem("jnfuel_user", JSON.stringify(updatedCustomer));

      localStorage.setItem("jnfuel_customer", JSON.stringify(updatedCustomer));

      localStorage.setItem(
        "jnfuel_application_number",
        submittedApplication.applicationNumber,
      );

      setSuccess("Application successfully submitted!");
      setActiveMenu("Dashboard");
    } catch (err) {
      console.error("Application submit error:", err);
      setError(err.message || "Application submit nahi ho saki");
    } finally {
      setSubmitting(false);
    }
  };

  /* HELPERS */

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusText = (status) => {
    const messages = {
      Submitted: "Your application has been submitted successfully.",
      "Under Review": "Our team is currently reviewing your application.",
      "Documents Pending": "Some documents are pending verification.",
      "Payment Pending": "Payment is pending for your application.",
      "Field Verification Pending": "Field verification is pending.",
      Approved: "Your application has been approved.",
      Rejected: "Your application has been rejected.",
      "Agreement Pending": "Agreement process is pending.",
      "Certificate Issued": "Your certificate has been issued.",
      Completed: "Your application process has been completed.",
    };

    return messages[status] || "Your application is being processed.";
  };

  const getProgressStatus = (step) => {
    if (!application) return "pending";

    const statusOrder = {
      Draft: 0,
      Submitted: 1,
      "Under Review": 2,
      "Documents Pending": 2,
      "Payment Pending": 3,
      "Field Verification Pending": 4,
      Approved: 5,
      "Agreement Pending": 6,
      "Certificate Issued": 7,
      Completed: 8,
      Rejected: -1,
    };

    const current = statusOrder[application.status] ?? 1;

    if (application.status === "Rejected") return "rejected";
    if (step <= current) return "completed";
    if (step === current + 1) return "active";

    return "pending";
  };

  const certificateIssued =
    application?.certificateStatus === "Issued" &&
    Boolean(application?.certificateNumber);

  /* AUTHENTICATED CERTIFICATE REQUEST */

  const getCertificateBlob = async () => {
    if (!application?._id) {
      throw new Error("Certificate information unavailable");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/applications/${application._id}/certificate`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );

    if (response.status === 401 || response.status === 403) {
      clearSession();
      navigate("/login", { replace: true });
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error("Certificate access nahi ho saka");
    }

    return response.blob();
  };

  const handleViewCertificate = async () => {
    const newWindow = window.open("about:blank", "_blank");

    try {
      const blob = await getCertificateBlob();
      const url = URL.createObjectURL(blob);

      if (newWindow) {
        newWindow.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        link.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (newWindow) newWindow.close();
      alert(err.message);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const blob = await getCertificateBlob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        application?.certificateNumber || "JNFuel-Certificate"
      }.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="customer-dashboard">
        <div className="customer-loading">Loading your dashboard...</div>
      </div>
    );
  }

  const applicantInitial =
    application?.applicantName?.charAt(0)?.toUpperCase() ||
    customer?.name?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <div className="customer-dashboard">
      {/* SIDEBAR */}

      <aside className="customer-sidebar">
        <div className="customer-logo">
          <img
            src="/jnfuellogo.jpeg"
            alt="JN Fuel Logo"
            className="customer-logo-image"
          />
          <div>
            <h2>JNFuel</h2>
            <span>Partner Portal</span>
          </div>
        </div>

        <div className="customer-menu-title">MENU</div>

        <nav className="customer-menu">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={
                activeMenu === item.name
                  ? "customer-menu-item active"
                  : "customer-menu-item"
              }
              onClick={() => setActiveMenu(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="customer-sidebar-bottom">
          <button
            className="customer-menu-item"
            onClick={() =>
              alert("Please contact JNFuel administration for support.")
            }
          >
            <span>?</span>
            Help & Support
          </button>

          <button className="customer-menu-item" onClick={handleLogout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="customer-main">
        <header className="customer-header">
          <div>
            <h1>{activeMenu}</h1>
            <p>Welcome back! Track your JNFuel application from here.</p>
          </div>

          <div className="customer-profile">
            <div className="customer-avatar">{applicantInitial}</div>

            <div>
              <strong>{application?.applicantName || customer?.name}</strong>
              <span>
                {application?.applicationNumber || "Application not submitted"}
              </span>
            </div>
          </div>
        </header>

        {error && (
          <div className="customer-alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="customer-alert success" role="status">
            {success}
          </div>
        )}

        {/* NEW APPLICATION FORM */}

        {!application && (
          <div className="customer-content">
            <section className="customer-card application-form-card">
              <div className="customer-card-header">
                <div>
                  <h3>New JNFuel Application</h3>
                  <p>
                    Please complete the details below to submit your
                    application.
                  </p>
                </div>
              </div>

              <form onSubmit={handleApplicationSubmit}>
                <h4>Applicant Details</h4>

                <div className="application-form-grid">
                  <label>
                    Applicant Name *
                    <input
                      name="applicantName"
                      value={form.applicantName}
                      onChange={handleFormChange}
                      required
                      maxLength={100}
                    />
                  </label>

                  <label>
                    Father's Name
                    <input
                      name="fatherName"
                      value={form.fatherName}
                      onChange={handleFormChange}
                      maxLength={100}
                    />
                  </label>

                  <label>
                    Date of Birth
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Gender
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleFormChange}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label>
                    Mobile Number *
                    <input
                      type="tel"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleFormChange}
                      required
                      maxLength={15}
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>

                <h4>Business Details</h4>

                <div className="application-form-grid">
                  <label>
                    Business Name
                    <input
                      name="businessName"
                      value={form.businessName}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Business Model *
                    <select
                      name="businessModel"
                      value={form.businessModel}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select business model</option>
                      <option value="FDP">FDP</option>
                      <option value="Mini Pump">Mini Pump</option>
                      <option value="Bowser">Bowser</option>
                    </select>
                  </label>

                  <label className="form-full-width">
                    Preferred Location
                    <input
                      name="preferredLocation"
                      value={form.preferredLocation}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>

                <h4>Address Details</h4>

                <div className="application-form-grid">
                  <label className="form-full-width">
                    Address Line
                    <input
                      name="address.line"
                      value={form.address.line}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Village / Town / City
                    <input
                      name="address.villageTownCity"
                      value={form.address.villageTownCity}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    District
                    <input
                      name="address.district"
                      value={form.address.district}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    State
                    <input
                      name="address.state"
                      value={form.address.state}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    PIN Code
                    <input
                      name="address.pinCode"
                      value={form.address.pinCode}
                      onChange={handleFormChange}
                      maxLength={10}
                    />
                  </label>

                  <label className="form-full-width">
                    Additional Remarks
                    <textarea
                      name="remarks"
                      value={form.remarks}
                      onChange={handleFormChange}
                      rows={4}
                    />
                  </label>
                </div>

                <div className="application-form-actions">
                  <button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* EXISTING APPLICATION DASHBOARD */}

        {application && activeMenu === "Dashboard" && (
          <div className="customer-content">
            <section className="customer-welcome">
              <div>
                <span className="welcome-label">APPLICATION STATUS</span>

                <h2>{application.status}</h2>

                <p>{getStatusText(application.status)}</p>

                <button onClick={() => setActiveMenu("My Application")}>
                  View Application →
                </button>
              </div>

              <div className="application-number">
                <span>Application No.</span>
                <strong>{application.applicationNumber}</strong>
                <small>Submitted on {formatDate(application.createdAt)}</small>
              </div>
            </section>

            {certificateIssued && (
              <section className="customer-certificate-card">
                <div className="certificate-card-icon">✓</div>

                <div className="certificate-card-content">
                  <span className="certificate-label">CERTIFICATE ISSUED</span>

                  <h3>Your JNFuel Certificate is Ready</h3>

                  <p>
                    Certificate No.{" "}
                    <strong>{application.certificateNumber}</strong>
                  </p>
                </div>

                <div className="certificate-card-actions">
                  <button
                    className="certificate-view-btn"
                    onClick={handleViewCertificate}
                  >
                    View Certificate
                  </button>

                  <button
                    className="certificate-download-btn"
                    onClick={handleDownloadCertificate}
                  >
                    Download PDF
                  </button>
                </div>
              </section>
            )}

            <section className="customer-card">
              <div className="customer-card-header">
                <div>
                  <h3>Application Progress</h3>
                  <p>Track your application journey</p>
                </div>
              </div>

              <div className="application-progress">
                {[
                  ["Application Submitted", formatDate(application.createdAt)],
                  ["Document Verification", application.documentStatus],
                  ["Payment Verification", application.paymentStatus],
                  ["Field Verification", application.fieldVerificationStatus],
                  ["Approval", application.status],
                ].map(([label, detail], index) => {
                  const step = index + 1;
                  const progress = getProgressStatus(step);

                  return (
                    <React.Fragment key={label}>
                      <div
                        className={`progress-step ${
                          progress === "completed" ? "completed" : ""
                        } ${progress === "active" ? "active-step" : ""}`}
                      >
                        <div className="step-circle">
                          {progress === "completed" ? "✓" : step}
                        </div>

                        <div>
                          <strong>{label}</strong>
                          <span>{detail || "Pending"}</span>
                        </div>
                      </div>

                      {index < 4 && (
                        <div
                          className={`progress-line ${
                            progress === "completed" ? "completed-line" : ""
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>

            <div className="customer-grid">
              <section className="customer-card">
                <div className="customer-card-header">
                  <div>
                    <h3>Documents</h3>
                    <p>Your document verification status</p>
                  </div>

                  <button onClick={() => setActiveMenu("Documents / KYC")}>
                    View All
                  </button>
                </div>

                <div className="document-list">
                  <div className="document-item">
                    <span className="document-icon">DOC</span>

                    <div>
                      <strong>KYC Documents</strong>
                      <span>{application.documentStatus}</span>
                    </div>

                    <b
                      className={
                        application.documentStatus === "Verified"
                          ? "verified"
                          : "pending"
                      }
                    >
                      {application.documentStatus}
                    </b>
                  </div>
                </div>
              </section>

              <section className="customer-card">
                <div className="customer-card-header">
                  <div>
                    <h3>Business Details</h3>
                    <p>Your selected JNFuel model</p>
                  </div>
                </div>

                <div className="business-detail">
                  <div>
                    <span>Business Model</span>
                    <strong>{application.businessModel || "-"}</strong>
                  </div>

                  <div>
                    <span>Preferred Location</span>
                    <strong>{application.preferredLocation || "-"}</strong>
                  </div>

                  <div>
                    <span>Field Verification</span>
                    <strong>{application.fieldVerificationStatus}</strong>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* CERTIFICATE */}

        {application && activeMenu === "Certificate" && (
          <div className="customer-content">
            {!certificateIssued ? (
              <section className="certificate-empty-card">
                <div className="certificate-empty-icon">⏳</div>

                <h2>Certificate Not Issued Yet</h2>

                <p>
                  Your certificate will become available here after your
                  application is approved.
                </p>

                <div className="certificate-status-box">
                  <span>Current Application Status</span>
                  <strong>{application.status}</strong>
                </div>

                <button onClick={() => setActiveMenu("Dashboard")}>
                  ← Back to Dashboard
                </button>
              </section>
            ) : (
              <section className="certificate-main-card">
                <div className="certificate-success">
                  <div className="certificate-success-icon">✓</div>

                  <div>
                    <span>CERTIFICATE VERIFIED</span>
                    <h2>Certificate Issued</h2>
                    <p>Your JNFuel authorization certificate is ready.</p>
                  </div>
                </div>

                <div className="certificate-details-grid">
                  <div>
                    <span>Certificate No.</span>
                    <strong>{application.certificateNumber}</strong>
                  </div>

                  <div>
                    <span>DP ID / License No.</span>
                    <strong>{application.licenseNumber || "-"}</strong>
                  </div>

                  <div>
                    <span>Issue Date</span>
                    <strong>{formatDate(application.certificateDate)}</strong>
                  </div>

                  <div>
                    <span>Valid Upto</span>
                    <strong>
                      {formatDate(application.certificateValidUpto)}
                    </strong>
                  </div>

                  <div>
                    <span>Customer / Partner</span>
                    <strong>{application.applicantName}</strong>
                  </div>

                  <div>
                    <span>Authorized Area</span>
                    <strong>{application.preferredLocation || "-"}</strong>
                  </div>
                </div>

                <div className="certificate-actions">
                  <button
                    className="certificate-primary-btn"
                    onClick={handleViewCertificate}
                  >
                    View Certificate
                  </button>

                  <button
                    className="certificate-secondary-btn"
                    onClick={handleDownloadCertificate}
                  >
                    Download Certificate
                  </button>
                </div>

                <div className="certificate-qr-info">
                  <div className="certificate-qr-placeholder">
                    {application.certificateQrCode ? (
                      <img
                        src={application.certificateQrCode}
                        alt="Certificate QR Code"
                      />
                    ) : (
                      "QR"
                    )}
                  </div>

                  <div>
                    <h3>Certificate Verification</h3>
                    <p>
                      Scan the QR code printed on your certificate to verify the
                      certificate details.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* MY APPLICATION */}

        {application && activeMenu === "My Application" && (
          <div className="customer-content">
            <section className="customer-card">
              <h3>Application Details</h3>

              <div className="business-detail">
                <div>
                  <span>Application Number</span>
                  <strong>{application.applicationNumber}</strong>
                </div>

                <div>
                  <span>Applicant Name</span>
                  <strong>{application.applicantName}</strong>
                </div>

                <div>
                  <span>Father's Name</span>
                  <strong>{application.fatherName || "-"}</strong>
                </div>

                <div>
                  <span>Mobile</span>
                  <strong>{application.mobile}</strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{application.email || "-"}</strong>
                </div>

                <div>
                  <span>Business Model</span>
                  <strong>{application.businessModel || "-"}</strong>
                </div>

                <div>
                  <span>Current Status</span>
                  <strong>{application.status}</strong>
                </div>

                <div>
                  <span>Submitted On</span>
                  <strong>{formatDate(application.createdAt)}</strong>
                </div>
              </div>
            </section>
          </div>
        )}
        {/* PAYMENT */}

        {application && activeMenu === "Payment" && (
          <div className="customer-content">
            <Payment
              application={application}
              onPaymentSubmitted={(updatedApplication) => {
                setApplication(updatedApplication);
                setSuccess("Payment details successfully submitted.");
                setActiveMenu("Dashboard");
              }}
            />
          </div>
        )}

        {/* AGREEMENT */}

        {application && activeMenu === "Agreement" && (
          <div className="customer-content">
            <Agreement
              application={application}
              onBack={() => setActiveMenu("Dashboard")}
            />
          </div>
        )}

        {/* OTHER SECTIONS */}

        {application &&
          !["Dashboard", "Certificate", "My Application", "Agreement"].includes(
            activeMenu,
          ) && (
            <div className="customer-coming">
              <div>⚙</div>

              <h2>{activeMenu}</h2>

              <p>This section UI will be added here.</p>

              <button onClick={() => setActiveMenu("Dashboard")}>
                ← Back to Dashboard
              </button>
            </div>
          )}
      </main>
    </div>
  );
}

export default CustomerDashboard;
