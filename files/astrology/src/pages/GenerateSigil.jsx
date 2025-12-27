import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";

export default function GenerateSigil() {
  const nav = useNavigate();
  const { state } = useLocation();

  const selected =
    state?.selectedRow ||
    (() => {
      try {
        return JSON.parse(sessionStorage.getItem("selected_sigil_user") || "null");
      } catch {
        return null;
      }
    })();

  const prefill = useMemo(() => {
    const f = selected?.form || {};
    return {
      name: selected?.name || f.currentName || f.birthName || "",
      dob: selected?.dob || f.dob || "",
      intent: selected?.intent || "",
      sentTo: selected?.sentTo || "",
      at: selected?.at || "",
    };
  }, [selected]);

  const selectedKey = useMemo(() => {
    const n = (prefill.name || "").trim();
    const d = (prefill.dob || "").trim();
    return `${n}__${d}`;
  }, [prefill.name, prefill.dob]);

  const PREVIEW_KEY = useMemo(() => `sigil_preview_image__${selectedKey}`, [selectedKey]);

  const [form, setForm] = useState(() => ({
    sigilName: prefill.name,
    dob: prefill.dob,
    intent: prefill.intent,
    style: "mystical",
  }));

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // template-style upload
  const [upload, setUpload] = useState({ file: null, name: "" });
  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setUpload({ file: f, name: f ? f.name : "" });
  };

  // ✅ Prompt checkboxes
  const [prompts, setPrompts] = useState({
    blueprint: true,
    sigil: true,
    teaching: false,
    vision: false,
  });

  const togglePrompt = (k) => (e) => setPrompts((p) => ({ ...p, [k]: e.target.checked }));
  const anyPromptSelected = prompts.blueprint || prompts.sigil || prompts.teaching || prompts.vision;

  // ✅ Generation state + preview image
  const [gen, setGen] = useState({ type: "idle", msg: "" }); // idle | generating | success | error
  const [imageUrl, setImageUrl] = useState("");

  // ✅ restore preview per selected user (survives reload)
  useEffect(() => {
    const cached = sessionStorage.getItem(PREVIEW_KEY);
    if (cached) setImageUrl(cached);
    else setImageUrl("");
  }, [PREVIEW_KEY]);

  useEffect(() => {
    const passed = state?.previewUrl;
    if (passed) {
      setImageUrl(passed);
      sessionStorage.setItem(PREVIEW_KEY, passed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.previewUrl, PREVIEW_KEY]);
  

  const clearPreview = () => {
    setImageUrl("");
    sessionStorage.removeItem(PREVIEW_KEY);
    setGen({ type: "idle", msg: "" });
  };

  const generateSigil = async () => {
    setGen({ type: "idle", msg: "" });

    if (!anyPromptSelected) {
      setGen({ type: "error", msg: "Select at least one prompt option." });
      return;
    }

    if (!form.sigilName?.trim() || !form.dob?.trim()) {
      setGen({ type: "error", msg: "Missing name or date of birth." });
      return;
    }

    setGen({ type: "generating", msg: "Generating image..." });
    setImageUrl("");

    try {
      const res = await fetch(`${API_BASE}/api/astrology-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.sigilName,
          dob: form.dob,
          intent: form.intent,
          style: form.style,
          prompts,
          uploadedFileName: upload?.name || "",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to generate image");
      if (!data.imageUrl) throw new Error("No imageUrl returned from server");

      setImageUrl(data.imageUrl);
      sessionStorage.setItem(PREVIEW_KEY, data.imageUrl);
      setGen({ type: "success", msg: "Sigil generated ✅" });
    } catch (err) {
      setGen({ type: "error", msg: err?.message || "Generation failed" });
    }
  };

  if (!selected) {
    return (
      <div className="smart-wrap" style={{ padding: "22px 0" }}>
        <div className="smart-forms smart-container" style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="theme-purple">
            <div className="form-header header-purple">
              <h4 style={{ margin: 0 }}>
                <i className="fa fa-magic" style={{ marginRight: 10 }} />
                Generate Sigil
              </h4>
            </div>

            <div className="form-body">
              <div className="notification alert-error">
                <p style={{ margin: 0 }}>
                  No user selected. Please go back to the Admin Dashboard and click “Generate Sigil” on a row.
                </p>
              </div>

              <div className="form-footer" style={{ display: "flex", justifyContent: "space-between" }}>
                <button className="button btn-default" type="button" onClick={() => nav("/admin/dashboard")}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const genAlertClass =
    gen.type === "error" ? "alert-error" : gen.type === "success" ? "alert-success" : "alert-info";

  return (
    <div className="smart-wrap" style={{ padding: "22px 0" }}>
      <div className="smart-forms smart-container" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="theme-purple">
          {/* Header */}
          <div
            className="form-header header-purple"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <h4 style={{ margin: 0 }}>
              <i className="fa fa-magic" style={{ marginRight: 10 }} />
              Generate Sigil
            </h4>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="button btn-default" onClick={() => nav("/admin/settings")}>
                <i className="fa fa-cog" style={{ marginRight: 8 }} />
                Settings
              </button>

              <button className="button btn-default" type="button" onClick={() => nav("/admin/dashboard")}>
                <i className="fa fa-arrow-left" style={{ marginRight: 8 }} />
                Back
              </button>
            </div>
          </div>

          {/* Two-column body */}
          <div className="form-body" style={{ padding: 18 }}>
            <div className="frm-row">
              {/* LEFT */}
              <div className="section colm colm6">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.08)",
                    padding: 16,
                  }}
                >
                  <div className="notification alert-info" style={{ marginBottom: 14 }}>
                    <p style={{ margin: 0 }}>
                      <b>Selected user:</b> {prefill.name || "—"} &nbsp; • &nbsp;
                      <b>DOB:</b> {prefill.dob || "—"} &nbsp; • &nbsp;
                      <b>Email:</b> {prefill.sentTo || "—"}
                    </p>
                    {prefill.at && (
                      <p style={{ margin: "6px 0 0", opacity: 0.85 }}>
                        <b>Logged at:</b> {new Date(prefill.at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* ✅ Generation status */}
                  {gen.type !== "idle" && (
                    <div className={`notification ${genAlertClass}`} style={{ marginBottom: 14 }}>
                      <p style={{ margin: 0 }}>{gen.msg}</p>
                    </div>
                  )}

                  <div className="notification alert-info" style={{ marginBottom: 14 }}>
                    <p style={{ margin: 0 }}>
                      These details are preselected from the user record and cannot be edited on this page.
                    </p>
                  </div>

                  <div className="frm-row">
                    {/* Preselected fields (locked) */}
                    <div className="section colm colm12">
                      <label className="field-label">Name (locked)</label>
                      <label className="field prepend-icon">
                        <input className="gui-input" value={form.sigilName} disabled />
                        <span className="field-icon">
                          <i className="fa fa-user" />
                        </span>
                      </label>
                    </div>

                    <div className="section colm colm12">
                      <label className="field-label">Date of Birth (locked)</label>
                      <label className="field prepend-icon">
                        <input className="gui-input" value={form.dob} disabled />
                        <span className="field-icon">
                          <i className="fa fa-calendar" />
                        </span>
                      </label>
                    </div>

                    <div className="section colm colm12">
                      <label className="field-label">Intent (locked)</label>
                      <label className="field prepend-icon">
                        <input className="gui-input" value={form.intent} disabled />
                        <span className="field-icon">
                          <i className="fa fa-comment" />
                        </span>
                      </label>
                    </div>

                    {/* Upload (editable) */}
                    <div className="section colm colm12">
                      <label htmlFor="sigilFile" className="field-label">
                        Upload chanelled doc - <span className="small-text fine-grey">(ONLY JPG : PNG : PDF)</span>
                      </label>

                      <label className="field prepend-icon file">
                        <span className="button btn-purple">Choose File</span>

                        <input
                          id="sigilFile"
                          type="file"
                          className="gui-file"
                          name="upload1"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          onChange={onPickFile}
                        />

                        <input
                          type="text"
                          className="gui-input"
                          placeholder="no file selected"
                          value={upload.name}
                          readOnly
                        />

                        <span className="field-icon">
                          <i className="fa fa-upload" />
                        </span>
                      </label>

                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                        {upload.file ? (
                          <>
                            Selected: <b>{upload.name}</b>
                          </>
                        ) : (
                          <>No file selected yet.</>
                        )}
                      </div>
                    </div>

                    {/* ✅ Prompt checkboxes */}
                    <div className="section colm colm12">
                      <label className="field-label">Prompt options</label>

                      <div className="option-group field">
                        <div className="smart-option-group">
                          <label htmlFor="prompt-blueprint" className="option">
                            <input
                              type="checkbox"
                              id="prompt-blueprint"
                              checked={prompts.blueprint}
                              onChange={togglePrompt("blueprint")}
                            />
                            <span className="smart-option smart-checkbox">
                              <span className="smart-option-ui">
                                <i className="iconc"></i> Blueprint
                              </span>
                            </span>
                          </label>

                          <label htmlFor="prompt-sigil" className="option">
                            <input
                              type="checkbox"
                              id="prompt-sigil"
                              checked={prompts.sigil}
                              onChange={togglePrompt("sigil")}
                            />
                            <span className="smart-option smart-checkbox">
                              <span className="smart-option-ui">
                                <i className="iconc"></i> Sigil
                              </span>
                            </span>
                          </label>

                          <label htmlFor="prompt-teaching" className="option">
                            <input
                              type="checkbox"
                              id="prompt-teaching"
                              checked={prompts.teaching}
                              onChange={togglePrompt("teaching")}
                            />
                            <span className="smart-option smart-checkbox">
                              <span className="smart-option-ui">
                                <i className="iconc"></i> Teaching
                              </span>
                            </span>
                          </label>

                          <label htmlFor="prompt-vision" className="option">
                            <input
                              type="checkbox"
                              id="prompt-vision"
                              checked={prompts.vision}
                              onChange={togglePrompt("vision")}
                            />
                            <span className="smart-option smart-checkbox">
                              <span className="smart-option-ui">
                                <i className="iconc"></i> Vision
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                        Select which prompt templates will be applied during sigil generation.
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="section colm colm12" style={{ marginTop: 6 }}>
                      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                        <button
                          className="button btn-purple"
                          type="button"
                          disabled={gen.type === "generating" || !anyPromptSelected}
                          onClick={generateSigil}
                        >
                          <i className="fa fa-bolt" style={{ marginRight: 8 }} />
                          {gen.type === "generating" ? "Generating..." : "Generate Sigil"}
                        </button>

                        <button className="button btn-default" type="button" onClick={() => nav("/admin/dashboard")}>
                          Cancel
                        </button>
                      </div>

                      {!anyPromptSelected && (
                        <div style={{ fontSize: 12, marginTop: 10, opacity: 0.85 }}>
                          <span style={{ color: "#b00020", fontWeight: 800 }}>
                            Select at least one prompt option to generate.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="section colm colm6">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.08)",
                    padding: 16,
                    minHeight: 520,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h5 style={{ margin: "0 0 10px" }}>
                    <i className="fa fa-picture-o" style={{ marginRight: 8 }} />
                    Generated Sigil Preview
                  </h5>

                  <div
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      border: "2px dashed rgba(155, 89, 182, 0.35)",
                      background: "rgba(155, 89, 182, 0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: 18,
                      overflow: "hidden",
                    }}
                  >
                    {gen.type === "generating" ? (
                      <div style={{ maxWidth: 360, opacity: 0.9 }}>
                        <div style={{ fontWeight: 900, marginBottom: 6 }}>Generating…</div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>Your image will appear here when ready.</div>
                      </div>
                    ) : imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Generated sigil"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          borderRadius: 12,
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div style={{ maxWidth: 360, opacity: 0.85 }}>
                        <div style={{ fontWeight: 900, marginBottom: 6 }}>No image yet</div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                          Click “Generate Sigil” to create and preview the image here.
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "space-between" }}>
                    <button type="button" className="button btn-default" onClick={clearPreview} disabled={!imageUrl}>
                      <i className="fa fa-trash" style={{ marginRight: 8 }} />
                      Clear Preview
                    </button>

                    <a
                      className="button btn-purple"
                      href={imageUrl || "#"}
                      download={`sigil_${(form.sigilName || "user").replace(/\s+/g, "_")}.png`}
                      style={{
                        pointerEvents: imageUrl ? "auto" : "none",
                        opacity: imageUrl ? 1 : 0.55,
                        textDecoration: "none",
                      }}
                    >
                      <i className="fa fa-download" style={{ marginRight: 8 }} />
                      Download PNG
                    </a>
                  </div>

                  <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
                    Tip: This preview renders the image returned by your backend (<code>/api/astrology-image</code>).
                  </div>
                </div>
              </div>
              {/* END RIGHT */}
            </div>
          </div>
          {/* END BODY */}
        </div>
      </div>
    </div>
  );
}
