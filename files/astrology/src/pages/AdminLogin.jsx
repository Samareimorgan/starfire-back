import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";

export default function AdminLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [status, setStatus] = useState({ type: "idle", msg: "" });

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "sending", msg: "Signing in..." });

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("admin_token", data.token);
      setStatus({ type: "success", msg: "Welcome ✅" });
      nav("/admin/dashboard");
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Login failed" });
    }
  };

  return (
    <div className="smart-wrap">
      <div className="smart-forms smart-container wrap-2" style={{ maxWidth: 520, margin: "24px auto" }}>
        <div className="theme-purple">
        <div className="form-header header-purple">
          <h4 style={{ margin: 0 }}>
            <i className="fa fa-lock" style={{ marginRight: 10 }} />
            Admin Login
          </h4>
        </div>

        <form className="form-body" onSubmit={onSubmit} noValidate>
          <div className="section">
            <label className="field-label">Username</label>
            <label className="field prepend-icon">
              <input
                className="gui-input"
                value={form.username}
                onChange={onChange("username")}
                placeholder="admin"
                autoComplete="username"
              />
              <span className="field-icon">
                <i className="fa fa-user" />
              </span>
            </label>
          </div>

          <div className="section">
            <label className="field-label">Password</label>
            <label className="field prepend-icon">
              <input
                className="gui-input"
                type="password"
                value={form.password}
                onChange={onChange("password")}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <span className="field-icon">
                <i className="fa fa-key" />
              </span>
            </label>
          </div>

          {status.type !== "idle" && (
            <div
              className={`notification ${
                status.type === "error" ? "alert-error" : "alert-success"
              }`}
              style={{ marginTop: 10 }}
            >
              <p style={{ margin: 0 }}>{status.msg}</p>
            </div>
          )}

          <div className="form-footer">
            <button
              type="submit"
              className="button btn-purple"
              disabled={status.type === "sending"}
            >
              {status.type === "sending" ? "Signing in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
