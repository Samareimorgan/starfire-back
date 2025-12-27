import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";

function getToken() {
  return localStorage.getItem("admin_token");
}

async function adminGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function ConfirmModal({ open, title, children, onClose, onConfirm, confirmText = "Confirm" }) {
  if (!open) return null;
  return (
    <div className="ss-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ss-modal">
        <div className="ss-modal-head">
          <div className="ss-modal-title">{title}</div>
          <button type="button" className="ss-modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="ss-modal-body">
          {children}
          <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
            <button type="button" className="button btn-default" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="button btn-primary" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const [health, setHealth] = useState(null);
  const [activity, setActivity] = useState([]);
  const [status, setStatus] = useState({ type: "idle", msg: "" });
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRow, setPendingRow] = useState(null);


  const totals = useMemo(() => {
    const total = activity.length;
    const unique = new Set(activity.map((x) => x.sentTo)).size;
    const failed = activity.filter((x) => x.status === "failed").length;
    return { total, unique, failed };
  }, [activity]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    nav("/admin");
  };

  const load = async () => {
    setStatus({ type: "sending", msg: "Loading..." });
    try {
      const h = await adminGet("/api/admin/health");
      const a = await adminGet("/api/admin/email-activity");
      setHealth(h);
      setActivity(a.items || []);
      setStatus({ type: "idle", msg: "" });
    } catch (e) {
      setStatus({ type: "error", msg: e.message || "Failed to load" });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusClass =
    status.type === "error"
      ? "alert-error"
      : status.type === "success"
      ? "alert-success"
      : "alert-info";

  const displayName = (row) =>
    row?.name || row?.form?.currentName || row?.form?.birthName || "this user";
         

  return (
    <div className="smart-wrap" style={{ padding: "22px 0" }}>
      <div className="smart-forms smart-container" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="theme-purple">
          {/* HEADER */}
          <div
            className="form-header header-purple"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
              <ConfirmModal
                open={confirmOpen}
                title="Generate Sigil"
                onClose={() => {
                  setConfirmOpen(false);
                  setPendingRow(null);
                  setSelectedIdx(null);
                }}
                onConfirm={() => {
                  const row = pendingRow;
                  if (!row) return;

                  sessionStorage.setItem("selected_sigil_user", JSON.stringify(row));
                  nav("/admin/generate-sigil", { state: { selectedRow: row } });
                }}
                confirmText="Yes, continue"
              >
                <p style={{ margin: 0, opacity: 0.9 }}>
                  Generate sigil for <b>{displayName(pendingRow)}</b>?
                </p>
              </ConfirmModal>

            <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <i className="fa fa-dashboard" />
              Admin Dashboard{" "}
              <span style={{ opacity: 0.85, fontWeight: 700 }}>
                {health?.admin ? `(${health.admin})` : ""}
              </span>
            </h4>

            <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="button btn-primary" onClick={load}>
                  <i className="fa fa-refresh" style={{ marginRight: 8 }} />
                  Refresh
                </button>

                <button
                  type="button"
                  className="button btn-default"
                  onClick={() => nav("/admin/settings")}
                >
                  <i className="fa fa-cog" style={{ marginRight: 8 }} />
                  Settings
                </button>

                <button type="button" className="button btn-default" onClick={logout}>
                  <i className="fa fa-sign-out" style={{ marginRight: 8 }} />
                  Logout
                </button>
              </div>

          </div>

          {/* STATUS */}
          {status.type !== "idle" && (
            <div className={`notification ${statusClass}`} style={{ margin: "14px 18px 0" }}>
              <p style={{ margin: 0 }}>{status.msg}</p>
            </div>
          )}

          {/* BODY */}
          <div className="form-body" style={{ padding: 18 }}>
            {/* OVERVIEW CARDS */}
            <div className="frm-row">
              <div className="section colm colm4">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: 14,
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                    Emails Sent (last 50)
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{totals.total}</div>
                </div>
              </div>

              <div className="section colm colm4">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: 14,
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                    Unique Recipients
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{totals.unique}</div>
                </div>
              </div>

              <div className="section colm colm4">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: 14,
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                    Failed Sends
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{totals.failed}</div>
                </div>
              </div>
            </div>

            {/* ACTIVITY TABLE */}
            <div className="section" style={{ marginTop: 8 }}>
              <h5 style={{ margin: "0 0 10px" }}>
                <i className="fa fa-envelope" style={{ marginRight: 8 }} />
                Recent Email Activity
              </h5>

              {activity.length === 0 ? (
                <div className="notification alert-info">
                  <p style={{ margin: 0 }}>
                    No emails logged yet. Send one from SigilSync and click Refresh.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto", background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: "left", background: "rgba(155, 89, 182, 0.08)" }}>
                        <th style={{ padding: "12px 10px" }}>Time</th>
                        <th style={{ padding: "12px 10px" }}>Status</th>
                        <th style={{ padding: "12px 10px" }}>Sent To</th>
                        <th style={{ padding: "12px 10px" }}>Name</th>
                        <th style={{ padding: "12px 10px" }}>DOB</th>
                        <th style={{ padding: "12px 10px" }}>Intent</th>
                        <th style={{ padding: "12px 10px" }}>Actions</th>

                      </tr>
                    </thead>

                    <tbody>
                      {activity.map((row, idx) => (
                        <tr
                        key={idx}
                        style={{
                          borderTop: "1px solid rgba(0,0,0,0.08)",
                          outline: selectedIdx === idx ? "2px solid rgba(155, 89, 182, 0.45)" : "none",
                          background: selectedIdx === idx ? "rgba(155, 89, 182, 0.06)" : "transparent",
                          transition: "background 120ms ease, outline 120ms ease",
                        }}
                      >                     
                          <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                            {row.at ? new Date(row.at).toLocaleString() : "—"}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontWeight: 800,
                                fontSize: 12,
                                background:
                                  row.status === "failed"
                                    ? "rgba(231, 76, 60, 0.12)"
                                    : "rgba(46, 204, 113, 0.12)",
                              }}
                            >
                              {row.status || "sent"}
                            </span>
                          </td>

                          <td style={{ padding: "12px 10px" }}>{row.sentTo || "—"}</td>

                          <td style={{ padding: "12px 10px" }}>
                            {row.name || row.form?.currentName || row.form?.birthName || "—"}
                          </td>

                          <td style={{ padding: "12px 10px" }}>{row.dob || row.form?.dob || "—"}</td>

                          <td style={{ padding: "12px 10px", maxWidth: 280 }}>
                            <span style={{ opacity: 0.9 }}>{row.intent || "—"}</span>
                          </td>
                          <td style={{ padding: "12px 10px" }}>
                            {row.hasSigil ? (
                              <button
                                type="button"
                                className="button btn-purple"
                                onClick={() => {
                                  // optional: highlight row
                                  setSelectedIdx(idx);

                                  // pass sigilUrl so Generate page loads preview immediately
                                  nav("/admin/generate-sigil", { state: { selectedRow: row, previewUrl: row.sigilUrl } });
                                }}
                              >
                                <i className="fa fa-eye" style={{ marginRight: 8 }} />
                                Preview Sigil
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="button btn-primary"
                                onClick={() => {
                                  setSelectedIdx(idx);
                                  setPendingRow(row);
                                  setConfirmOpen(true);
                                }}
                              >
                                <i className="fa fa-magic" style={{ marginRight: 8 }} />
                                Generate Sigil
                              </button>
                            )}
                          </td>


                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="notification alert-info" style={{ marginTop: 14 }}>
              <p style={{ margin: 0 }}>
                Activity is read from <b>data/email_log.jsonl</b>.
              </p>
            </div>
          </div>
          {/* END BODY */}
        </div>
      </div>
    </div>
  );
}
