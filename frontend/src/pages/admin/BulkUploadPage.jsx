/**
 * BulkUploadPage — /admin/products/bulk-upload
 *
 * Admin-only page for uploading a CSV of products + variants.
 *
 * Flow:
 *   1. Download sample CSV template
 *   2. Fill in products (one row = one variant)
 *   3. Drag & drop or click to upload
 *   4. See result: created / skipped / errors per row
 */
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Upload, FileText, Download, CheckCircle2,
  AlertCircle, SkipForward, ChevronRight, X,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosClient from "@api/axiosClient";
import { getApiError } from "@utils";

// ─── Result card ─────────────────────────────────────────────
function ResultCard({ icon, label, value, color }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl p-4 text-center"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
    >
      <div className="flex justify-center" style={{ color }}>
        {icon}
      </div>
      <p className="text-2xl font-bold" style={{ color: "#2B2B2B" }}>
        {value}
      </p>
      <p className="text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
        {label}
      </p>
    </div>
  );
}

export default function BulkUploadPage() {
  const [file, setFile]         = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const inputRef                = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file only.");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) { toast.error("Select a CSV file first."); return; }
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axiosClient.post("/products/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      if (!data.errors?.length) {
        toast.success(`Done! ${data.products_created} products created.`);
      } else {
        toast(`Upload complete with ${data.errors.length} errors.`, { icon: "⚠️" });
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

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

        {/* Header */}
        <div className="mb-8">
          <h1
            className="mb-1 text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
          >
            Bulk Product Upload
          </h1>
          <p className="text-sm" style={{ color: "#7A6E67" }}>
            Upload a CSV file to create multiple products and variants at once.
          </p>
        </div>

        {/* Step 1 — Download template */}
        <div
          className="mb-5 flex items-center justify-between rounded-xl p-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
        >
          <div>
            <p className="mb-0.5 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
              Step 1 — Download the CSV template
            </p>
            <p className="text-xs" style={{ color: "#7A6E67" }}>
              Fill in your products using the exact column names shown in the template.
            </p>
          </div>
          <a
            href="/products_sample.csv"
            download="trendio_products_sample.csv"
            className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#C2A98A" }}
          >
            <Download size={13} />
            TEMPLATE
          </a>
        </div>

        {/* Step 2 — Required columns info */}
        <div
          className="mb-5 rounded-xl p-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
        >
          <p className="mb-3 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
            Step 2 — CSV column reference
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: "#7A6E67" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5DCD3" }}>
                  {["Column", "Required", "Example", "Notes"].map((h) => (
                    <th key={h} className="pb-2 text-left font-semibold" style={{ color: "#2B2B2B" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: "#F3EDE7" }}>
                {[
                  ["title",         "✅ Yes", "Classic Oxford Shirt",    "Same title groups rows into one product"],
                  ["brand",         "✅ Yes", "Trendio Essentials",       "Same brand + title = same product"],
                  ["category_slug", "✅ Yes", "shirts",                   "Use existing slug or new one auto-created"],
                  ["base_price",    "✅ Yes", "1299",                     "No ₹ symbol, numbers only"],
                  ["sale_price",    "No",     "999",                      "Must be less than base_price"],
                  ["sku",           "✅ Yes", "OXF-M-BLK-001",            "Must be unique across all products"],
                  ["stock",         "✅ Yes", "25",                       "Integer, 0 or more"],
                  ["size",          "No",     "M",                        "S, M, L, XL, 30, 32 etc."],
                  ["color",         "No",     "Black",                    "Color name"],
                  ["color_hex",     "No",     "#1a1a1a",                  "Hex code for color swatch"],
                  ["description",   "No",     "Premium cotton shirt…",    "Only read from first row per product"],
                ].map(([col, req, ex, note]) => (
                  <tr key={col}>
                    <td className="py-1.5 pr-4 font-mono font-medium" style={{ color: "#2B2B2B" }}>{col}</td>
                    <td className="py-1.5 pr-4">{req}</td>
                    <td className="py-1.5 pr-4 font-mono">{ex}</td>
                    <td className="py-1.5">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 3 — Upload zone */}
        <div
          className="mb-5 rounded-xl p-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
        >
          <p className="mb-4 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
            Step 3 — Upload your CSV
          </p>

          {/* Drop zone */}
          <div
            className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition-all"
            style={{
              borderColor: isDragging ? "#C2A98A" : file ? "#84cc16" : "#E5DCD3",
              backgroundColor: isDragging ? "#FDF8F4" : "#F8F5F2",
              cursor: "pointer",
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
                  <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                    {file.name}
                  </p>
                  <p className="text-xs" style={{ color: "#7A6E67" }}>
                    {(file.size / 1024).toFixed(1)} KB — ready to upload
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="flex items-center gap-1 text-xs underline"
                  style={{ color: "#D97757" }}
                >
                  <X size={11} /> Remove file
                </button>
              </>
            ) : (
              <>
                <Upload size={32} style={{ color: "#C2A98A" }} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "#2B2B2B" }}>
                    Drop your CSV here or{" "}
                    <span className="underline" style={{ color: "#C2A98A" }}>
                      click to browse
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "#7A6E67" }}>
                    .csv files only
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-4 w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.15em] text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#2B2B2B" }}
          >
            {loading ? "UPLOADING…" : "UPLOAD & PROCESS CSV"}
          </button>
        </div>

        {/* Step 4 — Results */}
        {result && (
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
          >
            <p className="mb-4 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
              Upload Result
            </p>

            {/* Summary cards */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              <ResultCard
                icon={<CheckCircle2 size={22} />}
                label="PRODUCTS CREATED"
                value={result.products_created}
                color="#84cc16"
              />
              <ResultCard
                icon={<CheckCircle2 size={22} />}
                label="VARIANTS CREATED"
                value={result.variants_created}
                color="#84cc16"
              />
              <ResultCard
                icon={<SkipForward size={22} />}
                label="SKIPPED SKUs"
                value={result.skipped_skus?.length || 0}
                color="#f59e0b"
              />
            </div>

            {/* Skipped SKUs */}
            {result.skipped_skus?.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-bold tracking-widest" style={{ color: "#f59e0b" }}>
                  SKIPPED (DUPLICATE SKUs)
                </p>
                <div className="space-y-1.5">
                  {result.skipped_skus.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs"
                      style={{ backgroundColor: "#FEF9C3", color: "#854d0e" }}
                    >
                      <SkipForward size={12} />
                      <span>Row {s.row}</span>
                      <span className="font-mono font-semibold">{s.sku}</span>
                      <span style={{ color: "#a16207" }}>— {s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors?.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold tracking-widest" style={{ color: "#D97757" }}>
                  ERRORS
                </p>
                <div className="space-y-1.5">
                  {result.errors.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg px-3 py-2 text-xs"
                      style={{ backgroundColor: "#FEF2F2", color: "#7f1d1d" }}
                    >
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <span>Row {e.row}</span>
                      {e.title && <span className="font-semibold">{e.title}</span>}
                      <span style={{ color: "#991b1b" }}>— {e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All good! */}
            {!result.errors?.length && !result.skipped_skus?.length && (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: "#F0FDF4" }}
              >
                <CheckCircle2 size={18} style={{ color: "#84cc16" }} />
                <p className="text-sm" style={{ color: "#166534" }}>
                  All rows processed successfully. Your products are live!
                </p>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <Link
                to="/admin/products"
                className="flex-1 rounded-xl py-3 text-center text-xs font-bold tracking-widest text-white"
                style={{ backgroundColor: "#2B2B2B" }}
              >
                VIEW PRODUCTS
              </Link>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border px-5 text-xs font-bold tracking-widest"
                style={{ borderColor: "#E5DCD3", color: "#7A6E67" }}
              >
                UPLOAD ANOTHER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}