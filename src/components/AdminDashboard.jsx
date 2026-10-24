import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  /* ================= GENERAL STATE ================= */

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  /* ================= APPLICATIONS ================= */

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  /* ================= APPLICATION DETAILS ================= */

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);

  /* ================= CERTIFICATE ================= */

  const [certificateForm, setCertificateForm] = useState({
    dpId: "",
    certificateNumber: "",
    validUpTo: "",
    authorizedArea: "",
    remarks: "",
  });

  const [certificateLoading, setCertificateLoading] = useState(false);

  /* ================= CUSTOMERS ================= */

  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);

  const [customerForm, setCustomerForm] = useState({
    customerId: "",
    name: "",
    mobile: "",
    email: "",
    applicationNumber: "",
    temporaryPassword: "",
  });

  const [createdCredentials, setCreatedCredentials] = useState(null);

  /* ================= API ================= */

  const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const getAdminHeaders = () => {
    const token = localStorage.getItem("jnfuel_admin_token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  /* ================= LOAD APPLICATIONS ================= */

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        headers: getAdminHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Applications load nahi ho sakin.");
      }

      setApplications(Array.isArray(data) ? data : data.applications || []);
    } catch (err) {
      console.error("Applications Load Error:", err);

      setError(
        err.message ||
          "Backend/database connected nahi hai ya data load nahi ho saka.",
      );

      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD CUSTOMERS ================= */

  const loadCustomers = async () => {
    try {
      setCustomerLoading(true);
      setCustomerError("");

      const response = await fetch(`${API_BASE_URL}/api/admin/customers`, {
        headers: getAdminHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Customers load nahi ho sake.");
      }

      setCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch (err) {
      console.error("Customers Load Error:", err);

      setCustomerError(err.message || "Customers load nahi ho sake.");
    } finally {
      setCustomerLoading(false);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    loadApplications();
    loadCustomers();
  }, []);

  /* ================= CUSTOMER FORM ================= */

  const handleCustomerInput = (e) => {
    const { name, value } = e.target;

    setCustomerForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* ================= GENERATE TEMP PASSWORD ================= */

  const generateTemporaryPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";

    let password = "";

    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setCustomerForm((current) => ({
      ...current,
      temporaryPassword: password,
    }));
  };

  /* ================= CREATE CUSTOMER ================= */

  const createCustomer = async (e) => {
    e.preventDefault();

    try {
      setCreatingCustomer(true);
      setCustomerError("");
      setCreatedCredentials(null);

      const mobile = String(customerForm.customerId || "").trim();

      const payload = {
        ...customerForm,
        customerId: mobile,
        mobile,
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/customers`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Customer create nahi ho saka.");
      }

      setCreatedCredentials({
        customerId: data.customer.customerId,
        name: data.customer.name,
        temporaryPassword: data.temporaryPassword,
      });

      setCustomerForm({
        customerId: "",
        name: "",
        mobile: "",
        email: "",
        applicationNumber: "",
        temporaryPassword: "",
      });

      await loadCustomers();
    } catch (err) {
      console.error("Create Customer Error:", err);

      setCustomerError(err.message || "Customer create nahi ho saka.");
    } finally {
      setCreatingCustomer(false);
    }
  };

  /* ================= ACTIVATE / DEACTIVATE CUSTOMER ================= */

  const updateCustomerStatus = async (customerId, active) => {
    try {
      setCustomerError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/customers/${customerId}/status`,
        {
          method: "PATCH",
          headers: getAdminHeaders(),
          body: JSON.stringify({ active }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Customer status update nahi ho saka.");
      }

      setCustomers((current) =>
        current.map((customer) =>
          customer._id === customerId ? data.customer : customer,
        ),
      );
    } catch (err) {
      console.error("Customer Status Error:", err);

      setCustomerError(err.message || "Customer status update nahi ho saka.");
    }
  };

  /* ================= DELETE CUSTOMER ================= */

  const deleteCustomer = async (customer) => {
    if (!customer?._id) {
      setCustomerError("Customer ID nahi mila.");
      return;
    }

    const confirmed = window.confirm(
      `Kya aap "${customer.name}" (${customer.customerId}) ko permanently delete karna chahte hain?\n\nYeh action undo nahi kiya ja sakta.`,
    );

    if (!confirmed) return;

    try {
      setDeletingCustomerId(customer._id);
      setCustomerError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/customers/${customer._id}`,
        {
          method: "DELETE",
          headers: getAdminHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Customer delete nahi ho saka.");
      }

      // Remove the deleted customer from the frontend list.
      setCustomers((current) =>
        current.filter((item) => item._id !== customer._id),
      );

      // Close the credentials card if it belongs to this customer.
      setCreatedCredentials((current) =>
        current && current.customerId === customer.customerId ? null : current,
      );

      alert("Customer successfully delete ho gaya.");
    } catch (err) {
      console.error("Delete Customer Error:", err);

      setCustomerError(err.message || "Customer delete nahi ho saka.");
    } finally {
      setDeletingCustomerId(null);
    }
  };

  /* ================= APPLICATION STATUS UPDATE ================= */

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      setUpdatingId(applicationId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: getAdminHeaders(),
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Status update nahi ho saka.");
      }

      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId ? data.application : application,
        ),
      );

      setSelectedApplication((current) =>
        current && current._id === applicationId ? data.application : current,
      );
    } catch (err) {
      console.error("Status Update Error:", err);

      setError(err.message || "Status update nahi ho saka.");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= SEND AGREEMENT ================= */

  const sendAgreement = async (applicationId) => {
    try {
      setUpdatingId(applicationId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/applications/${applicationId}/agreement/send`,
        {
          method: "POST",
          headers: getAdminHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Agreement generate nahi ho saka.");
      }

      if (!data.signingUrl) {
        throw new Error(
          "Signing link generate nahi hua. Backend response check karo.",
        );
      }

      if (data.application) {
        setApplications((current) =>
          current.map((application) =>
            application._id === applicationId ? data.application : application,
          ),
        );

        setSelectedApplication((current) =>
          current && current._id === applicationId ? data.application : current,
        );
      }

      try {
        await navigator.clipboard.writeText(data.signingUrl);

        alert(
          "Agreement generate ho gaya!\n\nSigning link clipboard mein copy ho gaya hai.\nCustomer ko WhatsApp par share kar do:\n\n" +
            data.signingUrl,
        );
      } catch {
        window.prompt(
          "Agreement generate ho gaya! Is link ko copy karke customer ko share karo:",
          data.signingUrl,
        );
      }
    } catch (err) {
      console.error("Generate Agreement Error:", err);

      setError(err.message || "Agreement generate nahi ho saka.");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= OPEN APPLICATION DETAILS ================= */

  const openApplicationDetails = (application) => {
    setSelectedApplication(application);

    setCertificateForm({
      dpId: application.dpId || "",
      certificateNumber: application.certificateNumber || "",
      validUpTo: application.validUpTo
        ? String(application.validUpTo).slice(0, 10)
        : "",
      authorizedArea:
        application.authorizedArea || application.preferredLocation || "",
      remarks: application.remarks || "",
    });

    setShowApplicationDetails(true);
  };

  /* ================= CLOSE APPLICATION DETAILS ================= */

  const closeApplicationDetails = () => {
    setShowApplicationDetails(false);
    setSelectedApplication(null);
  };

  /* ================= CERTIFICATE FORM ================= */

  const handleCertificateInput = (e) => {
    const { name, value } = e.target;

    setCertificateForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* ================= APPROVE APPLICATION ================= */

  const approveApplication = async () => {
    if (!selectedApplication) return;

    const confirmed = window.confirm(
      "Kya aap is application ko Approved karna chahte hain?",
    );

    if (!confirmed) return;

    await updateApplicationStatus(selectedApplication._id, "Approved");
  };

  /* ================= ISSUE CERTIFICATE ================= */

  const issueCertificate = async (e) => {
    e.preventDefault();

    if (!selectedApplication) return;

    try {
      setCertificateLoading(true);

      if (selectedApplication.status !== "Approved") {
        await updateApplicationStatus(selectedApplication._id, "Approved");
      }

      alert(
        "Application Approved hai. Certificate PDF + QR + Email ke liye certificate backend endpoint connect karna hoga.",
      );
    } catch (err) {
      console.error("Certificate Error:", err);

      alert(err.message || "Certificate process start nahi ho saka.");
    } finally {
      setCertificateLoading(false);
    }
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.removeItem("jnfuel_admin_token");
    localStorage.removeItem("jnfuel_user_role");

    navigate("/login", { replace: true });
  };

  /* ================= MENU ================= */

  const menuItems = [
    { name: "Dashboard", icon: "⌂" },
    { name: "Applications", icon: "▣" },
    { name: "Employees", icon: "♙" },
    { name: "Partners", icon: "◉" },
    { name: "Payments", icon: "₹" },
    { name: "Documents / KYC", icon: "▤" },
    { name: "Agreements", icon: "▥" },
    { name: "Certificates", icon: "✓" },
    { name: "Field Officers", icon: "⌖" },
    { name: "Reports", icon: "▦" },
    { name: "Admin Settings", icon: "⚙" },
    { name: "Customers", icon: "♙" },
  ];

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setMobileMenu(false);
  };

  /* ================= STATUS CLASS ================= */

  const getStatusClass = (status) => {
    if (!status) return "neutral";

    const value = status.toLowerCase();

    if (
      value.includes("approved") ||
      value.includes("completed") ||
      value.includes("issued") ||
      value.includes("signed") ||
      value.includes("active")
    ) {
      return "success";
    }

    if (
      value.includes("rejected") ||
      value.includes("failed") ||
      value.includes("inactive")
    ) {
      return "danger";
    }

    if (value.includes("pending") || value.includes("review")) {
      return "warning";
    }

    return "neutral";
  };

  /* ================= DASHBOARD STATS ================= */

  const totalApplications = applications.length;

  const underReview = applications.filter(
    (application) => application.status === "Under Review",
  ).length;

  const approved = applications.filter(
    (application) => application.status === "Approved",
  ).length;

  const rejected = applications.filter(
    (application) => application.status === "Rejected",
  ).length;

  const pendingDocuments = applications.filter(
    (application) =>
      application.documentStatus === "Pending" ||
      application.documentStatus === "Under Verification",
  ).length;

  const pendingPayments = applications.filter(
    (application) => application.paymentStatus === "Pending",
  ).length;

  const fieldVerificationPending = applications.filter(
    (application) =>
      application.fieldVerificationStatus === "Pending" ||
      application.fieldVerificationStatus === "Scheduled",
  ).length;

  const agreementsPending = applications.filter(
    (application) =>
      application.agreementStatus === "Pending" ||
      application.agreementStatus === "Generated" ||
      application.agreementStatus === "Sent",
  ).length;

  /* ================= BUSINESS MODELS ================= */

  const businessModelNames = ["FDP", "Mini Pump", "Bowser"];

  const businessModels = businessModelNames.map((modelName) => {
    const count = applications.filter(
      (application) => application.businessModel === modelName,
    ).length;

    const percentage =
      totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;

    return { name: modelName, count, percentage };
  });

  /* ================= STATUS OPTIONS ================= */

  const statusOptions = [
    "Draft",
    "Submitted",
    "Under Review",
    "Documents Pending",
    "Payment Pending",
    "Field Verification Pending",
    "Approved",
    "Rejected",
    "Agreement Pending",
    "Certificate Issued",
    "Completed",
  ];

  /* ================= RENDER ================= */

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}

      <aside className={`admin-sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="admin-logo">
          <div className="admin-logo-icon">JN</div>

          <div>
            <h2>JNFuel</h2>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={activeMenu === item.name ? "active" : ""}
              onClick={() => handleMenuClick(item.name)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <button type="button" className="logout-button" onClick={logout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="admin-main">
        {/* HEADER */}

        <header className="admin-header">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenu((current) => !current)}
          >
            ☰
          </button>

          <div className="admin-header-title">
            <h1>{activeMenu}</h1>
            <p>Manage your JNFuel operations</p>
          </div>

          <div className="admin-header-right">
            <button
              type="button"
              className="notification-button"
              title="Notifications"
            >
              🔔
            </button>

            <div className="admin-user">
              <div className="admin-user-avatar">A</div>

              <div>
                <strong>Administrator</strong>
                <span>Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="admin-content">
          {/* APPLICATION ERROR */}

          {error && (
            <div className="admin-api-error">
              <div>
                <strong>Data unavailable</strong>
                <p>{error}</p>
              </div>

              <button type="button" onClick={loadApplications}>
                Retry
              </button>
            </div>
          )}

          {/* DASHBOARD */}

          {activeMenu === "Dashboard" && (
            <>
              <section className="admin-welcome">
                <div>
                  <span className="welcome-label">ADMIN PORTAL</span>
                  <h2>Welcome back, Administrator</h2>
                  <p>Here's what's happening with your JNFuel operations.</p>
                </div>

                <button
                  type="button"
                  onClick={loadApplications}
                  className="refresh-button"
                >
                  ↻ Refresh Data
                </button>
              </section>

              {loading ? (
                <div className="admin-loading">Loading real data...</div>
              ) : (
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <div className="stat-icon blue">▣</div>
                    <div>
                      <span>Total Applications</span>
                      <strong>{totalApplications}</strong>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon orange">◷</div>
                    <div>
                      <span>Under Review</span>
                      <strong>{underReview}</strong>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon green">✓</div>
                    <div>
                      <span>Approved</span>
                      <strong>{approved}</strong>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon red">×</div>
                    <div>
                      <span>Rejected</span>
                      <strong>{rejected}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* RECENT APPLICATIONS */}

              <section className="admin-section">
                <div className="section-header">
                  <div>
                    <h3>Recent Applications</h3>
                    <p>Latest applications received</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveMenu("Applications")}
                    className="view-all-button"
                  >
                    View All →
                  </button>
                </div>

                <div className="admin-table-wrapper">
                  {!loading && applications.length === 0 && (
                    <div className="admin-empty">
                      <div className="empty-icon">▣</div>
                      <h3>No applications yet</h3>
                      <p>
                        Real applications from your backend will appear here.
                      </p>
                    </div>
                  )}

                  {!loading && applications.length > 0 && (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Application</th>
                          <th>Applicant</th>
                          <th>Business Model</th>
                          <th>Location</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {applications.slice(0, 5).map((application) => (
                          <tr key={application._id}>
                            <td>
                              <strong>
                                {application.applicationNumber || "-"}
                              </strong>
                            </td>

                            <td>{application.applicantName || "-"}</td>

                            <td>{application.businessModel || "-"}</td>

                            <td>{application.preferredLocation || "-"}</td>

                            <td>
                              {application.createdAt
                                ? new Date(
                                    application.createdAt,
                                  ).toLocaleDateString("en-IN")
                                : "-"}
                            </td>

                            <td>
                              <span
                                className={`status-badge ${getStatusClass(
                                  application.status,
                                )}`}
                              >
                                {application.status || "Unknown"}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                onClick={() =>
                                  openApplicationDetails(application)
                                }
                                style={buttonStyles.view}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* PENDING ACTIONS AND BUSINESS MODELS */}

              {!loading && (
                <div className="admin-bottom-grid">
                  <section className="admin-section">
                    <div className="section-header">
                      <div>
                        <h3>Pending Actions</h3>
                        <p>Items requiring attention</p>
                      </div>
                    </div>

                    <div className="pending-list">
                      <div className="pending-item">
                        <span className="pending-icon">▤</span>
                        <div>
                          <strong>Documents Pending</strong>
                          <span>{pendingDocuments} applications</span>
                        </div>
                      </div>

                      <div className="pending-item">
                        <span className="pending-icon">₹</span>
                        <div>
                          <strong>Payments Pending</strong>
                          <span>{pendingPayments} applications</span>
                        </div>
                      </div>

                      <div className="pending-item">
                        <span className="pending-icon">⌖</span>
                        <div>
                          <strong>Field Verification</strong>
                          <span>{fieldVerificationPending} applications</span>
                        </div>
                      </div>

                      <div className="pending-item">
                        <span className="pending-icon">▥</span>
                        <div>
                          <strong>Agreements Pending</strong>
                          <span>{agreementsPending} applications</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="admin-section">
                    <div className="section-header">
                      <div>
                        <h3>Business Models</h3>
                        <p>Application distribution</p>
                      </div>
                    </div>

                    <div className="model-list">
                      {businessModels.map((model) => (
                        <div className="model-item" key={model.name}>
                          <div className="model-top">
                            <span>{model.name}</span>
                            <strong>{model.count}</strong>
                          </div>

                          <div className="model-bar">
                            <span style={{ width: `${model.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}

          {/* APPLICATIONS */}

          {activeMenu === "Applications" && (
            <section className="admin-section full-section">
              <div className="section-header">
                <div>
                  <h3>Applications</h3>
                  <p>All applications from the database</p>
                </div>

                <button
                  type="button"
                  className="refresh-button"
                  onClick={loadApplications}
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="admin-table-wrapper">
                {loading ? (
                  <div className="admin-loading">Loading applications...</div>
                ) : applications.length === 0 ? (
                  <div className="admin-empty">
                    <div className="empty-icon">▣</div>
                    <h3>No applications found</h3>
                    <p>
                      Applications will appear here once customers submit them.
                    </p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Application No.</th>
                        <th>Applicant</th>
                        <th>Mobile</th>
                        <th>Model</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {applications.map((application) => (
                        <tr key={application._id}>
                          <td>
                            <strong>
                              {application.applicationNumber || "-"}
                            </strong>
                          </td>

                          <td>{application.applicantName || "-"}</td>
                          <td>{application.mobile || "-"}</td>
                          <td>{application.businessModel || "-"}</td>
                          <td>{application.preferredLocation || "-"}</td>

                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <select
                                value={application.status || "Submitted"}
                                disabled={updatingId === application._id}
                                onChange={(e) =>
                                  updateApplicationStatus(
                                    application._id,
                                    e.target.value,
                                  )
                                }
                                style={buttonStyles.select}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>

                              {updatingId === application._id && (
                                <span style={{ fontSize: "12px" }}>
                                  Saving...
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() =>
                                openApplicationDetails(application)
                              }
                              style={buttonStyles.primary}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* CUSTOMERS */}

          {activeMenu === "Customers" && (
            <section className="admin-section full-section">
              <div className="section-header">
                <div>
                  <h3>Customer Management</h3>
                  <p>Create and manage customer login accounts</p>
                </div>

                <button
                  type="button"
                  className="refresh-button"
                  onClick={loadCustomers}
                >
                  ↻ Refresh
                </button>
              </div>

              {/* CUSTOMER ERROR */}

              {customerError && (
                <div className="admin-api-error">
                  <div>
                    <strong>Customer operation failed</strong>
                    <p>{customerError}</p>
                  </div>

                  <button type="button" onClick={loadCustomers}>
                    Retry
                  </button>
                </div>
              )}

              {/* CREATED CREDENTIALS */}

              {createdCredentials && (
                <div style={cardStyles.credentials}>
                  <strong style={cardStyles.credentialsTitle}>
                    ✓ Customer Created Successfully
                  </strong>

                  <p style={{ margin: "5px 0" }}>
                    <strong>Mobile no.:</strong> {createdCredentials.customerId}
                  </p>

                  <p style={{ margin: "5px 0" }}>
                    <strong>Name:</strong> {createdCredentials.name}
                  </p>

                  <p style={{ margin: "5px 0" }}>
                    <strong>Temporary Password:</strong>{" "}
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: "700",
                      }}
                    >
                      {createdCredentials.temporaryPassword}
                    </span>
                  </p>

                  <p style={{ marginTop: "12px", fontSize: "13px" }}>
                    Give these credentials to the customer. Customer will be
                    required to change the password on first login.
                  </p>

                  <button
                    type="button"
                    onClick={() => setCreatedCredentials(null)}
                    style={buttonStyles.secondary}
                  >
                    Close
                  </button>
                </div>
              )}

              {/* CREATE CUSTOMER FORM */}

              <div className="admin-section">
                <div className="section-header">
                  <div>
                    <h3>Create Partner Account</h3>
                    <p>Admin creates the customer's login credentials.</p>
                  </div>
                </div>

                <form onSubmit={createCustomer}>
                  <div style={cardStyles.formGrid}>
                    <div>
                      <label style={cardStyles.label}>Mobile no. *</label>

                      <input
                        type="text"
                        name="customerId"
                        value={customerForm.customerId}
                        onChange={(e) => {
                          const value = e.target.value;

                          setCustomerForm((current) => ({
                            ...current,
                            customerId: value,
                            mobile: value,
                          }));
                        }}
                        placeholder="Enter mobile number"
                        required
                        style={cardStyles.input}
                      />
                    </div>

                    <div>
                      <label style={cardStyles.label}>Partner Name *</label>

                      <input
                        type="text"
                        name="name"
                        value={customerForm.name}
                        onChange={handleCustomerInput}
                        placeholder="Customer name"
                        required
                        style={cardStyles.input}
                      />
                    </div>

                    <div>
                      <label style={cardStyles.label}>Email</label>

                      <input
                        type="email"
                        name="email"
                        value={customerForm.email}
                        onChange={handleCustomerInput}
                        placeholder="customer@email.com"
                        style={cardStyles.input}
                      />
                    </div>

                    <div>
                      <label style={cardStyles.label}>
                        Temporary Password *
                      </label>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          name="temporaryPassword"
                          value={customerForm.temporaryPassword}
                          onChange={handleCustomerInput}
                          placeholder="Minimum 8 characters"
                          required
                          style={{ ...cardStyles.input, minWidth: 0 }}
                        />

                        <button
                          type="button"
                          onClick={generateTemporaryPassword}
                          style={buttonStyles.secondary}
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingCustomer}
                    style={{
                      ...buttonStyles.primary,
                      marginTop: "22px",
                      opacity: creatingCustomer ? 0.7 : 1,
                    }}
                  >
                    {creatingCustomer ? "Creating..." : "Create Partner"}
                  </button>
                </form>
              </div>

              {/* CUSTOMER LIST */}

              <div className="admin-section" style={{ marginTop: "24px" }}>
                <div className="section-header">
                  <div>
                    <h3>Partners</h3>
                    <p>All customer accounts</p>
                  </div>
                </div>

                {customerLoading ? (
                  <div className="admin-loading">Loading customers...</div>
                ) : customers.length === 0 ? (
                  <div className="admin-empty">
                    <div className="empty-icon">♙</div>
                    <h3>No customers yet</h3>
                    <p>Customers created by admin will appear here.</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Customer ID</th>
                          <th>Name</th>
                          <th>Mobile</th>
                          <th>Application</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer._id}>
                            <td>
                              <strong>{customer.customerId}</strong>
                            </td>

                            <td>{customer.name}</td>
                            <td>{customer.mobile}</td>
                            <td>{customer.applicationNumber || "-"}</td>

                            <td>
                              <span
                                className={`status-badge ${
                                  customer.active ? "success" : "danger"
                                }`}
                              >
                                {customer.active ? "Active" : "Inactive"}
                              </span>
                            </td>

                            {/* FIXED: BOTH CUSTOMER ACTION BUTTONS */}

                            <td>
                              <div style={buttonStyles.actionGroup}>
                                <button
                                  type="button"
                                  disabled={deletingCustomerId === customer._id}
                                  onClick={() =>
                                    updateCustomerStatus(
                                      customer._id,
                                      !customer.active,
                                    )
                                  }
                                  style={buttonStyles.secondary}
                                >
                                  {customer.active ? "Deactivate" : "Activate"}
                                </button>

                                <button
                                  type="button"
                                  disabled={deletingCustomerId === customer._id}
                                  onClick={() => deleteCustomer(customer)}
                                  style={{
                                    ...buttonStyles.delete,
                                    opacity:
                                      deletingCustomerId === customer._id
                                        ? 0.6
                                        : 1,
                                    cursor:
                                      deletingCustomerId === customer._id
                                        ? "not-allowed"
                                        : "pointer",
                                  }}
                                >
                                  {deletingCustomerId === customer._id
                                    ? "Deleting..."
                                    : "🗑 Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AGREEMENTS */}

          {activeMenu === "Agreements" && (
            <section className="admin-section full-section">
              <div className="section-header">
                <div>
                  <h3>Agreements</h3>
                  <p>Send agreements to customers for signing</p>
                </div>

                <button
                  type="button"
                  className="refresh-button"
                  onClick={loadApplications}
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="admin-table-wrapper">
                {loading ? (
                  <div className="admin-loading">Loading agreements...</div>
                ) : applications.length === 0 ? (
                  <div className="admin-empty">
                    <div className="empty-icon">▥</div>
                    <h3>No applications found</h3>
                    <p>Applications will appear here.</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Application</th>
                        <th>Applicant</th>
                        <th>Mobile</th>
                        <th>Application Status</th>
                        <th>Agreement Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {applications.map((application) => (
                        <tr key={application._id}>
                          <td>
                            <strong>
                              {application.applicationNumber || "-"}
                            </strong>
                          </td>

                          <td>{application.applicantName || "-"}</td>
                          <td>{application.mobile || "-"}</td>

                          <td>
                            <span
                              className={`status-badge ${getStatusClass(
                                application.status,
                              )}`}
                            >
                              {application.status || "-"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${getStatusClass(
                                application.agreementStatus,
                              )}`}
                            >
                              {application.agreementStatus || "Pending"}
                            </span>
                          </td>

                          <td>
                            {application.agreementStatus === "Signed" ||
                            application.agreementStatus === "Completed" ? (
                              <span
                                style={{
                                  fontWeight: "700",
                                  color: "#15803d",
                                }}
                              >
                                ✓ Signed
                              </span>
                            ) : application.agreementStatus === "Sent" ? (
                              <span
                                style={{
                                  fontWeight: "700",
                                  color: "#2563eb",
                                }}
                              >
                                ✓ Sent to User
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => sendAgreement(application._id)}
                                disabled={updatingId === application._id}
                                style={{
                                  ...buttonStyles.primary,
                                  opacity:
                                    updatingId === application._id ? 0.7 : 1,
                                }}
                              >
                                {updatingId === application._id
                                  ? "Sending..."
                                  : "Send Agreement"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* OTHER SECTIONS */}

          {activeMenu !== "Dashboard" &&
            activeMenu !== "Applications" &&
            activeMenu !== "Customers" &&
            activeMenu !== "Agreements" && (
              <section className="admin-section full-section">
                <div className="coming-soon">
                  <div className="coming-icon">
                    {menuItems.find((item) => item.name === activeMenu)?.icon}
                  </div>

                  <h2>{activeMenu}</h2>
                  <p>This module is ready for backend integration.</p>

                  <button
                    type="button"
                    onClick={() => setActiveMenu("Dashboard")}
                    className="back-dashboard-button"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              </section>
            )}
        </div>
      </main>

      {/* APPLICATION DETAILS MODAL */}

      {showApplicationDetails && selectedApplication && (
        <div onClick={closeApplicationDetails} style={modalStyles.overlay}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={modalStyles.container}
          >
            {/* MODAL HEADER */}

            <div style={modalStyles.header}>
              <div>
                <span style={modalStyles.eyebrow}>APPLICATION DETAILS</span>

                <h2 style={{ margin: "5px 0 0", color: "#071b45" }}>
                  {selectedApplication.applicationNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeApplicationDetails}
                style={buttonStyles.close}
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}

            <div style={{ padding: "26px" }}>
              {/* STATUS */}

              <div style={modalStyles.statusPanel}>
                <div>
                  <span style={modalStyles.fieldLabel}>CURRENT STATUS</span>

                  <span
                    className={`status-badge ${getStatusClass(
                      selectedApplication.status,
                    )}`}
                  >
                    {selectedApplication.status || "Unknown"}
                  </span>
                </div>

                <select
                  value={selectedApplication.status || "Submitted"}
                  disabled={updatingId === selectedApplication._id}
                  onChange={(e) =>
                    updateApplicationStatus(
                      selectedApplication._id,
                      e.target.value,
                    )
                  }
                  style={buttonStyles.select}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* CUSTOMER AND BUSINESS DETAILS */}

              <div style={modalStyles.twoColumnGrid}>
                <div style={modalStyles.card}>
                  <h3 style={modalStyles.cardTitle}>Customer Details</h3>

                  <DetailRow
                    label="Applicant Name"
                    value={selectedApplication.applicantName}
                  />
                  <DetailRow
                    label="Father Name"
                    value={selectedApplication.fatherName}
                  />
                  <DetailRow
                    label="Date of Birth"
                    value={selectedApplication.dateOfBirth}
                  />
                  <DetailRow
                    label="Gender"
                    value={selectedApplication.gender}
                  />
                  <DetailRow
                    label="Mobile"
                    value={selectedApplication.mobile}
                  />
                  <DetailRow label="Email" value={selectedApplication.email} />
                </div>

                <div style={modalStyles.card}>
                  <h3 style={modalStyles.cardTitle}>Business Details</h3>

                  <DetailRow
                    label="Business Model"
                    value={selectedApplication.businessModel}
                  />
                  <DetailRow
                    label="Preferred Location"
                    value={selectedApplication.preferredLocation}
                  />
                  <DetailRow
                    label="Application Number"
                    value={selectedApplication.applicationNumber}
                  />
                  <DetailRow
                    label="Submitted On"
                    value={
                      selectedApplication.createdAt
                        ? new Date(
                            selectedApplication.createdAt,
                          ).toLocaleString("en-IN")
                        : "-"
                    }
                  />
                </div>
              </div>

              {/* ADDRESS */}

              <div style={modalStyles.cardSpaced}>
                <h3 style={modalStyles.cardTitle}>Address</h3>

                <div style={modalStyles.addressGrid}>
                  <DetailRow
                    label="Address"
                    value={selectedApplication.address?.line}
                  />
                  <DetailRow
                    label="Village / Town / City"
                    value={selectedApplication.address?.villageTownCity}
                  />
                  <DetailRow
                    label="District"
                    value={selectedApplication.address?.district}
                  />
                  <DetailRow
                    label="State"
                    value={selectedApplication.address?.state}
                  />
                  <DetailRow
                    label="PIN Code"
                    value={selectedApplication.address?.pinCode}
                  />
                </div>
              </div>

              {/* PROCESS STATUS */}

              <div style={modalStyles.cardSpaced}>
                <h3 style={modalStyles.cardTitle}>Process Status</h3>

                <div style={modalStyles.statusGrid}>
                  <StatusBox
                    title="Documents"
                    value={selectedApplication.documentStatus}
                  />
                  <StatusBox
                    title="Payment"
                    value={selectedApplication.paymentStatus}
                  />
                  <StatusBox
                    title="Field Verification"
                    value={selectedApplication.fieldVerificationStatus}
                  />
                  <StatusBox
                    title="Agreement"
                    value={selectedApplication.agreementStatus}
                  />
                  <StatusBox
                    title="Certificate"
                    value={selectedApplication.certificateStatus}
                  />
                </div>
              </div>

              {/* REMARKS */}

              <div style={modalStyles.cardSpaced}>
                <h3 style={modalStyles.cardTitle}>Remarks</h3>

                <p
                  style={{
                    marginBottom: 0,
                    color: "#475467",
                    lineHeight: "1.6",
                  }}
                >
                  {selectedApplication.remarks || "No remarks added."}
                </p>
              </div>

              {/* APPROVAL */}

              <div
                style={{
                  ...modalStyles.approvalPanel,
                  background:
                    selectedApplication.status === "Approved"
                      ? "#ecfdf3"
                      : "#fff8ed",
                  border:
                    selectedApplication.status === "Approved"
                      ? "1px solid #a7f3d0"
                      : "1px solid #fed7aa",
                }}
              >
                <h3 style={modalStyles.cardTitle}>Application Approval</h3>

                <p style={{ color: "#667085", marginTop: 0 }}>
                  {selectedApplication.status === "Approved"
                    ? "This application has been approved."
                    : "Review all customer details before approving the application."}
                </p>

                {selectedApplication.status !== "Approved" && (
                  <button
                    type="button"
                    onClick={approveApplication}
                    disabled={updatingId === selectedApplication._id}
                    style={buttonStyles.primary}
                  >
                    {updatingId === selectedApplication._id
                      ? "Approving..."
                      : "✓ Approve Application"}
                  </button>
                )}
              </div>

              {/* CERTIFICATE DETAILS */}

              {selectedApplication.status === "Approved" && (
                <form
                  onSubmit={issueCertificate}
                  style={modalStyles.certificateForm}
                >
                  <span style={modalStyles.eyebrow}>CERTIFICATE</span>

                  <h3 style={modalStyles.cardTitle}>Certificate Details</h3>

                  <p style={{ color: "#667085", fontSize: "14px" }}>
                    Ye details certificate template mein fill karne ke liye
                    hain. Actual PDF generation ke liye backend endpoint connect
                    hona chahiye.
                  </p>

                  <div style={modalStyles.certificateGrid}>
                    <CertificateInput
                      label="DP ID / License No."
                      name="dpId"
                      value={certificateForm.dpId}
                      onChange={handleCertificateInput}
                      placeholder="e.g. JNF-DP-001"
                    />

                    <CertificateInput
                      label="Certificate No."
                      name="certificateNumber"
                      value={certificateForm.certificateNumber}
                      onChange={handleCertificateInput}
                      placeholder="e.g. JNF-CERT-001"
                    />

                    <CertificateInput
                      label="Valid Up To"
                      name="validUpTo"
                      type="date"
                      value={certificateForm.validUpTo}
                      onChange={handleCertificateInput}
                    />

                    <CertificateInput
                      label="Authorized Area"
                      name="authorizedArea"
                      value={certificateForm.authorizedArea}
                      onChange={handleCertificateInput}
                      placeholder="Authorized area"
                    />
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <label style={cardStyles.label}>Remarks</label>

                    <textarea
                      name="remarks"
                      value={certificateForm.remarks}
                      onChange={handleCertificateInput}
                      rows="4"
                      placeholder="Certificate remarks"
                      style={{
                        ...cardStyles.input,
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div style={modalStyles.qrNotice}>
                    <strong>QR Verification:</strong> Certificate issue hone par
                    system ko unique QR generate karna hoga. QR scan karne par
                    verified details public verification page par show hongi.
                  </div>

                  <button
                    type="submit"
                    disabled={certificateLoading}
                    style={{
                      ...buttonStyles.orange,
                      marginTop: "20px",
                      opacity: certificateLoading ? 0.7 : 1,
                    }}
                  >
                    {certificateLoading ? "Processing..." : "Issue Certificate"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= SHARED STYLES ================= */

const buttonStyles = {
  view: {
    padding: "7px 12px",
    border: "1px solid #d9dee8",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  primary: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "8px",
    background: "#071b45",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  secondary: {
    padding: "9px 12px",
    border: "1px solid #d9dee8",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  delete: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  orange: {
    padding: "13px 22px",
    border: "none",
    borderRadius: "9px",
    background: "#ff8a00",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  close: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "1px solid #d9dee8",
    background: "#fff",
    cursor: "pointer",
    fontSize: "20px",
  },

  select: {
    padding: "9px 10px",
    borderRadius: "8px",
    border: "1px solid #d9dee8",
    background: "#fff",
    cursor: "pointer",
    maxWidth: "100%",
  },

  actionGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
};

const cardStyles = {
  credentials: {
    marginBottom: "24px",
    padding: "20px",
    borderRadius: "14px",
    background: "#ecfdf3",
    border: "1px solid #a7f3d0",
  },

  credentialsTitle: {
    display: "block",
    marginBottom: "10px",
    fontSize: "17px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontWeight: "600",
    color: "#344054",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d9dee8",
    borderRadius: "8px",
    fontFamily: "inherit",
  },
};

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(7, 27, 69, 0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    overflowY: "auto",
  },

  container: {
    width: "100%",
    maxWidth: "1050px",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "18px",
    boxShadow: "0 25px 70px rgba(0,0,0,0.25)",
  },

  header: {
    padding: "22px 26px",
    borderBottom: "1px solid #e6eaf0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 2,
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#ff8a00",
    letterSpacing: "0.08em",
  },

  fieldLabel: {
    display: "block",
    fontSize: "12px",
    color: "#667085",
    marginBottom: "8px",
  },

  statusPanel: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f7f9fc",
    marginBottom: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  card: {
    border: "1px solid #e6eaf0",
    borderRadius: "14px",
    padding: "20px",
  },

  cardSpaced: {
    marginTop: "20px",
    border: "1px solid #e6eaf0",
    borderRadius: "14px",
    padding: "20px",
  },

  cardTitle: {
    marginTop: 0,
    color: "#071b45",
  },

  addressGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  },

  approvalPanel: {
    marginTop: "24px",
    padding: "22px",
    borderRadius: "14px",
  },

  certificateForm: {
    marginTop: "24px",
    padding: "22px",
    border: "1px solid #d9dee8",
    borderRadius: "14px",
    background: "#f8fafc",
  },

  certificateGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  qrNotice: {
    marginTop: "20px",
    padding: "14px 16px",
    borderRadius: "10px",
    background: "#eef4ff",
    border: "1px solid #c7d7fe",
    color: "#344054",
    fontSize: "13px",
    lineHeight: "1.5",
  },
};

/* ================= DETAIL ROW ================= */

function DetailRow({ label, value }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <span
        style={{
          display: "block",
          fontSize: "12px",
          color: "#667085",
          marginBottom: "4px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          color: "#101828",
          wordBreak: "break-word",
        }}
      >
        {value || "-"}
      </strong>
    </div>
  );
}

/* ================= STATUS BOX ================= */

function StatusBox({ title, value }) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "10px",
        background: "#f8fafc",
        border: "1px solid #e6eaf0",
      }}
    >
      <span
        style={{
          display: "block",
          fontSize: "12px",
          color: "#667085",
          marginBottom: "5px",
        }}
      >
        {title}
      </span>

      <strong style={{ color: "#071b45" }}>{value || "Pending"}</strong>
    </div>
  );
}

/* ================= CERTIFICATE INPUT ================= */

function CertificateInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label style={cardStyles.label}>{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          ...cardStyles.input,
          background: "#fff",
        }}
      />
    </div>
  );
}

export default AdminDashboard;
