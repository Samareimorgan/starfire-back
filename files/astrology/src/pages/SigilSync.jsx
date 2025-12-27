import React, { useMemo, useState } from "react";
import "../SigilSync.css";
import { calculateNumerology } from "../lib/numerology";
import { Link } from "react-router-dom";



const METRICS = [
  "Life Path",
  "Expression",
  "Soul Urge",
  "Personality",
  "Birthday",
  "Maturity",
  "Personal Year",
  "Personal Month",
  "Personal Day",
];

const INTENT_OPTIONS = [
  "Clarity",
  "Healing",
  "Peace",
  "Purpose",
  "Love",
  "Confidence",
  "Direction",
  "Energy",
  "Protection",
  "Strength",
  "Balance",
  "Growth",
  "Release",
  "Renewal",
  "Joy",
  "Focus",
  "Trust",
  "Connection",
  "Abundance",
  "Awakening",
];




function Modal({ open, title, children, onClose }) {
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
          <div className="ss-modal-body">{children}</div>
        </div>
      </div>
    );
  }
  

export default function SigilSync() {
  // ✅ Clean defaults (no real-looking placeholder data)
  const [askEmailOpen, setAskEmailOpen] = useState(false);
  const [showEmailFields, setShowEmailFields] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ type: "idle", msg: "" });
// type: "idle" | "sending" | "success" | "error"


  const [form, setForm] = useState({
    birthName: "",
    currentName: "",
    dob: "",
    calcDate: "",
    birthTime: "",
    zip: "",
    city: "",
    state: "",
    country: "US",
    tz: "",
    email: "",
    intent: "",
  });

  // ✅ Empty results until Calculate is clicked
  const [metrics, setMetrics] = useState(null);

  const errors = useMemo(() => {
    const e = {};
    if (!form.birthName.trim()) e.birthName = "Birth name is required.";
    if (!form.dob.trim()) e.dob = "Date of birth is required.";
    if (!form.calcDate.trim()) e.calcDate = "Calculation date is required.";
    return e;
  }, [form.birthName, form.dob, form.calcDate]);

  const onChange = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const onCalculate = (e) => {
    e.preventDefault();
    if (Object.keys(errors).length) return;
  
    const results = calculateNumerology({
      birthName: form.birthName,
      currentName: form.currentName,
      dob: form.dob,
      calcDate: form.calcDate,
      keepMasters: true,
      masters: [11, 22, 33],
      treatYAsVowel: true,
    });
  
    setMetrics(results);
    setAskEmailOpen(true);
  };
  

  // Optional demo fill (intentional)
  const onExample = () => {
    const ex = {
      birthName: "Jane Ann Doe",
      currentName: "Jane A. Doe",
      dob: "06/20/1970",
      calcDate: "09/19/2025",
      birthTime: "08:57 PM",
      zip: "43072",
      city: "Saint Paris",
      state: "OH",
      country: "US",
      tz: "America/Chicago",
    };
    setForm(ex);
  
    setMetrics(
      calculateNumerology({
        birthName: ex.birthName,
        currentName: ex.currentName,
        dob: ex.dob,
        calcDate: ex.calcDate,
      })
    );
  };
  
  const API_BASE = "http://localhost:4000";

  const sendReadingEmail = async () => {
    if (!metrics) {
      setEmailStatus({ type: "error", msg: "Please calculate first." });
      return;
    }
  
    const to = (form.email || "").trim();
    if (!to) {
      setEmailStatus({ type: "error", msg: "Please enter your email address." });
      return;
    }
  
    setEmailStatus({ type: "sending", msg: "Sending email..." });

  try {
    const res = await fetch(`${API_BASE}/api/send-astrology-reading`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: to,                  // if blank, server defaults anyway
        intent: form.intent,
        numerology: metrics,
        form: {
          birthName: form.birthName,
          currentName: form.currentName,
          dob: form.dob,
          calcDate: form.calcDate,
          birthTime: form.birthTime,
          zip: form.zip,
          city: form.city,
          state: form.state,
          country: form.country,
          tz: form.tz,
        },
        // astrology: { sun, moon, rising } // later if you compute it
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to send email");

    setEmailStatus({ type: "success", msg: `Email sent ✅ (${data.sentTo || to})` });

    // auto-clear toast after a bit
    setTimeout(() => setEmailStatus({ type: "idle", msg: "" }), 3500);
  } catch (err) {
    setEmailStatus({ type: "error", msg: err.message || "Email failed" });
  }
};


return (
  <div className="smart-wrap" style={{ padding: "22px 0" }}>
    <div className="smart-forms smart-container" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div className="theme-purple">
        {/* HEADER */}
        <div className="form-header header-purple" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fa fa-magic" />
            SigilSync <span style={{ opacity: 0.85, fontWeight: 700 }}>by StarFire Origins</span>
          </h4>

          <div style={{ display: "flex", gap: 10 }}>

          </div>
        </div>

        {/* STATUS BAR (email sending toast) */}
        {emailStatus.type !== "idle" && (
          <div
            className={`notification ${
              emailStatus.type === "error"
                ? "alert-error"
                : emailStatus.type === "success"
                ? "alert-success"
                : "alert-info"
            }`}
            style={{ margin: "14px 18px 0" }}
          >
            <p style={{ margin: 0 }}>{emailStatus.msg}</p>
          </div>
        )}

        {/* MODAL (kept as-is) */}
        <Modal
          open={askEmailOpen}
          title="Send your Astrology reading to email?"
          onClose={() => setAskEmailOpen(false)}
        >
          <p style={{ marginTop: 0, opacity: 0.85 }}>
            Would you like us to send your astrology reading to your email inbox?
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              type="button"
              className="button btn-primary"
              onClick={() => {
                setShowEmailFields(true);
                setAskEmailOpen(false);
              }}
            >
              Yes, add email
            </button>

            <button
              type="button"
              className="button btn-default"
              onClick={() => {
                setShowEmailFields(false);
                setAskEmailOpen(false);
              }}
            >
              No thanks
            </button>
          </div>
        </Modal>

        {/* BODY GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, padding: 18 }}>
          {/* LEFT: INPUTS */}
          <div id="inputs" className="form-body" style={{ padding: 0 }}>
            {/* Numerology block */}
            <div className="frm-row" style={{ margin: 0 }}>
              <div className="section colm colm12">
                <h5 style={{ margin: "0 0 10px" }}>
                  <i className="fa fa-hashtag" style={{ marginRight: 8 }} />
                  Numerology Inputs
                </h5>
              </div>

              <div className="section colm colm12">
                <label className="field-label">Birth name (full, at birth)</label>
                <label className="field prepend-icon">
                  <input
                    className="gui-input"
                    value={form.birthName}
                    onChange={onChange("birthName")}
                    placeholder="e.g., Jane Ann Doe"
                  />
                  <span className="field-icon">
                    <i className="fa fa-id-card" />
                  </span>
                </label>
                {errors.birthName && <div className="notification alert-error"><p style={{ margin: 0 }}>{errors.birthName}</p></div>}
              </div>

              <div className="section colm colm12">
                <label className="field-label">Current name (optional)</label>
                <label className="field prepend-icon">
                  <input
                    className="gui-input"
                    value={form.currentName}
                    onChange={onChange("currentName")}
                    placeholder="e.g., Jane A. Doe"
                  />
                  <span className="field-icon">
                    <i className="fa fa-user" />
                  </span>
                </label>
              </div>

              <div className="section colm colm6">
                <label className="field-label">Date of Birth</label>
                <label className="field prepend-icon">
                  <input
                    className="gui-input"
                    value={form.dob}
                    onChange={onChange("dob")}
                    placeholder="MM/DD/YYYY"
                  />
                  <span className="field-icon">
                    <i className="fa fa-calendar" />
                  </span>
                </label>
                {errors.dob && <div className="notification alert-error"><p style={{ margin: 0 }}>{errors.dob}</p></div>}
              </div>

              <div className="section colm colm6">
                <label className="field-label">Calculation date</label>
                <label className="field prepend-icon">
                  <input
                    className="gui-input"
                    value={form.calcDate}
                    onChange={onChange("calcDate")}
                    placeholder="MM/DD/YYYY"
                  />
                  <span className="field-icon">
                    <i className="fa fa-calendar-check-o" />
                  </span>
                </label>
                {errors.calcDate && <div className="notification alert-error"><p style={{ margin: 0 }}>{errors.calcDate}</p></div>}
              </div>
            </div>

            <div className="spacer-t20" />

            {/* Astrology block */}
            <div className="frm-row" style={{ margin: 0 }}>
              <div className="section colm colm12">
                <h5 style={{ margin: "0 0 10px" }}>
                  <i className="fa fa-star" style={{ marginRight: 8 }} />
                  Astrology Inputs
                </h5>
              </div>

              <div className="section colm colm6">
                <label className="field-label">Birth time (local)</label>
                <label className="field prepend-icon">
                  <input
                    className="gui-input"
                    value={form.birthTime}
                    onChange={onChange("birthTime")}
                    placeholder="e.g., 08:57 PM"
                  />
                  <span className="field-icon">
                    <i className="fa fa-clock-o" />
                  </span>
                </label>
              </div>

              <div className="section colm colm6">
                <label className="field-label">ZIP / Postal Code</label>
                <label className="field prepend-icon">
                  <input
                    className="gui-input"
                    value={form.zip}
                    onChange={onChange("zip")}
                    placeholder="e.g., 43072"
                  />
                  <span className="field-icon">
                    <i className="fa fa-map-marker" />
                  </span>
                </label>
              </div>

              <div className="section colm colm6">
                <label className="field-label">City</label>
                <label className="field prepend-icon">
                  <input className="gui-input" value={form.city} onChange={onChange("city")} placeholder="e.g., Saint Paris" />
                  <span className="field-icon"><i className="fa fa-building" /></span>
                </label>
              </div>

              <div className="section colm colm6">
                <label className="field-label">State/Region</label>
                <label className="field prepend-icon">
                  <input className="gui-input" value={form.state} onChange={onChange("state")} placeholder="e.g., OH" />
                  <span className="field-icon"><i className="fa fa-flag" /></span>
                </label>
              </div>

              <div className="section colm colm6">
                <label className="field-label">Country</label>
                <label className="field prepend-icon">
                  <input className="gui-input" value={form.country} onChange={onChange("country")} placeholder="e.g., US" />
                  <span className="field-icon"><i className="fa fa-globe" /></span>
                </label>
              </div>

              <div className="section colm colm6">
                <label className="field-label">Timezone (IANA)</label>
                <label className="field prepend-icon">
                  <input className="gui-input" value={form.tz} onChange={onChange("tz")} placeholder="e.g., America/New_York" />
                  <span className="field-icon"><i className="fa fa-compass" /></span>
                </label>
              </div>

              {showEmailFields && (
                <>
                  <div className="section colm colm6">
                    <label className="field-label">Email address</label>
                    <label className="field prepend-icon">
                      <input
                        className="gui-input"
                        value={form.email}
                        onChange={onChange("email")}
                        placeholder="you@example.com"
                      />
                      <span className="field-icon">
                        <i className="fa fa-envelope" />
                      </span>
                    </label>
                  </div>

                    <div className="section colm colm6">
                      <label className="field-label">Intent</label>
                      <label className="field select">
                        <select className="gui-input" value={form.intent} onChange={onChange("intent")}>
                          <option value="">Select an intent…</option>
                          {INTENT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <i className="arrow double" />
                      </label>
                    </div>


                  <div className="section colm colm12">
                    <div className="notification alert-info">
                      <p style={{ margin: 0 }}>We’ll only use your email to send this reading.</p>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="button btn-primary"
                        disabled={emailStatus.type === "sending"}
                        onClick={() => sendReadingEmail()}
                      >
                        {emailStatus.type === "sending" ? "Sending..." : "Send to email"}
                      </button>

                      <button
                        type="button"
                        className="button btn-default"
                        onClick={() => {
                          setForm((p) => ({ ...p, email: "", intent: "" }));
                          setShowEmailFields(false);
                          setEmailStatus({ type: "idle", msg: "" });
                        }}
                      >
                        Remove email fields
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="form-footer" style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="button btn-purple" type="button" onClick={onCalculate}>
                  Calculate
                </button>
                <button className="button btn-default" type="button" onClick={onExample}>
                  Use Example
                </button>
              </div>

              <div style={{ opacity: 0.75, fontSize: 12, alignSelf: "center" }}>
                Powered by <b>SigilSync Engine</b>
              </div>
            </div>
          </div>

          {/* RIGHT: RESULTS */}
          <div id="results" className="form-body" style={{ padding: 0 }}>
            <div className="frm-row" style={{ margin: 0 }}>
              <div className="section colm colm12">
                <h5 style={{ margin: "0 0 10px" }}>
                  <i className="fa fa-bar-chart" style={{ marginRight: 8 }} />
                  Results
                </h5>
              </div>

              {METRICS.map((k) => (
                <div key={k} className="section colm colm6">
                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 10,
                      padding: "12px 12px",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 700 }}>{k}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>
                      {metrics ? metrics[k] : "—"}
                    </div>
                  </div>
                </div>
              ))}

              <div className="section colm colm12" style={{ marginTop: 6 }}>
                <div className="notification alert-info">
                  <p style={{ margin: 0 }}>
                    Astrology: Sun • Moon • Rising (coming next). For precise planetary positions,
                    integrate Swiss Ephemeris.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* END theme-purple */}
      </div>
    </div>
  </div>
);

}
