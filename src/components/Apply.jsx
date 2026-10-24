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

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  /* SUBMIT APPLICATION */
  /* ================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantName: formData.applicantName,
          fatherName: formData.fatherName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          mobile: formData.mobile,
          email: formData.email,
          aadhaarNumber: formData.aadhaarNumber,
          businessModel: formData.businessModel,
          preferredLocation: formData.preferredLocation,

          address: {
            line: formData.addressLine,
            villageTownCity: formData.villageTownCity,
            district: formData.district,
            state: formData.state,
            pinCode: formData.pinCode,
          },

          remarks: formData.remarks,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Application submit nahi ho saki");
      }

      const applicationNumber = data.application.applicationNumber;

      /* SAVE APPLICATION NUMBER */

      localStorage.setItem("jnfuel_application_number", applicationNumber);

      localStorage.setItem("jnfuel_application_submitted", "true");

      alert(
        `Application submitted successfully!\n\nApplication Number: ${applicationNumber}`,
      );

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Application submit error:", error);

      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apply-page">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

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

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="apply-container">
        {/* ================================================= */}
        {/* HEADING */}
        {/* ================================================= */}

        <div className="apply-heading">
          <span>PARTNER WITH JNFUEL</span>

          <h1>
            Apply for <strong>JNFuel</strong>
          </h1>

          <p>Submit your application to become a JNFuel partner.</p>
        </div>

        {/* ERROR */}

        {error && <div className="apply-error">{error}</div>}

        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <form className="apply-form" onSubmit={handleSubmit}>
          {/* ================================================= */}
          {/* PERSONAL DETAILS */}
          {/* ================================================= */}

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
                <label>
                  Applicant Name <b>*</b>
                </label>

                <input
                  type="text"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleChange}
                  placeholder="Enter applicant name"
                  required
                />
              </div>

              {/* Father's Name */}

              <div className="form-group">
                <label>Father's Name</label>

                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="Enter father's name"
                />
              </div>

              {/* DOB */}

              <div className="form-group">
                <label>Date of Birth</label>

                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              {/* Gender */}

              <div className="form-group">
                <label>Gender</label>

                <select
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
                <label>
                  Mobile <b>*</b>
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              {/* Email */}
               {/* Aadhaar Number */}

            <div className="form-group">
              <label>
                Aadhaar Number <b>*</b>
              </label>

              <input
                type="password"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  if (value.length <= 12) {
                    setFormData((prev) => ({
                      ...prev,
                      aadhaarNumber: value,
                    }));
                  }
                }}
                placeholder="Enter 12-digit Aadhaar number"
                inputMode="numeric"
                maxLength={12}
                pattern="[0-9]{12}"
                autoComplete="off"
                required
              />
            </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>
            </div>
           
          </section>

          {/* ================================================= */}
          {/* BUSINESS DETAILS */}
          {/* ================================================= */}

          <section className="form-section">
            <div className="section-title">
              <span>02</span>

              <div>
                <h2>Business Details</h2>

                <p>Tell us about your proposed JNFuel business</p>
              </div>
            </div>

            <div className="form-grid">
              {/* Business Model */}

              <div className="form-group">
                <label>Business Model</label>

                <select
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

              {/* Preferred Location */}

              <div className="form-group">
                <label>Preferred Location</label>

                <input
                  type="text"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleChange}
                  placeholder="Enter preferred location"
                />
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* ADDRESS */}
          {/* ================================================= */}

          <section className="form-section">
            <div className="section-title">
              <span>03</span>

              <div>
                <h2>Address</h2>

                <p>Provide your complete address details</p>
              </div>
            </div>

            <div className="form-grid">
              {/* Address Line */}

              <div className="form-group full-width">
                <label>Address Line</label>

                <input
                  type="text"
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleChange}
                  placeholder="House / Street / Area"
                />
              </div>

              {/* Village */}

              <div className="form-group">
                <label>Village / Town / City</label>

                <input
                  type="text"
                  name="villageTownCity"
                  value={formData.villageTownCity}
                  onChange={handleChange}
                  placeholder="Enter village / town / city"
                />
              </div>

              {/* District */}

              <div className="form-group">
                <label>District</label>

                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Enter district"
                />
              </div>

              {/* State */}

              <div className="form-group">
                <label>State</label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>

              {/* PIN */}

              <div className="form-group">
                <label>PIN Code</label>

                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  placeholder="Enter PIN code"
                  maxLength="6"
                />
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* ADDITIONAL INFORMATION */}
          {/* ================================================= */}

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
                <label>Remarks</label>

                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter any additional information..."
                  rows="5"
                />
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* SUBMIT */}
          {/* ================================================= */}

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
