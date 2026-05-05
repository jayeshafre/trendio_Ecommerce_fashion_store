/**
 * AdminProducts.jsx
 * Route: /admin/products
 *
 * Features:
 *   - Paginated product list with search + category filter + active toggle
 *   - Slide-over panel for Create / Edit product
 *   - Image upload (multiple, set primary)
 *   - Variant management (add / edit / delete inline)
 *   - Soft delete via is_active toggle
 *   - Link to Bulk Upload page
 */
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Search, Edit2, Trash2, ChevronRight,
  X, Upload, Image as ImageIcon, Package,
  Check, AlertTriangle, ToggleLeft, ToggleRight,
  Tag, Layers, ExternalLink,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { productsApi } from "@api/products.api";
import { getApiError, getImageUrl } from "@utils";

// ── React Query hooks (inline — no separate file needed) ──────
function useProducts(params) {
  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: async () => {
      const { data } = await productsApi.getProducts(params);
      return data;
    },
    staleTime: 30 * 1000,
  });
}

function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await productsApi.getCategories();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────
// Variant Row (inside the panel)
// ─────────────────────────────────────────────────────────────
function VariantRow({ variant, productSlug, onDeleted }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ ...variant });
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await productsApi.updateVariant(productSlug, variant.id, {
        size:      form.size,
        color:     form.color,
        color_hex: form.color_hex,
        sku:       form.sku,
        price:     form.price,
        stock:     form.stock,
        is_active: form.is_active,
      });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Variant updated.");
      setEditing(false);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this variant?")) return;
    setDeleting(true);
    try {
      await productsApi.deleteVariant(productSlug, variant.id);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Variant deleted.");
      onDeleted?.();
    } catch (err) {
      toast.error(getApiError(err));
      setDeleting(false);
    }
  };

  const field = (key, type = "text", extra = {}) => (
    <input
      type={type}
      value={form[key]}
      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
      className="w-full rounded-lg border px-2 py-1 text-xs outline-none focus:border-[#C2A98A]"
      style={{ borderColor: "#E5DCD3", color: "#2B2B2B" }}
      {...extra}
    />
  );

  if (editing) {
    return (
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{ borderColor: "#C2A98A", backgroundColor: "#FAF7F4" }}
      >
        <div className="grid grid-cols-3 gap-2">
          <div><p className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>SIZE</p>{field("size")}</div>
          <div><p className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>COLOR</p>{field("color")}</div>
          <div><p className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>HEX</p>{field("color_hex")}</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><p className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>SKU</p>{field("sku")}</div>
          <div><p className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>PRICE (₹)</p>{field("price", "number", { min: 0 })}</div>
          <div><p className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>STOCK</p>{field("stock", "number", { min: 0 })}</div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#2B2B2B" }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="accent-[#C2A98A]"
            />
            Active
          </label>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: "#E5DCD3", color: "#7A6E67" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "#C2A98A" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{
        borderColor:     "#E5DCD3",
        backgroundColor: variant.is_active ? "white" : "#F8F5F2",
        opacity:         variant.is_active ? 1 : 0.6,
      }}
    >
      {/* Color swatch */}
      {variant.color_hex && (
        <div
          className="h-5 w-5 shrink-0 rounded-full border"
          style={{ backgroundColor: variant.color_hex, borderColor: "#E5DCD3" }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: "#2B2B2B" }}>
          {[variant.size, variant.color].filter(Boolean).join(" / ") || "Standard"}
        </p>
        <p className="text-[10px]" style={{ color: "#7A6E67" }}>
          SKU: {variant.sku} · ₹{parseFloat(variant.effective_price).toLocaleString("en-IN")} · Stock: {variant.stock}
        </p>
      </div>
      {/* Stock badge */}
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
        style={{
          backgroundColor: variant.stock === 0 ? "#FDF3F0" : variant.stock <= 5 ? "#FFF8EE" : "#F0FDF4",
          color:           variant.stock === 0 ? "#D97757" : variant.stock <= 5 ? "#f59e0b" : "#16a34a",
        }}
      >
        {variant.stock === 0 ? "OUT" : variant.stock}
      </span>
      {/* Actions */}
      <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-[#EDE3D9]">
        <Edit2 size={12} style={{ color: "#C2A98A" }} />
      </button>
      <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-[#FDF3F0]">
        <Trash2 size={12} style={{ color: "#D97757" }} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Add Variant Form
// ─────────────────────────────────────────────────────────────
const EMPTY_VARIANT = { size: "", color: "", color_hex: "", sku: "", price: "", stock: 0, is_active: true };

function AddVariantForm({ productSlug, onAdded }) {
  const qc = useQueryClient();
  const [form, setForm]   = useState(EMPTY_VARIANT);
  const [saving, setSaving] = useState(false);
  const [show, setShow]   = useState(false);

  const handleAdd = async () => {
    if (!form.sku.trim()) { toast.error("SKU is required."); return; }
    setSaving(true);
    try {
      await productsApi.createVariant(productSlug, form);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Variant added.");
      setForm(EMPTY_VARIANT);
      setShow(false);
      onAdded?.();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-xs font-semibold transition-colors hover:border-[#C2A98A] hover:text-[#C2A98A]"
        style={{ borderColor: "#E5DCD3", color: "#7A6E67" }}
      >
        <Plus size={13} /> Add Variant
      </button>
    );
  }

  const field = (key, label, type = "text", extra = {}) => (
    <div>
      <p className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>{label}</p>
      <input
        type={type}
        value={form[key]}
        placeholder={label.toLowerCase()}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-[#C2A98A]"
        style={{ borderColor: "#E5DCD3" }}
        {...extra}
      />
    </div>
  );

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#C2A98A", backgroundColor: "#FAF7F4" }}>
      <p className="text-xs font-bold tracking-widest" style={{ color: "#C2A98A" }}>NEW VARIANT</p>
      <div className="grid grid-cols-3 gap-2">
        {field("size",      "SIZE")}
        {field("color",     "COLOR")}
        {field("color_hex", "HEX")}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {field("sku",   "SKU *")}
        {field("price", "PRICE (₹)", "number", { min: 0 })}
        {field("stock", "STOCK",     "number", { min: 0 })}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShow(false)}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
          style={{ borderColor: "#E5DCD3", color: "#7A6E67" }}
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={saving}
          className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white"
          style={{ backgroundColor: "#C2A98A" }}
        >
          {saving ? "Adding…" : "Add Variant"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Product Panel (Create / Edit slide-over)
// ─────────────────────────────────────────────────────────────
const EMPTY_PRODUCT = {
  title: "", slug: "", brand: "", description: "",
  category: "", base_price: "", sale_price: "", is_active: true,
};

function ProductPanel({ product, categories, onClose }) {
  const qc           = useQueryClient();
  const isEdit       = !!product;
  const imageRef     = useRef(null);

  const [form,     setForm]     = useState(isEdit ? {
    title:       product.title,
    brand:       product.brand,
    description: product.description || "",
    category:    product.category?.id || "",
    base_price:  product.base_price,
    sale_price:  product.sale_price || "",
    is_active:   product.is_active,
  } : EMPTY_PRODUCT);

  const [saving,       setSaving]       = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [localImages,  setLocalImages]  = useState(product?.images || []);
  const [variants,     setVariants]     = useState(product?.variants || []);
  const [activeTab,    setActiveTab]    = useState("details"); // details | images | variants

  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // ── Save product (create or update) ──────────────────────
  const handleSave = async () => {
    if (!form.title.trim())      { toast.error("Title is required.");      return; }
    if (!form.base_price)        { toast.error("Base price is required."); return; }
    if (!form.category && !isEdit) { toast.error("Category is required."); return; }

    setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        ...(form.slug && { slug: form.slug.trim() }),
        brand:       form.brand.trim(),
        description: form.description.trim(),
        category:    form.category || undefined,
        base_price:  parseFloat(form.base_price),
        sale_price:  form.sale_price ? parseFloat(form.sale_price) : null,
        is_active:   form.is_active,
      };

      if (isEdit) {
        await productsApi.updateProduct(product.slug, payload);
        toast.success("Product updated.");
      } else {
        await productsApi.createProduct(payload);
        toast.success("Product created.");
      }
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      onClose();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Upload image ──────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isEdit) return;

    setUploadingImg(true);
    const fd = new FormData();
    fd.append("image", file);
    fd.append("is_primary", localImages.length === 0 ? "true" : "false");
    fd.append("alt_text", form.title);

    try {
      const { data } = await productsApi.uploadImage(product.slug, fd);
      setLocalImages((prev) => [...prev, data]);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUploadingImg(false);
      if (imageRef.current) imageRef.current.value = "";
    }
  };

  // ── Delete image ──────────────────────────────────────────
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await productsApi.deleteImage(product.slug, imageId);
      setLocalImages((prev) => prev.filter((img) => img.id !== imageId));
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Image deleted.");
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const tabs = [
    { key: "details",  label: "Details"  },
    { key: "images",   label: `Images (${localImages.length})`  },
    { key: "variants", label: `Variants (${variants.length})` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col shadow-2xl"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-6 py-5"
          style={{ borderColor: "#E5DCD3" }}
        >
          <div>
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#C2A98A" }}>
              {isEdit ? "EDIT PRODUCT" : "NEW PRODUCT"}
            </p>
            <h2 className="font-display text-xl" style={{ color: "#2B2B2B" }}>
              {isEdit ? product.title : "Create Product"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-[#F8F5F2]">
            <X size={16} style={{ color: "#7A6E67" }} />
          </button>
        </div>

        {/* Tabs (only show images/variants when editing) */}
        {isEdit && (
          <div
            className="flex shrink-0 gap-1 border-b px-4 pt-2"
            style={{ borderColor: "#E5DCD3" }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="rounded-t-lg px-4 py-2 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: activeTab === t.key ? "white"   : "transparent",
                  color:           activeTab === t.key ? "#2B2B2B" : "#7A6E67",
                  borderBottom:    activeTab === t.key ? "2px solid #C2A98A" : "2px solid transparent",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── Details Tab ─────────────────────────────── */}
          {activeTab === "details" && (
            <>
              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{ borderColor: "#E5DCD3" }}>
                <span className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                  Product Active
                </span>
                <button onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}>
                  {form.is_active
                    ? <ToggleRight size={26} style={{ color: "#C2A98A" }} />
                    : <ToggleLeft  size={26} style={{ color: "#7A6E67" }} />
                  }
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
                  TITLE *
                </label>
                <input
                  value={form.title}
                  onChange={set("title")}
                  placeholder="e.g. Classic Oxford Shirt"
                  className="input-ivory w-full"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
                  BRAND
                </label>
                <input
                  value={form.brand}
                  onChange={set("brand")}
                  placeholder="e.g. Trendio Essentials"
                  className="input-ivory w-full"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
                  CATEGORY *
                </label>
                <select
                  value={form.category}
                  onChange={set("category")}
                  className="input-ivory w-full"
                >
                  <option value="">Select category…</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
                    BASE PRICE (₹) *
                  </label>
                  <input
                    type="number" min="0" value={form.base_price}
                    onChange={set("base_price")}
                    placeholder="1299"
                    className="input-ivory w-full"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
                    SALE PRICE (₹)
                  </label>
                  <input
                    type="number" min="0" value={form.sale_price}
                    onChange={set("sale_price")}
                    placeholder="999 (optional)"
                    className="input-ivory w-full"
                  />
                </div>
              </div>

              {/* Discount preview */}
              {form.base_price && form.sale_price && parseFloat(form.sale_price) < parseFloat(form.base_price) && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                  style={{ backgroundColor: "#F0FDF4" }}>
                  <Tag size={13} style={{ color: "#16a34a" }} />
                  <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                    {Math.round((1 - parseFloat(form.sale_price) / parseFloat(form.base_price)) * 100)}% discount
                  </span>
                </div>
              )}

              {/* Description */}
              <div>
                {/* Slug / URL */}
<div>
  <label className="mb-1.5 block text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
    URL SLUG
  </label>
  <div className="flex items-center rounded-xl border overflow-hidden"
    style={{ borderColor: "#E5DCD3" }}>
    <span
      className="shrink-0 border-r px-3 py-2.5 text-xs"
      style={{ backgroundColor: "#F8F5F2", borderColor: "#E5DCD3", color: "#7A6E67" }}
    >
      /product/
    </span>
    <input
      value={form.slug || ""}
      onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))}
      placeholder="auto-generated-from-title"
      className="flex-1 bg-transparent px-3 py-2.5 text-xs outline-none"
      style={{ color: "#2B2B2B" }}
    />
  </div>
  <p className="mt-1 text-[10px]" style={{ color: "#7A6E67" }}>
    Leave blank to auto-generate from title. Only lowercase letters, numbers, hyphens.
  </p>
</div>

{/* Description */}
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  rows={4}
                  placeholder="Product description…"
                  className="input-ivory w-full resize-none"
                />
              </div>
            </>
          )}

          {/* ── Images Tab ──────────────────────────────── */}
          {activeTab === "images" && isEdit && (
            <>
              {localImages.length === 0 ? (
                <div className="rounded-xl py-8 text-center" style={{ backgroundColor: "#F8F5F2" }}>
                  <ImageIcon size={28} className="mx-auto mb-2" style={{ color: "#C2A98A" }} />
                  <p className="text-sm" style={{ color: "#7A6E67" }}>No images yet. Upload below.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {localImages.map((img) => (
                    <div key={img.id} className="group relative">
                      <div className="aspect-square overflow-hidden rounded-xl"
                        style={{ backgroundColor: "#EDE3D9" }}>
                        <img
                          src={getImageUrl(img.image)}
                          alt={img.alt_text}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </div>
                      {img.is_primary && (
                        <span className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                          style={{ backgroundColor: "#C2A98A", color: "white" }}>
                          PRIMARY
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ backgroundColor: "#D97757" }}
                      >
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload */}
              <input ref={imageRef} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
              <button
                onClick={() => imageRef.current?.click()}
                disabled={uploadingImg}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-semibold transition-colors hover:border-[#C2A98A] hover:text-[#C2A98A] disabled:opacity-50"
                style={{ borderColor: "#E5DCD3", color: "#7A6E67" }}
              >
                <Upload size={16} />
                {uploadingImg ? "Uploading…" : "Upload Image"}
              </button>

              {!isEdit && (
                <p className="rounded-xl p-3 text-xs text-center" style={{ backgroundColor: "#FFF8EE", color: "#f59e0b" }}>
                  Save the product first, then upload images.
                </p>
              )}
            </>
          )}

          {/* ── Variants Tab ────────────────────────────── */}
          {activeTab === "variants" && isEdit && (
            <>
              {variants.length === 0 ? (
                <div className="rounded-xl py-6 text-center" style={{ backgroundColor: "#F8F5F2" }}>
                  <Layers size={24} className="mx-auto mb-2" style={{ color: "#C2A98A" }} />
                  <p className="text-sm" style={{ color: "#7A6E67" }}>No variants yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {variants.map((v) => (
                    <VariantRow
                      key={v.id}
                      variant={v}
                      productSlug={product.slug}
                      onDeleted={() => setVariants((prev) => prev.filter((x) => x.id !== v.id))}
                    />
                  ))}
                </div>
              )}

              <AddVariantForm
                productSlug={product.slug}
                onAdded={async () => {
                  const { data } = await productsApi.getVariants(product.slug);
                  setVariants(data);
                }}
              />
            </>
          )}
        </div>

        {/* Footer — always visible */}
        {activeTab === "details" && (
          <div
            className="shrink-0 border-t px-6 py-4 flex gap-3"
            style={{ borderColor: "#E5DCD3" }}
          >
            <button
              onClick={onClose}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving
                ? "Saving…"
                : isEdit ? "Save Changes" : "Create Product"
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main AdminProducts Page
// ─────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const qc = useQueryClient();

  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("");
  const [activeOnly,  setActiveOnly]  = useState("");
  const [page,        setPage]        = useState(1);
  const [panelProduct, setPanelProduct] = useState(undefined); // undefined = closed, null = create, obj = edit
  const [togglingId,   setTogglingId]  = useState(null);

  // Debounced search
  const [dSearch, setDSearch] = useState("");
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._pSearchTimer);
    window._pSearchTimer = setTimeout(() => { setDSearch(val); setPage(1); }, 400);
  };

  const { data: productData, isLoading, isError } = useProducts({
    ...(dSearch   && { search:   dSearch }),
    ...(category  && { category: category }),
    ...(activeOnly && { is_active: activeOnly }),
    page,
    page_size: 12,
  });

  const { data: categoriesRaw } = useCategories();
  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : categoriesRaw?.results ?? [];

  const products = productData?.results ?? productData ?? [];
  const count    = productData?.count   ?? products.length;
  const hasNext  = !!productData?.next;
  const hasPrev  = !!productData?.previous;

  // ── Toggle is_active ──────────────────────────────────────
  const handleToggleActive = async (product) => {
    setTogglingId(product.id);
    try {
      await productsApi.updateProduct(product.slug, { is_active: !product.is_active });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`Product ${product.is_active ? "deactivated" : "activated"}.`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete product ────────────────────────────────────────
  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    try {
      await productsApi.deleteProduct(product.slug);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted.");
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="py-6 pr-2">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>ADMIN</p>
          <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>Products</h1>
          {!isLoading && (
            <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>{count} product{count !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to="/admin/products/bulk-upload"
            className="btn-outline flex items-center gap-2 text-xs"
          >
            <Upload size={13} /> Bulk Upload
          </Link>
          <button
            onClick={() => setPanelProduct(null)}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus size={13} /> Add Product
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
          style={{ borderColor: "#E5DCD3", backgroundColor: "white" }}
        >
          <Search size={13} style={{ color: "#C2A98A" }} />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products…"
            className="w-44 bg-transparent text-xs outline-none"
            style={{ color: "#2B2B2B" }}
          />
          {search && (
            <button onClick={() => { setSearch(""); setDSearch(""); }}>
              <X size={11} style={{ color: "#7A6E67" }} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#C2A98A]"
          style={{ borderColor: "#E5DCD3", color: "#2B2B2B", backgroundColor: "white" }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        {/* Active filter */}
        {[
          { label: "All",      value: "" },
          { label: "Active",   value: "true" },
          { label: "Inactive", value: "false" },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setActiveOnly(value); setPage(1); }}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              backgroundColor: activeOnly === value ? "#C2A98A" : "#EDE3D9",
              color:           activeOnly === value ? "white"   : "#7A6E67",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl py-16 text-center" style={{ backgroundColor: "#FDF3F0" }}>
          <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: "#D97757" }} />
          <p className="text-sm" style={{ color: "#D97757" }}>Failed to load products.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <Package size={44} className="mb-3" style={{ color: "#C2A98A" }} strokeWidth={1.5} />
          <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>No products found</p>
          <p className="mt-2 text-sm" style={{ color: "#7A6E67" }}>
            {dSearch ? "Try a different search." : "Add your first product."}
          </p>
          {!dSearch && (
            <button onClick={() => setPanelProduct(null)} className="btn-primary mt-5">
              <Plus size={14} /> Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const img = getImageUrl(product.primary_image);
            return (
              <div
                key={product.id}
                className="group card-ivory overflow-hidden transition-shadow duration-150 hover:shadow-ivory-md"
                style={{ opacity: product.is_active ? 1 : 0.6 }}
              >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: "#EDE3D9" }}>
                  {img ? (
                    <img
                      src={img}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-display text-4xl italic opacity-20" style={{ color: "#C2A98A" }}>T</span>
                    </div>
                  )}

                  {/* Inactive overlay */}
                  {!product.is_active && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white tracking-widest"
                        style={{ backgroundColor: "#D97757" }}>INACTIVE</span>
                    </div>
                  )}

                  {/* Discount badge */}
                  {product.discount_percent > 0 && (
                    <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                      style={{ backgroundColor: "#C2A98A" }}>
                      -{product.discount_percent}%
                    </span>
                  )}

                  {/* Action overlay */}
                  <div className="absolute inset-x-0 bottom-0 flex gap-1.5 p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}>
                    <button
                      onClick={() => setPanelProduct(product)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: "rgba(194,169,138,0.9)" }}
                    >
                      <Edit2 size={10} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(product)}
                      disabled={togglingId === product.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: product.is_active ? "rgba(217,119,87,0.9)" : "rgba(22,163,74,0.9)" }}
                    >
                      {product.is_active ? <ToggleLeft size={10} /> : <ToggleRight size={10} />}
                      {product.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="truncate text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                    {product.title}
                  </p>
                  <p className="text-[10px]" style={{ color: "#C2A98A" }}>
                    {product.category?.name || "—"}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                        ₹{parseFloat(product.effective_price).toLocaleString("en-IN")}
                      </span>
                      {product.sale_price && (
                        <span className="ml-1.5 text-[10px] line-through" style={{ color: "#C0B8B4" }}>
                          ₹{parseFloat(product.base_price).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    {/* Stock indicator */}
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{
                        backgroundColor: !product.is_in_stock ? "#FDF3F0" : "#F0FDF4",
                        color:           !product.is_in_stock ? "#D97757" : "#16a34a",
                      }}
                    >
                      {product.is_in_stock ? "IN STOCK" : "OUT"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(hasNext || hasPrev) && (
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => setPage((p) => p - 1)} disabled={!hasPrev}
            className="btn-outline px-5 py-2 disabled:opacity-40">Previous</button>
          <span className="flex items-center px-3 text-sm" style={{ color: "#7A6E67" }}>Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext}
            className="btn-primary px-5 py-2 disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Panel */}
      {panelProduct !== undefined && (
        <ProductPanel
          product={panelProduct}
          categories={categories}
          onClose={() => setPanelProduct(undefined)}
        />
      )}
    </div>
  );
}