/**
 * BulkUploadPage — /admin/products/bulk-upload
 *
 * Flow:
 *   1. Download sample CSV
 *   2. Drag & drop or pick file
 *   3. POST multipart/form-data → backend returns { id, poll_url }
 *   4. Poll GET /products/bulk-upload/{id}/ every 2s → update progress bar
 *   5. On complete: show summary + download error CSV button
 *
 * The multipart/form-data is set automatically by using FormData
 * with axios — do NOT set Content-Type manually.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Upload, FileText, Download, CheckCircle2,
  AlertCircle, SkipForward, ChevronRight, X,
  Loader2, RefreshCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosClient from "@api/axiosClient";
import { getApiError } from "@utils";

const POLL_INTERVAL_MS = 2000;

// ── Column reference data ─────────────────────────────────────
const COLUMNS = [
  ["title",         "✅",  "Classic Oxford Shirt",  "Same title + brand groups rows into one product"],
  ["brand",         "✅",  "Trendio Essentials",    "Same brand + title = same product"],
  ["category_slug", "✅",  "shirts",                "Existing slug, or new category auto-created"],
  ["base_price",    "✅",  "1299",                  "Numbers only — no ₹ symbol"],
  ["sale_price",    "—",   "999",                   "Must be less than base_price"],
  ["sku",           "✅",  "OXF-M-BLK-001",         "Unique. If exists → product is updated (upsert)"],
  ["stock",         "✅",  "25",                    "Integer, 0 or more"],
  ["size",          "—",   "M",                     "S M L XL 30 32 etc."],
  ["color",         "—",   "Black",                 "Color name"],
  ["color_hex",     "—",   "#1a1a1a",               "Hex code for color swatch display"],
  ["description",   "—",   "Premium cotton…",       "Read from first row per product only"],
  ["image_urls",    "—",   "https://img.jpg|…",     "Pipe-separated URLs. Downloaded & saved automatically"],
];

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({ value, max, color = "#C2A98A" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs" style={{ color: "#7A6E67" }}>
        <span>{value} of {max}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#EDE3D9" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon, value, label, color }) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl p-4 text-center"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-2xl font-bold" style={{ color: "#2B2B2B" }}>{value}</span>
      <span className="text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
        {label}
      </span>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────
const STATUS_STYLE = {
  uploaded:   { color: "#7A6E67", bg: "#EDE3D9", label: "Queued"     },
  processing: { color: "#C2A98A", bg: "#FDF8F4", label: "Processing" },
  completed:  { color: "#16a34a", bg: "#F0FDF4", label: "Completed"  },
  failed:     { color: "#D97757", bg: "#FEF2F2", label: "Failed"     },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.uploaded;
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────
export default function BulkUploadPage() {
  const [file, setFile]                 = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadId, setUploadId]         = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // BulkUpload object from API
  const [pastUploads, setPastUploads]   = useState([]);
  const inputRef = useRef(null);
  const pollRef  = useRef(null);

  // ── Load past uploads on mount ──────────────────────────────
  useEffect(() => {
    axiosClient.get("/products/bulk-upload/")
      .then(({ data }) => setPastUploads(data))
      .catch(() => {});
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Polling ─────────────────────────────────────────────────
  const startPolling = useCallback((id) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await axiosClient.get(`/products/bulk-upload/${id}/`);
        setUploadStatus(data);
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(pollRef.current);
          setPastUploads((prev) => {
            const filtered = prev.filter((u) => u.id !== id);
            return [data, ...filtered];
          });
          if (data.status === "completed") {
            toast.success(
              `Done! ${data.success_count} variants created, ${data.failure_count} failed.`
            );
          } else {
            toast.error("Upload failed. Check error report.");
          }
        }
      } catch {
        clearInterval(pollRef.current);
      }
    }, POLL_INTERVAL_MS);
  }, []);

  // ── File handling ───────────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file only.");
      return;
    }
    setFile(f);
    setUploadStatus(null);
    setUploadId(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setFile(null);
    setUploadStatus(null);
    setUploadId(null);
    clearInterval(pollRef.current);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Upload ──────────────────────────────────────────────────
  // IMPORTANT: FormData + axios automatically sets multipart/form-data
  // with correct boundary. Never set Content-Type manually here.
  const handleUpload = async () => {
    if (!file) { toast.error("Select a CSV file first."); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);   // ← field name must be "file"

    try {
      const { data } = await axiosClient.post(
        "/products/bulk-upload/",
        formData,
        // DO NOT set Content-Type header — axios sets it automatically with boundary
      );

      setUploadId(data.id);
      setUploadStatus({ id: data.id, status: "uploaded", processed: 0, total_records: 0 });
      toast("Processing started. This may take a moment…", { icon: "⏳" });
      startPolling(data.id);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const isProcessing = uploadStatus?.status === "processing" || uploadStatus?.status === "uploaded";
  const isDone       = uploadStatus?.status === "completed" || uploadStatus?.status === "failed";

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ backgroundColor: "#F8F5F2" }}>
      <div className="mx-auto max-w-3xl">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs" style={{ color: "#7A6E67" }}>
          <Link to="/admin" className="hover:text-[#C2A98A]">Admin</Link>
          <ChevronRight size={11} />
          <Link to="/admin/products" className="hover:text-[#C2A98A]">Products</Link>
          <ChevronRight size={11} />
          <span style={{ color: "#2B2B2B" }}>Bulk Upload</span>
        </nav>

        <h1
          className="mb-1 text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
        >
          Bulk Product Upload
        </h1>
        <p className="mb-8 text-sm" style={{ color: "#7A6E67" }}>
          Upload a CSV to create or update multiple products at once. Images are downloaded automatically.
        </p>

        {/* ── Step 1: Download template ──────────────────── */}
        <div
          className="mb-4 flex items-center justify-between rounded-xl p-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
        >
          <div>
            <p className="mb-0.5 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
              Step 1 — Download the CSV template
            </p>
            <p className="text-xs" style={{ color: "#7A6E67" }}>
              Fill it in, then upload below. Use the exact column names shown.
            </p>
          </div>
          <a
            href="/products_sample.csv"
            download="trendio_bulk_template.csv"
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#C2A98A" }}
          >
            <Download size={13} /> TEMPLATE
          </a>
        </div>

        {/* ── Step 2: Column reference ───────────────────── */}
        <div
          className="mb-4 rounded-xl p-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
        >
          <p className="mb-4 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
            Step 2 — Column reference
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: "#7A6E67" }}>
              <thead>
                <tr className="border-b" style={{ borderColor: "#E5DCD3" }}>
                  {["Column", "Req", "Example", "Notes"].map((h) => (
                    <th key={h} className="pb-2 text-left font-semibold pr-4" style={{ color: "#2B2B2B" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COLUMNS.map(([col, req, ex, note]) => (
                  <tr key={col} className="border-b" style={{ borderColor: "#F3EDE7" }}>
                    <td className="py-2 pr-4 font-mono font-medium" style={{ color: "#2B2B2B" }}>{col}</td>
                    <td className="py-2 pr-4">{req}</td>
                    <td className="py-2 pr-4 font-mono" style={{ color: "#7A6E67" }}>{ex}</td>
                    <td className="py-2" style={{ maxWidth: 200 }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Step 3: Upload ─────────────────────────────── */}
        <div
          className="mb-4 rounded-xl p-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
        >
          <p className="mb-4 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
            Step 3 — Upload your CSV
          </p>

          {/* Drop zone */}
          {!isProcessing && !isDone && (
            <div
              className="mb-4 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition-all"
              style={{
                borderColor:     isDragging ? "#C2A98A" : file ? "#84cc16" : "#E5DCD3",
                backgroundColor: isDragging ? "#FDF8F4" : "#F8F5F2",
                cursor:          file ? "default" : "pointer",
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <FileText size={32} style={{ color: "#84cc16" }} />
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>{file.name}</p>
                    <p className="text-xs" style={{ color: "#7A6E67" }}>
                      {(file.size / 1024).toFixed(1)} KB · ready to upload
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="flex items-center gap-1 text-xs underline"
                    style={{ color: "#D97757" }}
                  >
                    <X size={11} /> Remove
                  </button>
                </>
              ) : (
                <>
                  <Upload size={32} style={{ color: "#C2A98A" }} />
                  <p className="text-sm" style={{ color: "#2B2B2B" }}>
                    Drop CSV here or{" "}
                    <span style={{ color: "#C2A98A", textDecoration: "underline" }}>click to browse</span>
                  </p>
                  <p className="text-xs" style={{ color: "#7A6E67" }}>Max 10 MB · .csv only</p>
                </>
              )}
            </div>
          )}

          {/* Processing state */}
          {isProcessing && uploadStatus && (
            <div className="mb-4 rounded-xl p-5" style={{ backgroundColor: "#FDF8F4" }}>
              <div className="mb-4 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin" style={{ color: "#C2A98A" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                    Processing your CSV…
                  </p>
                  <p className="text-xs" style={{ color: "#7A6E67" }}>
                    This runs in the background. You can close this tab and come back.
                  </p>
                </div>
                <StatusBadge status={uploadStatus.status} />
              </div>
              {uploadStatus.total_records > 0 && (
                <ProgressBar
                  value={uploadStatus.processed || 0}
                  max={uploadStatus.total_records}
                />
              )}
            </div>
          )}

          {/* Upload button */}
          {!isProcessing && !isDone && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.15em] text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#2B2B2B" }}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> UPLOADING…
                </span>
              ) : (
                "UPLOAD & PROCESS CSV"
              )}
            </button>
          )}
        </div>

        {/* ── Step 4: Results ────────────────────────────── */}
        {isDone && uploadStatus && (
          <div
            className="mb-4 rounded-xl p-5"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                Upload Complete
              </p>
              <div className="flex items-center gap-3">
                <StatusBadge status={uploadStatus.status} />
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "#7A6E67" }}
                >
                  <RefreshCcw size={12} /> New upload
                </button>
              </div>
            </div>

            {/* Summary stats */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              <StatCard
                icon={<CheckCircle2 size={22} />}
                value={uploadStatus.success_count}
                label="VARIANTS CREATED"
                color="#84cc16"
              />
              <StatCard
                icon={<AlertCircle size={22} />}
                value={uploadStatus.failure_count}
                label="FAILED ROWS"
                color={uploadStatus.failure_count > 0 ? "#D97757" : "#84cc16"}
              />
              <StatCard
                icon={<SkipForward size={22} />}
                value={uploadStatus.total_records}
                label="TOTAL ROWS"
                color="#C2A98A"
              />
            </div>

            {/* No errors */}
            {uploadStatus.failure_count === 0 && (
              <div
                className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: "#F0FDF4" }}
              >
                <CheckCircle2 size={18} style={{ color: "#84cc16" }} />
                <p className="text-sm" style={{ color: "#166534" }}>
                  All rows processed successfully. Products are live!
                </p>
              </div>
            )}

            {/* Error report download */}
            {uploadStatus.failure_count > 0 && uploadStatus.error_file_url && (
              <div
                className="mb-4 flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: "#FEF2F2" }}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} style={{ color: "#D97757" }} />
                  <span className="text-sm" style={{ color: "#7f1d1d" }}>
                    {uploadStatus.failure_count} row(s) had errors.
                  </span>
                </div>
                <a
                  href={uploadStatus.error_file_url}
                  download
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                  style={{ backgroundColor: "#D97757" }}
                >
                  <Download size={12} /> DOWNLOAD ERRORS
                </a>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3">
              <Link
                to="/admin/products"
                className="flex-1 rounded-xl py-3 text-center text-xs font-bold tracking-widest text-white"
                style={{ backgroundColor: "#2B2B2B" }}
              >
                VIEW ALL PRODUCTS
              </Link>
            </div>
          </div>
        )}

        {/* ── Past uploads ───────────────────────────────── */}
        {pastUploads.length > 0 && !uploadId && (
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
          >
            <p className="mb-4 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
              Recent Uploads
            </p>
            <div className="space-y-2">
              {pastUploads.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs"
                  style={{ backgroundColor: "#F8F5F2" }}
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={u.status} />
                    <span style={{ color: "#7A6E67" }}>
                      {u.success_count} ok · {u.failure_count} failed · {u.total_records} total
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.error_file_url && (
                      <a
                        href={u.error_file_url}
                        download
                        className="text-xs underline"
                        style={{ color: "#D97757" }}
                      >
                        Errors
                      </a>
                    )}
                    <span style={{ color: "#7A6E67" }}>
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}