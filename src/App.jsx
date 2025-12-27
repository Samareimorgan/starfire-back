import { Routes, Route, Link } from "react-router-dom";
import AstroForm from "./pages/AstroForm.jsx";
import SigilSync from "./pages/SigilSync.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import GenerateSigil from "./pages/GenerateSigil.jsx";

import "./App.css";

export default function App() {
  return (
    <>
      {/* Simple navigation */}
      <nav style={{ display: "flex", gap: 16, padding: 16 }}>
        <Link to="/">Astro Portrait</Link>
        <Link to="/sigilsync">SigilSync</Link>
        <Link to="/admin">Admin</Link>
      </nav>

      <Routes>
        {/* Existing pages */}
        <Route path="/" element={<AstroForm />} />
        <Route path="/sigilsync" element={<SigilSync />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="/admin/generate-sigil" element={<RequireAdmin><GenerateSigil /></RequireAdmin>} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Routes>
    </>
  );
}
