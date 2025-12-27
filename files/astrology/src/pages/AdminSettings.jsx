import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function PreviewModal({ open, title, kind, content, url, onClose }) {
  if (!open) return null;

  return (
    <div className="ss-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ss-modal" style={{ maxWidth: 980 }}>
        <div className="ss-modal-head">
          <div className="ss-modal-title">{title}</div>
          <button type="button" className="ss-modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="ss-modal-body">
          {kind === "text" ? (
            <pre
              style={{
                margin: 0,
                maxHeight: 520,
                overflow: "auto",
                padding: 14,
                borderRadius: 10,
                background: "rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.08)",
                fontSize: 13,
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
              }}
            >
              {content || "No content."}
            </pre>
          ) : kind === "pdf" ? (
            <div
              style={{
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <embed src={url} type="application/pdf" width="100%" height="560px" />
            </div>
          ) : (
            <div className="notification alert-error">
              <p style={{ margin: 0 }}>Unsupported file type for preview.</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button type="button" className="button btn-default" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileUploadRow({ id, label, note, accept, file, onPick, onPreview }) {
  const filename = file?.name || "";

  return (
    <div className="section" style={{ marginBottom: 78 }}>
      <label htmlFor={id} className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>
          {label}{" "}
          {note ? <span className="small-text fine-grey">({note})</span> : null}
        </span>

        <button
          type="button"
          className="button btn-default"
          style={{ padding: "6px 10px", fontSize: 12 }}
          disabled={!file}
          onClick={onPreview}
          title={!file ? "Upload a file first" : "Preview file contents"}
        >
          <i className="fa fa-eye" style={{ marginRight: 8 }} />
          Preview
        </button>
      </label>

      <label className="field prepend-icon file">
        <span className="button btn-purple">Choose File</span>

        <input
          id={id}
          type="file"
          className="gui-file"
          name={id}
          accept={accept}
          onChange={(e) => onPick(e.target.files?.[0] || null)}
        />

        <input
          type="text"
          className="gui-input"
          placeholder="no file selected"
          value={filename}
          readOnly
        />

        <span className="field-icon">
          <i className="fa fa-upload" />
        </span>
      </label>
    </div>
  );
}

export default function AdminSettings() {
  const nav = useNavigate();

  // Keep files in memory for now (you’ll persist later)
  const [files, setFiles] = useState({
    blueprint: null,
    sigil: null,
    teaching: null,
    vision: null,
  });

  const setFile = (k) => (file) => setFiles((p) => ({ ...p, [k]: file }));

  // Accept txt/pdf for prompts
  const ACCEPT = ".txt,.pdf,text/plain,application/pdf";

  // Modal state
  const [preview, setPreview] = useState({
    open: false,
    title: "",
    kind: "text", // "text" | "pdf"
    content: "",
    url: "",
  });

  // Clean up object URL when modal closes / changes
  useEffect(() => {
    return () => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPreview = async (key) => {
    const file = files[key];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const title =
      key === "blueprint"
        ? "Blueprint Prompt Preview"
        : key === "sigil"
        ? "Sigil Prompt Preview"
        : key === "teaching"
        ? "Teaching Prompt Preview"
        : "Vision Prompt Preview";

    // PDF preview via embed + objectURL
    if (lower.endsWith(".pdf")) {
      const url = URL.createObjectURL(file);
      // revoke any previous url
      if (preview.url) URL.revokeObjectURL(preview.url);

      setPreview({
        open: true,
        title,
        kind: "pdf",
        content: "",
        url,
      });
      return;
    }

    // Text preview via FileReader
    try {
      const text = await file.text();
      if (preview.url) URL.revokeObjectURL(preview.url);

      setPreview({
        open: true,
        title,
        kind: "text",
        content: text,
        url: "",
      });
    } catch {
      setPreview({
        open: true,
        title,
        kind: "text",
        content: "Could not read this file as text.",
        url: "",
      });
    }
  };

  const closePreview = () => {
    if (preview.url) URL.revokeObjectURL(preview.url);
    setPreview({ open: false, title: "", kind: "text", content: "", url: "" });
  };

  const summary = useMemo(() => {
    return {
      blueprint: files.blueprint?.name || "—",
      sigil: files.sigil?.name || "—",
      teaching: files.teaching?.name || "—",
      vision: files.vision?.name || "—",
    };
  }, [files]);

  return (
    <div className="smart-wrap" style={{ padding: "22px 0" }}>
      <div className="smart-forms smart-container" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="theme-purple">
          <div
            className="form-header header-purple"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <h4 style={{ margin: 0 }}>
              <i className="fa fa-cog" style={{ marginRight: 10 }} />
              Admin Settings
            </h4>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="button btn-default" type="button" onClick={() => nav("/admin/dashboard")}>
                <i className="fa fa-arrow-left" style={{ marginRight: 8 }} />
                Back
              </button>
            </div>
          </div>

          {/* Preview Modal */}
          <PreviewModal
            open={preview.open}
            title={preview.title}
            kind={preview.kind}
            content={preview.content}
            url={preview.url}
            onClose={closePreview}
          />

          <div className="form-body" style={{ padding: 18 }}>
            <div className="notification alert-info" style={{ marginBottom: 22 }}>
              <p style={{ margin: 0 }}>
                Upload your prompt templates here. You can preview TXT/PDF contents in a modal.
              </p>
            </div>

            {/* 2-column layout */}
            <div className="frm-row">
              {/* LEFT COL */}
              <div className="section colm colm6">
                <FileUploadRow
                  id="prompt-blueprint"
                  label="Blueprint Prompt"
                  note="TXT or PDF"
                  accept={ACCEPT}
                  file={files.blueprint}
                  onPick={setFile("blueprint")}
                  onPreview={() => openPreview("blueprint")}
                />

                <FileUploadRow
                  id="prompt-sigil"
                  label="Sigil Prompt"
                  note="TXT or PDF"
                  accept={ACCEPT}
                  file={files.sigil}
                  onPick={setFile("sigil")}
                  onPreview={() => openPreview("sigil")}
                />
              </div>

              {/* RIGHT COL */}
              <div className="section colm colm6">
                <FileUploadRow
                  id="prompt-teaching"
                  label="Teaching Prompt"
                  note="TXT or PDF"
                  accept={ACCEPT}
                  file={files.teaching}
                  onPick={setFile("teaching")}
                  onPreview={() => openPreview("teaching")}
                />

                <FileUploadRow
                  id="prompt-vision"
                  label="Vision Prompt"
                  note="TXT or PDF"
                  accept={ACCEPT}
                  file={files.vision}
                  onPick={setFile("vision")}
                  onPreview={() => openPreview("vision")}
                />
              </div>
            </div>

            <div className="notification alert-info" style={{ marginTop: 8 }}>
              <p style={{ margin: 0 }}>
                Current selections — Blueprint: <b>{summary.blueprint}</b> • Sigil: <b>{summary.sigil}</b> • Teaching:{" "}
                <b>{summary.teaching}</b> • Vision: <b>{summary.vision}</b>
              </p>
            </div>
          </div>

          <div className="form-footer" style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="button btn-default" type="button" onClick={() => nav("/admin/dashboard")}>
              Close
            </button>

            <button
              className="button btn-purple"
              type="button"
              onClick={() => {
                alert(
                  `Saved (UI only for now):\n` +
                    `Blueprint: ${summary.blueprint}\n` +
                    `Sigil: ${summary.sigil}\n` +
                    `Teaching: ${summary.teaching}\n` +
                    `Vision: ${summary.vision}`
                );
              }}
            >
              <i className="fa fa-save" style={{ marginRight: 8 }} />
              Save (UI only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
