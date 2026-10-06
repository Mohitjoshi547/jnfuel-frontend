import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import CustomerDashboard from "./components/CustomerDashboard";
import Apply from "./components/Apply";
import ChangePassword from "./components/ChangePassword";
import CertificateVerification from "./components/CertificateVerification";

/* ================================================= */
/* ADMIN PROTECTED ROUTE */
/* ================================================= */

function AdminRoute({ children }) {
  const token = localStorage.getItem(
    "jnfuel_admin_token"
  );

  const role = localStorage.getItem(
    "jnfuel_user_role"
  );

  if (!token || role !== "admin") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

/* ================================================= */
/* CUSTOMER PROTECTED ROUTE */
/* ================================================= */

function CustomerRoute({ children }) {
  const token = localStorage.getItem("jnfuel_token");
  const role = localStorage.getItem("jnfuel_user_role");
  const customer = localStorage.getItem("jnfuel_customer");

  if (!token || role !== "customer" || !customer) {
    return (
      <Navigate to="/login" replace />
    );
  }

  return children;
}

/* ================================================= */
/* APP */
/* ================================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* ================================================= */}
        {/* APPLY */}
        {/* ================================================= */}

        <Route
          path="/apply"
          element={<Apply />}
        />

        {/* ================================================= */}
        {/* PUBLIC CERTIFICATE VERIFICATION */}
        {/* QR CODE IS SCANNED HERE */}
        {/* ================================================= */}

        <Route
          path="/verify/:token"
          element={
            <CertificateVerification />
          }
        />

        {/* ================================================= */}
        {/* ADMIN */}
        {/* ================================================= */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* ================================================= */}
        {/* CHANGE PASSWORD */}
        {/* ================================================= */}

        <Route
          path="/change-password"
          element={<ChangePassword />}
        />

        {/* ================================================= */}
        {/* CUSTOMER */}
        {/* ================================================= */}

        <Route
          path="/customer"
          element={
            <CustomerRoute>
              <CustomerDashboard />
            </CustomerRoute>
          }
        />

        {/* ================================================= */}
        {/* ROOT */}
        {/* ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* ================================================= */}
        {/* UNKNOWN URL */}
        {/* ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;