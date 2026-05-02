/**
 * AddressForm.jsx — FIXED
 *
 * Root cause of focus loss:
 *   The form was being UNMOUNTED + REMOUNTED on every keystroke because
 *   it was defined as an inline component inside CheckoutPage's render.
 *   React treats inline component definitions as new component types each
 *   render → unmounts old tree → mounts new tree → input loses focus.
 *
 * Fix:
 *   - This file is a stable top-level export (never inline)
 *   - useReducer instead of multiple useState calls (single dispatch,
 *     no stale closure risk)
 *   - Checkbox uses onChange on a real <input type="checkbox"> (not a div
 *     with onClick which caused the blur-on-click issue)
 *   - No derived state, no effects — pure controlled form
 *
 * Props:
 *   initialData  → pre-fill for edit mode (plain object)
 *   onSubmit(data) → called with validated form data
 *   onCancel()   → optional cancel handler
 *   isLoading    → disables submit while mutating
 */
import { useReducer, useCallback } from "react";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const EMPTY_FORM = {
  full_name:     "",
  phone:         "",
  address_line1: "",
  address_line2: "",
  city:          "",
  state:         "",
  pincode:       "",
  is_default:    false,
};

// Single reducer — avoids multiple useState re-render cascade
function formReducer(state, action) {
  if (action.type === "SET_FIELD") {
    return {
      ...state,
      values: { ...state.values, [action.field]: action.value },
      errors: { ...state.errors, [action.field]: "" },   // clear field error on change
    };
  }
  if (action.type === "SET_ERRORS") {
    return { ...state, errors: action.errors };
  }
  return state;
}

function buildInitial(initialData) {
  return {
    values: { ...EMPTY_FORM, ...initialData },
    errors: {},
  };
}

function validate(values) {
  const e = {};
  if (!values.full_name.trim())
    e.full_name = "Full name is required";
  if (!/^\d{10}$/.test(values.phone.replace(/\s/g, "")))
    e.phone = "Enter a valid 10-digit mobile number";
  if (!values.address_line1.trim())
    e.address_line1 = "Address is required";
  if (!values.city.trim())
    e.city = "City is required";
  if (!values.state)
    e.state = "State is required";
  if (!/^\d{6}$/.test(values.pincode.replace(/\s/g, "")))
    e.pincode = "Enter a valid 6-digit pincode";
  return e;
}

export default function AddressForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [state, dispatch] = useReducer(formReducer, initialData, buildInitial);
  const { values, errors } = state;

  // Stable handler — won't cause child re-renders
  const handleChange = useCallback((field, value) => {
    dispatch({ type: "SET_FIELD", field, value });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: "SET_ERRORS", errors: errs });
      return;
    }
    onSubmit({
      ...values,
      phone:   values.phone.replace(/\s/g, ""),
      pincode: values.pincode.replace(/\s/g, ""),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">

      {/* Row 1: Name + Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Full Name"
          name="full_name"
          value={values.full_name}
          error={errors.full_name}
          placeholder="Rahul Sharma"
          onChange={handleChange}
          required
        />
        <TextField
          label="Mobile"
          name="phone"
          value={values.phone}
          error={errors.phone}
          placeholder="9876543210"
          inputMode="numeric"
          maxLength={10}
          onChange={handleChange}
          required
        />
      </div>

      {/* Address Line 1 */}
      <TextField
        label="Address Line 1"
        name="address_line1"
        value={values.address_line1}
        error={errors.address_line1}
        placeholder="House No, Street, Area"
        onChange={handleChange}
        required
      />

      {/* Address Line 2 */}
      <TextField
        label="Address Line 2"
        name="address_line2"
        value={values.address_line2}
        error={errors.address_line2}
        placeholder="Landmark (optional)"
        onChange={handleChange}
      />

      {/* Row 2: City, State, Pincode */}
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="City"
          name="city"
          value={values.city}
          error={errors.city}
          placeholder="Nagpur"
          onChange={handleChange}
          required
        />

        {/* State select */}
        <div>
          <label className="label-ivory">
            State <span style={{ color: "#D97757" }}>*</span>
          </label>
          <select
            value={values.state}
            onChange={(e) => handleChange("state", e.target.value)}
            className={`input-ivory ${errors.state ? "error" : ""}`}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className="error-text">{errors.state}</p>}
        </div>

        <TextField
          label="Pincode"
          name="pincode"
          value={values.pincode}
          error={errors.pincode}
          placeholder="440001"
          inputMode="numeric"
          maxLength={6}
          onChange={handleChange}
          required
        />
      </div>

      {/* Default address — real checkbox, not a div */}
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={values.is_default}
          onChange={(e) => handleChange("is_default", e.target.checked)}
          className="h-4 w-4 rounded border-2 accent-[#C2A98A] cursor-pointer"
          style={{ accentColor: "#C2A98A" }}
        />
        <span className="text-xs" style={{ color: "#7A6E67" }}>
          Set as default address
        </span>
      </label>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </span>
          ) : (
            initialData ? "Update Address" : "Save Address"
          )}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * TextField — stable sub-component.
 * MUST be defined at module level (not inside AddressForm) so React
 * never treats it as a new component type between renders.
 */
function TextField({
  label, name, value, error, placeholder,
  onChange, required, inputMode, maxLength,
}) {
  return (
    <div>
      <label className="label-ivory">
        {label}{" "}
        {required && <span style={{ color: "#D97757" }}>*</span>}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete="off"
        className={`input-ivory ${error ? "error" : ""}`}
        onChange={(e) => onChange(name, e.target.value)}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}