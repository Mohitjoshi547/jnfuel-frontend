import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Apply.css";

function Apply() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    applicantName: "",
    fatherName: "",
    dateOfBirth: "",
    gender: "",
    mobile: "",
    email: "",
    aadhaarNumber: "",
    businessModel: "",
    preferredLocation: "",
    addressLine: "",
    villageTownCity: "",
    district: "",
    state: "",
    pinCode: "",
    remarks: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  /* ================================================= */
  /* EXISTING CUSTOMER KO APPLY FORM NAHI DIKHANA */
  /* ================================================= */

  useEffect(() => {
    const customerToken = localStorage.getItem("jnfuel_token");
    const userRole = localStorage.getItem("jnfuel_user_role");

    if (customerToken && userRole === "customer") {
      navigate("/customer", { replace: true });
    }
  }, [navigate]);

  /* ================================================= */
  /* INPUT CHANGE */
  /* ================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================================================= */
  /* AADHAAR INPUT CHANGE */
  /* ================================================= */

  const handleAadhaarChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 12);

    setFormData((prev) => ({
      ...prev,
      aadhaarNumber: value,
    }));
  };

  /* ================================================= */
  /* SUBMIT APPLICATION */
  /* ================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
        throw new Error("Please enter a valid 12-digit Aadhaar number.");
      }

      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantName: formData.applicantName.trim(),
          fatherName: formData.fatherName.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          mobile: formData.mobile.trim(),
          email: formData.email.trim(),

          // Aadhaar number is sent to the backend.
          aadhaarNumber: formData.aadhaarNumber,

          businessModel: formData.businessModel,
          preferredLocation: formData.preferredLocation.trim(),

          address: {
            line: formData.addressLine.trim(),
            villageTownCity: formData.villageTownCity.trim(),
            district: formData.district.trim(),
            state: formData.state.trim(),
            pinCode: formData.pinCode.trim(),
          },

          remarks: formData.remarks.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Application submit nahi ho saki.");
      }

      const applicationNumber = data.application?.applicationNumber;

      if (!applicationNumber) {
        throw new Error(
          "Application submit hui, lekin application number receive nahi hua. Admin se verify karein."
        );
      }

      localStorage.setItem(
        "jnfuel_application_number",
        applicationNumber
      );

      localStorage.setItem("jnfuel_application_submitted", "true");

      alert(
        `Application submitted successfully!\n\nApplication Number: ${applicationNumber}`
      );

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Application submit error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apply-page">
      {/* HEADER */}

      <header className="apply-header">
        <div className="apply-logo">
          <div className="apply-logo-icon">JN</div>

          <div>
            <h2>JNFuel</h2>
            <span>Fuel Your Future</span>
          </div>
        </div>

        <button
          type="button"
          className="apply-login-btn"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </header>

      {/* MAIN */}

      <main className="apply-container">
        <div className="apply-heading">
          <span>PARTNER WITH JNFUEL</span>

          <h1>
            Apply for <strong>JNFuel</strong>
          </h1>

          <p>Submit your application to become a JNFuel partner.</p>
        </div>

        {error && (
          <div className="apply-error" role="alert">
            {error}
          </div>
        )}

        {/* APPLICATION FORM */}

        <form className="apply-form" onSubmit={handleSubmit}>
          {/* 01 PERSONAL DETAILS */}

          <section className="form-section">
            <div className="section-title">
              <span>01</span>

              <div>
                <h2>Personal Details</h2>
                <p>Enter your basic personal information</p>
              </div>
            </div>

            <div className="form-grid">
              {/* Applicant Name */}

              <div className="form-group">
                <label htmlFor="applicantName">
                  Applicant Name <b>*</b>
                </label>

                <input
                  id="applicantName"
                  type="text"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleChange}
                  placeholder="Enter applicant name"
                  autoComplete="name"
                  required
                />
              </div>

              {/* Father's Name */}

              <div className="form-group">
                <label htmlFor="fatherName">Father's Name</label>

                <input
                  id="fatherName"
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="Enter father's name"
                />
              </div>

              {/* Date of Birth */}

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>

                <input
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              {/* Gender */}

              <div className="form-group">
                <label htmlFor="gender">Gender</label>

                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Mobile */}

              <div className="form-group">
                <label htmlFor="mobile">
                  Mobile <b>*</b>
                </label>

                <input
                  id="mobile"
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  autoComplete="tel"
                  required
                />
              </div>

              {/* Email */}

              <div className="form-group">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  autoComplete="email"
                />
              </div>

              {/* AADHAAR NUMBER */}

              <div className="form-group">
                <label htmlFor="aadhaarNumber">
                  Aadhaar Number <b>*</b>
                </label>

                <input
                  id="aadhaarNumber"
                  type="password"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleAadhaarChange}
                  placeholder="Enter 12-digit Aadhaar number"
                  inputMode="numeric"
                  maxLength={12}
                  pattern="[0-9]{12}"
                  autoComplete="off"
                  aria-describedby="aadhaarHelp"
                  required
                />

                <small id="aadhaarHelp">
                  Enter 12 digits. Your number is hidden while typing.
                </small>
              </div>
            </div>
          </section>

          {/* 02 BUSINESS DETAILS */}

          <section className="form-section">
            <div className="section-title">
              <span>02</span>

              <div>
                <h2>Business Details</h2>
                <p>Tell us about your proposed JNFuel business</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="businessModel">Business Model</label>

                <select
                  id="businessModel"
                  name="businessModel"
                  value={formData.businessModel}
                  onChange={handleChange}
                >
                  <option value="">Select Business Model</option>
                  <option value="FDP">FDP</option>
                  <option value="Mini Pump">Mini Pump</option>
                  <option value="Bowser">Bowser</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="preferredLocation">
                  Preferred Location
                </label>

                <input
                  id="preferredLocation"
                  type="text"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleChange}
                  placeholder="Enter preferred location"
                />
              </div>
            </div>
          </section>

          {/* 03 ADDRESS */}

          <section className="form-section">
            <div className="section-title">
              <span>03</span>

              <div>
                <h2>Address</h2>
                <p>Provide your complete address details</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="addressLine">Address Line</label>

                <input
                  id="addressLine"
                  type="text"
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleChange}
                  placeholder="House / Street / Area"
                />
              </div>

              <div className="form-group">
                <label htmlFor="villageTownCity">
                  Village / Town / City
                </label>

                <input
                  id="villageTownCity"
                  type="text"
                  name="villageTownCity"
                  value={formData.villageTownCity}
                  onChange={handleChange}
                  placeholder="Enter village / town / city"
                />
              </div>

              <div className="form-group">
                <label htmlFor="district">District</label>

                <input
                  id="district"
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Enter district"
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>

                <input
                  id="state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pinCode">PIN Code</label>

                <input
                  id="pinCode"
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  placeholder="Enter PIN code"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>
            </div>
          </section>

          {/* 04 ADDITIONAL INFORMATION */}

          <section className="form-section">
            <div className="section-title">
              <span>04</span>

              <div>
                <h2>Additional Information</h2>
                <p>Add any additional information or remarks</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="remarks">Remarks</label>

                <textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter any additional information..."
                  rows={5}
                />
              </div>
            </div>
          </section>

          {/* SUBMIT */}

          <div className="submit-area">
            <p>
              By submitting this application, you confirm that the information
              provided by you is accurate and complete.
            </p>

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default Apply;