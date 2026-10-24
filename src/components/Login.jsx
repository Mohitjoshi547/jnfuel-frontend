import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      /* ================================================= */
      /* ADMIN LOGIN */
      /* ================================================= */

      if (loginType === "admin") {
        const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Admin login failed");
        }

        /* Save admin session */

        localStorage.setItem("jnfuel_admin_token", data.token);

        localStorage.setItem("jnfuel_user_role", "admin");

        /* Remove customer session if any */

        localStorage.removeItem("jnfuel_token");
        localStorage.removeItem("jnfuel_customer");
        localStorage.removeItem("jnfuel_user");
        localStorage.removeItem("jnfuel_application_number");
        localStorage.removeItem("jnfuel_must_change_password");

        navigate("/admin", {
          replace: true,
        });

        return;
      }

      /* ================================================= */
      /* CUSTOMER LOGIN */
      /* ================================================= */

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid Customer ID or password");
      }

      /* ================================================= */
      /* SAVE CUSTOMER SESSION */
      /* ================================================= */

      localStorage.setItem("jnfuel_token", data.token);

      localStorage.setItem("jnfuel_user_role", "customer");

      localStorage.setItem("jnfuel_user", JSON.stringify(data.customer));

      localStorage.setItem("jnfuel_customer", JSON.stringify(data.customer));

      /* ================================================= */
      /* SAVE APPLICATION NUMBER */
      /* ================================================= */

      if (data.customer?.applicationNumber) {
        localStorage.setItem(
          "jnfuel_application_number",
          data.customer.applicationNumber,
        );
      } else {
        localStorage.removeItem("jnfuel_application_number");
      }

      /* ================================================= */
      /* FIRST LOGIN CHECK */
      /* ================================================= */

      if (data.mustChangePassword) {
        localStorage.setItem("jnfuel_must_change_password", "true");
      } else {
        localStorage.removeItem("jnfuel_must_change_password");
      }
      /* ================================================= */
      /* FIRST LOGIN → CHANGE PASSWORD */
      /* ================================================= */

      if (data.mustChangePassword) {
        navigate("/change-password", {
          replace: true,
        });

        return;
      }

      /* ================================================= */
      /* CUSTOMER DASHBOARD */
      /* ================================================= */

      navigate("/customer", {
        replace: true,
      });
    } catch (error) {
      console.error("Login error:", error);

      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================================================= */
  /* SWITCH LOGIN TYPE */
  /* ================================================= */

  const switchLoginType = (type) => {
    setLoginType(type);
    setShowPassword(false);
    setError("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* ================================================= */}
        {/* LEFT SIDE */}
        {/* ================================================= */}

        <div className="login-left">
          <div className="login-brand">
            <div className="customer-logo">
              <img
                src="/jnfuellogo.jpeg"
                alt="JN Fuel Logo"
                className="customer-logo-image"
              />

              <div>
                <h2>JNFuel</h2>
                <span>Fuel Business Solutions</span>
              </div>
            </div>

            <div>
              <h2>JNFuel</h2>

              <span>Fuel Business Solutions</span>
            </div>
          </div>

          <div className="login-left-content">
            <h1>
              Manage your
              <br />
              <span>fuel business</span>
              <br />
              with ease.
            </h1>

            <p>
              Access your JNFuel account to manage applications, documents,
              payments and business activities.
            </p>

            <div className="login-features">
              <div>
                <span className="feature-icon">✓</span>

                <div>
                  <strong>Easy Management</strong>

                  <p>Manage everything from one place.</p>
                </div>
              </div>

              <div>
                <span className="feature-icon">✓</span>

                <div>
                  <strong>Secure Access</strong>

                  <p>Your information stays protected.</p>
                </div>
              </div>

              <div>
                <span className="feature-icon">✓</span>

                <div>
                  <strong>Real-time Updates</strong>

                  <p>Track your application status easily.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="left-footer">© 2026 JNFuel. All rights reserved.</div>
        </div>

        {/* ================================================= */}
        {/* RIGHT SIDE */}
        {/* ================================================= */}

        <div className="login-right">
          <div className="login-card">
            {/* MOBILE LOGO */}

            <div className="mobile-logo">
              <div className="customer-logo">
                <img
                  src="/jnfuellogo.jpeg"
                  alt="JN Fuel Logo"
                  className="customer-logo-image"
                />
              </div>

            </div>

            {/* HEADING */}

            <div className="login-heading">
              <h1>Welcome back</h1>

              <p>
                {loginType === "admin"
                  ? "Sign in to your Admin Portal"
                  : "Sign in to your Partner Portal"}
              </p>
            </div>

            {/* ================================================= */}
            {/* ADMIN / CUSTOMER TABS */}
            {/* ================================================= */}

            <div className="login-tabs">
              <button
                type="button"
                className={loginType === "admin" ? "active" : ""}
                onClick={() => switchLoginType("admin")}
              >
                <span>⚙</span>
                Admin
              </button>

              <button
                type="button"
                className={loginType === "customer" ? "active" : ""}
                onClick={() => switchLoginType("customer")}
              >
                <span>♙</span>
                Partner
              </button>
            </div>

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#fff1f0",
                  color: "#c62828",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* ================================================= */}
            {/* LOGIN FORM */}
            {/* ================================================= */}

            <form onSubmit={handleSubmit}>
              {/* USERNAME / CUSTOMER ID */}

              <div className="form-group">
                <label>
                  {loginType === "admin"
                    ? "User ID / mobile no."
                    : "Customer ID"}
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">
                    {loginType === "admin" ? "◉" : "♙"}
                  </span>

                  <input
                    type="text"
                    placeholder={
                      loginType === "admin"
                        ? "Enter your username"
                        : "Enter your Customer ID"
                    }
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="form-group">
                <label>Password</label>

                <div className="input-wrapper">
                  <span className="input-icon">●</span>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* OPTIONS */}

              <div className="login-options">
                <label className="remember">
                  <input type="checkbox" />

                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert("Forgot Password feature will be added later.")
                  }
                >
                  Forgot Password?
                </button>
              </div>

              {/* SIGN IN */}

              <button
                type="submit"
                className="signin-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}

                {!loading && <span>→</span>}
              </button>
            </form>

            {/* ================================================= */}
            {/* CUSTOMER APPLY */}
            {/* ================================================= */}

            {loginType === "customer" && (
              <div className="customer-help">
                <p>
                  Don't have an account?
                  <button type="button" onClick={() => navigate("/apply")}>
                    Apply for JNFuel
                  </button>
                </p>
              </div>
            )}

            {/* SECURITY */}

            <div className="secure-login">
              <span>🔒</span>
              Secure & encrypted login
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
