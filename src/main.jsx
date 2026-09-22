import React, { useState, useEffect, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import QRCodeStyling from "qr-code-styling";
import {
  QrCode,
  Link,
  Type,
  Mail,
  Phone,
  Wifi,
  Sun,
  Moon,
  ArrowDown,
  Copy,
  Check,
  ShieldCheck,
  Upload,
  RotateCcw,
  ChevronRight,
  Clock,
  Trash2,
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";
import { defaults, presets, prepare, warnings, loadRecent } from "./qr";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./style.css";
const types = [
  ["url", "Website", Link],
  ["text", "Text", Type],
  ["email", "Email", Mail],
  ["phone", "Phone", Phone],
  ["wifi", "Wi-Fi", Wifi],
];
function MiniQR({ settings }) {
  const ref = useRef();
  useEffect(() => {
    try {
      const { options } = prepare({ ...defaults, ...settings, size: 100 });
      ref.current.replaceChildren();
      new QRCodeStyling(options).append(ref.current);
    } catch {}
  }, [settings]);
  return <div className="mini-qr" ref={ref} />;
}
function App() {
  const [s, set] = useState(defaults),
    [tab, setTab] = useState("Design"),
    [recent, setRecent] = useState(loadRecent),
    [theme, setTheme] = useState(() => {
      try {
        return localStorage.getItem("qr-theme") || "light";
      } catch {
        return "light";
      }
    }),
    [notice, setNotice] = useState(""),
    [ready, setReady] = useState(false),
    [renderError, setRenderError] = useState(""),
    [format, setFormat] = useState("png");
  const preview = useRef(),
    instance = useRef(),
    file = useRef();
  const update = (key, value) => set((x) => ({ ...x, [key]: value }));
  const result = useMemo(() => {
    try {
      return prepare(s);
    } catch (e) {
      return { error: e.message };
    }
  }, [s]);
  const alerts = result.error ? [] : warnings(s, result.modules);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("qr-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    setReady(false);
    setRenderError("");
    instance.current = null;
    preview.current?.replaceChildren();
    if (result.error) return;
    let active = true;
    try {
      const qr = new QRCodeStyling(result.options);
      qr.getRawData("svg")
        .then(() => {
          if (active) {
            preview.current?.replaceChildren();
            qr.append(preview.current);
            instance.current = qr;
            setReady(true);
          }
        })
        .catch(
          () =>
            active &&
            setRenderError(
              "Could not render this QR code. Try a smaller logo or less content.",
            ),
        );
    } catch {
      setRenderError("Could not generate this QR code. Try less content.");
    }
    return () => {
      active = false;
    };
  }, [result]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(id);
  }, [notice]);
  function save() {
    if (!ready) return false;
    const item = {
      id: crypto.randomUUID(),
      settings: s,
      date: new Date().toISOString(),
      label:
        s.type === "wifi"
          ? s.ssid
          : s.type === "email"
            ? s.email
            : s.type === "phone"
              ? s.phone
              : s.type === "text"
                ? s.text
                : s.url,
    };
    const next = [
      item,
      ...recent.filter((x) => JSON.stringify(x.settings) !== JSON.stringify(s)),
    ].slice(0, 8);
    try {
      localStorage.setItem("qr-studio-recent", JSON.stringify(next));
      setRecent(next);
      return true;
    } catch {
      setNotice(
        "Browser storage is full or unavailable. This code was not saved.",
      );
      return false;
    }
  }
  async function download() {
    try {
      const qr = instance.current;
      if (!qr || !ready) return;
      await qr.download({ name: `qr-studio-${s.type}`, extension: format });
      if (save()) setNotice(`${format.toUpperCase()} downloaded`);
    } catch {
      setNotice("Download failed. Please try again.");
    }
  }
  async function copy() {
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem) throw Error();
      const blob = instance.current.getRawData("png");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      if (save()) setNotice("QR image copied to clipboard");
    } catch {
      setNotice(
        "Image copying is unavailable or blocked. Please download the PNG instead.",
      );
    }
  }
  async function logo(e) {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = "";
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
      f.size > 2 * 1024 * 1024
    ) {
      setNotice("Choose a PNG, JPG, or WebP image under 2 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(f);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      update("logo", canvas.toDataURL("image/png"));
    } catch {
      setNotice("This image could not be read. Try another file.");
    }
  }
  const field = (key, label, placeholder = "", kind = "text") => (
    <label className="field">
      {label}
      <input
        type={kind}
        value={s[key]}
        placeholder={placeholder}
        onChange={(e) => update(key, e.target.value)}
        maxLength={key === "text" ? 1800 : 1000}
      />
    </label>
  );
  function clear() {
    try {
      localStorage.removeItem("qr-studio-recent");
      setRecent([]);
    } catch {
      setNotice("Could not clear browser storage.");
    }
  }
  return (
    <>
      <header>
        <a href="#" className="brand">
          <span className="brand-mark">
            <QrCode size={23} />
          </span>
          qr<span className="brand-light">studio</span>
          <span className="brand-dot">.</span>
        </a>
        <div className="header-right">
          <span className="private">
            <ShieldCheck size={15} />
            Your data stays yours
          </span>
          <button
            className="icon-button"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">A SMALL CODE. ENDLESS POSSIBILITIES.</div>
            <h1>
              Make a connection<span>.</span>
            </h1>
            <p>Create a QR code that feels like you.</p>
          </div>
          <span className="local-badge">
            <span />
            100% in your browser
          </span>
        </div>
        <div className="workspace">
          <section className="editor">
            <div className="section-title">
              <span className="step">01</span>
              <h2>Your content</h2>
            </div>
            <div className="type-tabs">
              {types.map(([value, label, Icon]) => (
                <button
                  key={value}
                  aria-pressed={s.type === value}
                  className={s.type === value ? "selected" : ""}
                  onClick={() => update("type", value)}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="content-fields">
              {s.type === "url" && (
                <>
                  {field(
                    "url",
                    "Website URL",
                    "https://your-website.com",
                    "url",
                  )}
                  <p className="hint">
                    Send people straight to your website, portfolio, or favorite
                    link.
                  </p>
                </>
              )}
              {s.type === "text" && (
                <label className="field">
                  Your text
                  <textarea
                    value={s.text}
                    maxLength={1800}
                    placeholder="Say something worth scanning…"
                    onChange={(e) => update("text", e.target.value)}
                  />
                </label>
              )}
              {s.type === "email" && (
                <>
                  {field(
                    "email",
                    "Email address",
                    "hello@example.com",
                    "email",
                  )}
                  {field("subject", "Subject (optional)")}
                  {field("body", "Message (optional)")}
                </>
              )}
              {s.type === "phone" &&
                field("phone", "Phone number", "+1 415 555 0123", "tel")}
              {s.type === "wifi" && (
                <>
                  {field("ssid", "Network name", "Your Wi-Fi network")}
                  <label className="field">
                    Security
                    <select
                      aria-label="Security"
                      value={s.security}
                      onChange={(e) => update("security", e.target.value)}
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No password</option>
                    </select>
                  </label>
                  {s.security !== "nopass" &&
                    field("password", "Network password", "", "password")}
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={s.hidden}
                      onChange={(e) => update("hidden", e.target.checked)}
                    />
                    Hidden network
                  </label>
                  <p className="hint">
                    Saved Wi-Fi codes include the password on this device.
                  </p>
                </>
              )}
              {result.error && (
                <p role="alert" className="error">
                  {result.error}
                </p>
              )}
            </div>
            <div className="section-title design-title">
              <span className="step">02</span>
              <h2>Make it yours</h2>
              <button
                className="text-button reset"
                onClick={() => {
                  set((x) => ({
                    ...x,
                    ...Object.fromEntries(
                      [
                        "size",
                        "margin",
                        "fg",
                        "bg",
                        "end",
                        "gradient",
                        "pattern",
                        "ecc",
                        "logo",
                      ].map((k) => [k, defaults[k]]),
                    ),
                  }));
                  setNotice("Design reset");
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
            </div>
            <div className="design-tabs" role="tablist">
              {["Design", "Logo", "Advanced"].map((t) => (
                <button
                  role="tab"
                  aria-selected={tab === t}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="design-panel" role="tabpanel">
              {tab === "Design" && (
                <>
                  <label className="small-label">Start with a preset</label>
                  <div className="presets">
                    {presets.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => set((x) => ({ ...x, ...p }))}
                        className={
                          s.fg === p.fg && s.pattern === p.pattern
                            ? "active"
                            : ""
                        }
                      >
                        <MiniQR settings={p} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="label-row">
                    <label className="small-label">Colors</label>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={s.gradient}
                        onChange={(e) => update("gradient", e.target.checked)}
                      />
                      Gradient
                    </label>
                  </div>
                  <div className="colors">
                    {[
                      ["fg", "Foreground"],
                      ["bg", "Background"],
                      ...(s.gradient ? [["end", "Gradient end"]] : []),
                    ].map(([key, label]) => (
                      <label key={key} className="color-field">
                        <span>{label}</span>
                        <div>
                          <input
                            aria-label={label + " color"}
                            type="color"
                            value={s[key]}
                            onChange={(e) => update(key, e.target.value)}
                          />
                          <span>{s[key].toUpperCase()}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <label className="small-label pattern-label">
                    Dot pattern
                  </label>
                  <div className="patterns">
                    {[
                      ["square", "Square"],
                      ["rounded", "Rounded"],
                      ["dots", "Dots"],
                      ["classy-rounded", "Soft"],
                    ].map(([value, label]) => (
                      <button
                        aria-pressed={s.pattern === value}
                        className={s.pattern === value ? "active" : ""}
                        key={value}
                        onClick={() => update("pattern", value)}
                      >
                        <span className={`pattern-icon ${value}`}>
                          {Array.from({ length: 9 }, (_, i) => (
                            <i key={i} />
                          ))}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {tab === "Logo" && (
                <>
                  <h3>A little more you.</h3>
                  <p className="hint">
                    Add a logo in the center of your code. We’ll use high error
                    correction to help protect readability.
                  </p>
                  <input
                    ref={file}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={logo}
                    hidden
                  />
                  <button
                    className="upload"
                    onClick={() => file.current.click()}
                  >
                    {s.logo ? (
                      <img src={s.logo} alt="Uploaded logo" />
                    ) : (
                      <Upload size={25} />
                    )}
                    <strong>
                      {s.logo ? "Replace your logo" : "Upload your logo"}
                    </strong>
                    <span>PNG, JPG, or WebP · up to 2 MB</span>
                  </button>
                  {s.logo && (
                    <button
                      className="text-button"
                      onClick={() => update("logo", "")}
                    >
                      <X size={15} />
                      Remove logo
                    </button>
                  )}
                </>
              )}
              {tab === "Advanced" && (
                <>
                  <div className="range-heading">
                    <label htmlFor="size">Export size</label>
                    <span>
                      {s.size} × {s.size} px
                    </span>
                  </div>
                  <input
                    id="size"
                    type="range"
                    min="256"
                    max="2048"
                    step="64"
                    value={s.size}
                    onChange={(e) => update("size", +e.target.value)}
                  />
                  <div className="range-heading">
                    <label htmlFor="margin">Margin / quiet zone</label>
                    <span>{s.margin} modules</span>
                  </div>
                  <input
                    id="margin"
                    type="range"
                    min="0"
                    max="12"
                    value={s.margin}
                    onChange={(e) => update("margin", +e.target.value)}
                  />
                  <label className="field">
                    Error correction
                    <select
                      aria-label="Error correction"
                      disabled={!!s.logo}
                      value={s.logo ? "H" : s.ecc}
                      onChange={(e) => update("ecc", e.target.value)}
                    >
                      <option value="L">Low · 7%</option>
                      <option value="M">Medium · 15%</option>
                      <option value="Q">Quartile · 25%</option>
                      <option value="H">High · 30%</option>
                    </select>
                  </label>
                  <p className="hint">
                    Higher correction tolerates more damage and creates a denser
                    code. Logos always use High.
                  </p>
                </>
              )}
            </div>
          </section>
          <aside className="preview-panel">
            <div className="preview-header">
              <span>LIVE PREVIEW</span>
              <span className="live-dot" />
            </div>
            <div className="qr-stage">
              <div className="qr-frame">
                <div
                  ref={preview}
                  className="qr-preview"
                  aria-label="Generated QR code"
                />
                {(result.error || renderError) && (
                  <div className="preview-empty">
                    <QrCode size={52} />
                    <span>Add valid content to preview your code</span>
                  </div>
                )}
              </div>
            </div>
            <div className="preview-meta">
              <span>
                {s.size} × {s.size} px
              </span>
              <span>•</span>
              <span>{s.logo ? "H" : s.ecc} error correction</span>
            </div>
            <div className={`scan-status ${alerts.length ? "warning" : ""}`}>
              <div>
                {alerts.length ? (
                  <AlertTriangle size={17} />
                ) : (
                  <ShieldCheck size={18} />
                )}
                <strong>
                  {result.error
                    ? "Waiting for your content"
                    : alerts.length
                      ? "A quick scan check"
                      : "Made for easy scanning"}
                </strong>
              </div>
              <p>
                {result.error
                  ? "Your preview will appear here."
                  : alerts.length
                    ? alerts[0]
                    : "Good contrast and a clear quiet zone. You’re all set."}
              </p>
              {alerts.slice(1).map((a) => (
                <p key={a}>{a}</p>
              ))}
            </div>
            {renderError && (
              <p role="alert" className="error">
                {renderError}
              </p>
            )}
            <div className="export-controls">
              <label className="sr-only" htmlFor="format">
                Download format
              </label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="png">PNG image</option>
                <option value="svg">SVG vector</option>
              </select>
              <button className="primary" disabled={!ready} onClick={download}>
                <ArrowDown size={18} />
                Download {format.toUpperCase()}
              </button>
            </div>
            <div className="secondary-actions">
              <button disabled={!ready} onClick={copy}>
                <Copy size={15} />
                Copy image
              </button>
              <button
                disabled={!ready}
                onClick={() => {
                  if (save()) setNotice("Saved to recent codes");
                }}
              >
                <Plus size={16} />
                Save to recents
              </button>
            </div>
            <p className="download-note">
              Yours to use. No watermarks, no expiry.
            </p>
          </aside>
        </div>
        <section className="recent-section">
          <div className="recent-heading">
            <h2>
              <Clock size={19} />
              Recent codes<span>{recent.length}</span>
            </h2>
            {recent.length > 0 ? (
              <button className="text-button" onClick={clear}>
                <Trash2 size={14} />
                Clear all
              </button>
            ) : (
              <span>Saved on this device</span>
            )}
          </div>
          {recent.length ? (
            <div className="recent-grid">
              {recent.map((item) => (
                <button
                  className="recent-card"
                  key={item.id}
                  onClick={() => {
                    set({ ...defaults, ...item.settings });
                    setNotice("Recent code restored");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <MiniQR settings={item.settings} />
                  <div>
                    <span>
                      {types.find((t) => t[0] === item.settings.type)?.[1]}
                    </span>
                    <strong>{item.label}</strong>
                    <small>
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </small>
                  </div>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          ) : (
            <div className="recent-empty">
              <div className="empty-icon">
                <QrCode size={23} />
              </div>
              <div>
                <strong>Your next connection starts here.</strong>
                <p>Download or save a code and find it here next time.</p>
              </div>
            </div>
          )}
        </section>
        <footer>
          <span>
            <ShieldCheck size={14} />
            Private by design. Your content never leaves this browser.
          </span>
          <span>Made to connect.</span>
        </footer>
      </main>
      {notice && (
        <div role="status" className="toast">
          <Check size={17} />
          {notice}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
