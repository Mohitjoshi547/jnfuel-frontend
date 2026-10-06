import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    /* ================= VALIDATION ================= */

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    const token = localStorage.getItem("jnfuel_token");

    if (!token) {
      setError(
        "Your session has expired. Please login again."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Password change failed."
        );
      }

      /* ================= SUCCESS ================= */

      setSuccess(
        "Password changed successfully. Redirecting..."
      );

      localStorage.removeItem(
        "jnfuel_must_change_password"
      );

      setTimeout(() => {
        navigate("/customer", {
          replace: true,
        });
      }, 1000);
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setError(
        error.message ||
          "Password change failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.removeItem("jnfuel_token");
    localStorage.removeItem("jnfuel_user");
    localStorage.removeItem("jnfuel_customer");
    localStorage.removeItem(
      "jnfuel_user_role"
    );
    localStorage.removeItem(
      "jnfuel_application_number"
    );
    localStorage.removeItem(
      "jnfuel_must_change_password"
    );

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        fontFamily:
          "DM Sans, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "36px",
          boxShadow:
            "0 10px 40px rgba(7, 27, 69, 0.10)",
        }}
      >
        {/* LOGO */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#ff8a00",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px",
            }}
          >
            JN
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                color: "#071b45",
                fontSize: "22px",
              }}
            >
              JNFuel
            </h2>

            <span
              style={{
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Customer Portal
            </span>
          </div>
        </div>

        {/* HEADING */}

        <h1
          style={{
            margin: "0 0 8px",
            color: "#071b45",
            fontSize: "28px",
          }}
        >
          Change Password
        </h1>

        <p
          style={{
            margin: "0 0 25px",
            color: "#667085",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          For security, you must change your
          temporary password before accessing
          your customer dashboard.
        </p>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginBottom: "18px",
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

        {/* SUCCESS */}

        {success && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#edf9f1",
              color: "#16803c",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleSubmit}>

          {/* CURRENT PASSWORD */}

          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#071b45",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Temporary Password
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #e3e8ef",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <input
                type={
                  showCurrent
                    ? "text"
                    : "password"
                }
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(
                    e.target.value
                  )
                }
                placeholder="Enter temporary password"
                required
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "13px 14px",
                  fontSize: "14px",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowCurrent(
                    !showCurrent
                  )
                }
                style={{
                  border: "none",
                  background: "#ffffff",
                  padding: "0 14px",
                  cursor: "pointer",
                  color: "#667085",
                }}
              >
                {showCurrent
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* NEW PASSWORD */}

          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#071b45",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              New Password
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #e3e8ef",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <input
                type={
                  showNew
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                placeholder="Enter new password"
                required
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "13px 14px",
                  fontSize: "14px",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowNew(!showNew)
                }
                style={{
                  border: "none",
                  background: "#ffffff",
                  padding: "0 14px",
                  cursor: "pointer",
                  color: "#667085",
                }}
              >
                {showNew
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            <small
              style={{
                display: "block",
                marginTop: "6px",
                color: "#667085",
                fontSize: "12px",
              }}
            >
              Minimum 8 characters.
            </small>
          </div>

          {/* CONFIRM PASSWORD */}

          <div
            style={{
              marginBottom: "24px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#071b45",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Confirm New Password
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #e3e8ef",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <input
                type={
                  showConfirm
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm new password"
                required
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "13px 14px",
                  fontSize: "14px",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirm(
                    !showConfirm
                  )
                }
                style={{
                  border: "none",
                  background: "#ffffff",
                  padding: "0 14px",
                  cursor: "pointer",
                  color: "#667085",
                }}
              >
                {showConfirm
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "8px",
              padding: "14px",
              background: loading
                ? "#9aa4b2"
                : "#ff8a00",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Changing Password..."
              : "Change Password"}
          </button>

        </form>

        {/* LOGOUT */}

        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            marginTop: "14px",
            border: "1px solid #e3e8ef",
            borderRadius: "8px",
            padding: "12px",
            background: "#ffffff",
            color: "#071b45",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default ChangePassword;