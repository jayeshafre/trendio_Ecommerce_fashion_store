/**
 * ProfilePage.jsx
 * Route: /account/profile
 *
 * Two sections:
 *   1. Personal info — edit first_name, last_name, phone (PATCH /auth/me/)
 *   2. Change password — current + new + confirm (POST /auth/password/change/)
 *
 * Read-only display: email, role, member since, verification status
 */
import { useReducer, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, ShieldCheck, ChevronLeft,
  Eye, EyeOff, Lock, CheckCircle2,
} from "lucide-react";
import { useMe, useUpdateProfile, useChangePassword } from "@hooks/useProfile";
import { ROUTES } from "@constants";

// ── Profile form reducer ──────────────────────────────────────
function profileReducer(state, action) {
  if (action.type === "INIT")       return { ...action.values, _dirty: false };
  if (action.type === "SET_FIELD")  return { ...state, [action.field]: action.value, _dirty: true };
  if (action.type === "MARK_CLEAN") return { ...state, _dirty: false };
  return state;
}

// ── Password form reducer ─────────────────────────────────────
const PWD_EMPTY = { current_password: "", new_password: "", new_password2: "" };

function pwdReducer(state, action) {
  if (action.type === "SET")   return { ...state, [action.field]: action.value };
  if (action.type === "RESET") return { ...PWD_EMPTY };
  return state;
}

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const updateProfile             = useUpdateProfile();
  const changePassword            = useChangePassword();

  // Profile form
  const [profile, dispatchProfile] = useReducer(profileReducer, {
    first_name: "", last_name: "", phone: "", _dirty: false,
  });
  const [profileErrors, setProfileErrors] = useState({});

  // Sync profile form when user data loads
  useEffect(() => {
    if (user) {
      dispatchProfile({
        type:   "INIT",
        values: {
          first_name: user.first_name ?? "",
          last_name:  user.last_name  ?? "",
          phone:      user.phone      ?? "",
        },
      });
    }
  }, [user]);

  // Password form
  const [pwd, dispatchPwd]   = useReducer(pwdReducer, PWD_EMPTY);
  const [pwdErrors, setPwdErrors] = useState({});
  const [showPwd, setShowPwd]     = useState({
    current: false, new: false, confirm: false,
  });

  // ── Profile submit ──────────────────────────────────────────
  const validateProfile = () => {
    const e = {};
    if (!profile.first_name.trim()) e.first_name = "First name is required";
    if (!profile.last_name.trim())  e.last_name  = "Last name is required";
    if (profile.phone && !/^\d{10}$/.test(profile.phone.replace(/\s/g, ""))) {
      e.phone = "Enter a valid 10-digit mobile number";
    }
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    updateProfile.mutate(
      {
        first_name: profile.first_name.trim(),
        last_name:  profile.last_name.trim(),
        phone:      profile.phone.replace(/\s/g, "") || null,
      },
      { onSuccess: () => dispatchProfile({ type: "MARK_CLEAN" }) }
    );
  };

  // ── Password submit ─────────────────────────────────────────
  const validatePwd = () => {
    const e = {};
    if (!pwd.current_password)         e.current_password = "Enter your current password";
    if (pwd.new_password.length < 8)   e.new_password     = "Minimum 8 characters";
    if (pwd.new_password !== pwd.new_password2) {
      e.new_password2 = "Passwords do not match";
    }
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePwdSubmit = (e) => {
    e.preventDefault();
    if (!validatePwd()) return;
    changePassword.mutate(pwd, {
      onSuccess: () => {
        dispatchPwd({ type: "RESET" });
        setPwdErrors({});
      },
    });
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10 animate-fade-in">

      {/* Back */}
      <Link
        to={ROUTES.ACCOUNT}
        className="mb-6 flex items-center gap-1.5 text-xs font-semibold tracking-widest transition-opacity hover:opacity-60"
        style={{ color: "#7A6E67" }}
      >
        <ChevronLeft size={14} />
        ACCOUNT
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>ACCOUNT</p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>Profile & Security</h1>
      </div>

      {/* ── Read-only info strip ─────────────────────────── */}
      <div
        className="mb-6 flex flex-wrap items-center gap-4 rounded-xl px-5 py-4"
        style={{ backgroundColor: "#EDE3D9" }}
      >
        <InfoChip icon={<Mail size={13} />} label="Email" value={user?.email} />
        <div className="hidden h-4 w-px sm:block" style={{ backgroundColor: "#C2A98A", opacity: 0.3 }} />
        <InfoChip
          icon={<ShieldCheck size={13} />}
          label="Status"
          value={user?.is_verified ? "Verified" : "Unverified"}
          valueColor={user?.is_verified ? "#16a34a" : "#D97757"}
        />
        <div className="hidden h-4 w-px sm:block" style={{ backgroundColor: "#C2A98A", opacity: 0.3 }} />
        <InfoChip
          icon={<User size={13} />}
          label="Role"
          value={user?.role === "admin" ? "Admin" : "Customer"}
        />
      </div>

      {/* ── Personal info form ───────────────────────────── */}
      <section className="card-ivory mb-6 p-6">
        <div className="mb-5 flex items-center gap-2">
          <User size={15} style={{ color: "#C2A98A" }} />
          <h2 className="font-display text-lg" style={{ color: "#2B2B2B" }}>Personal Information</h2>
        </div>

        <form onSubmit={handleProfileSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField
              label="First Name"
              value={profile.first_name}
              error={profileErrors.first_name}
              onChange={(v) => {
                dispatchProfile({ type: "SET_FIELD", field: "first_name", value: v });
                setProfileErrors((e) => ({ ...e, first_name: "" }));
              }}
              placeholder="Rahul"
              required
            />
            <ProfileField
              label="Last Name"
              value={profile.last_name}
              error={profileErrors.last_name}
              onChange={(v) => {
                dispatchProfile({ type: "SET_FIELD", field: "last_name", value: v });
                setProfileErrors((e) => ({ ...e, last_name: "" }));
              }}
              placeholder="Sharma"
              required
            />
          </div>

          <ProfileField
            label="Mobile Number"
            value={profile.phone}
            error={profileErrors.phone}
            onChange={(v) => {
              dispatchProfile({ type: "SET_FIELD", field: "phone", value: v });
              setProfileErrors((e) => ({ ...e, phone: "" }));
            }}
            placeholder="9876543210"
            inputMode="numeric"
            maxLength={10}
            icon={<Phone size={13} style={{ color: "#C2A98A" }} />}
          />

          <div className="flex items-center justify-between pt-1">
            {profile._dirty && (
              <p className="text-xs" style={{ color: "#C2A98A" }}>Unsaved changes</p>
            )}
            <button
              type="submit"
              disabled={!profile._dirty || updateProfile.isPending}
              className="btn-primary ml-auto disabled:opacity-40"
            >
              {updateProfile.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ── Change password form ─────────────────────────── */}
      <section className="card-ivory p-6">
        <div className="mb-5 flex items-center gap-2">
          <Lock size={15} style={{ color: "#C2A98A" }} />
          <h2 className="font-display text-lg" style={{ color: "#2B2B2B" }}>Change Password</h2>
        </div>

        <form onSubmit={handlePwdSubmit} noValidate className="space-y-4">
          <PasswordField
            label="Current Password"
            value={pwd.current_password}
            error={pwdErrors.current_password}
            show={showPwd.current}
            onToggle={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
            onChange={(v) => {
              dispatchPwd({ type: "SET", field: "current_password", value: v });
              setPwdErrors((e) => ({ ...e, current_password: "" }));
            }}
            placeholder="Your current password"
          />

          <PasswordField
            label="New Password"
            value={pwd.new_password}
            error={pwdErrors.new_password}
            show={showPwd.new}
            onToggle={() => setShowPwd((s) => ({ ...s, new: !s.new }))}
            onChange={(v) => {
              dispatchPwd({ type: "SET", field: "new_password", value: v });
              setPwdErrors((e) => ({ ...e, new_password: "" }));
            }}
            placeholder="Minimum 8 characters"
          />

          {/* Strength indicator */}
          {pwd.new_password && (
            <PasswordStrength password={pwd.new_password} />
          )}

          <PasswordField
            label="Confirm New Password"
            value={pwd.new_password2}
            error={pwdErrors.new_password2}
            show={showPwd.confirm}
            onToggle={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
            onChange={(v) => {
              dispatchPwd({ type: "SET", field: "new_password2", value: v });
              setPwdErrors((e) => ({ ...e, new_password2: "" }));
            }}
            placeholder="Repeat new password"
          />

          {/* Match indicator */}
          {pwd.new_password && pwd.new_password2 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                size={13}
                style={{ color: pwd.new_password === pwd.new_password2 ? "#16a34a" : "#D97757" }}
              />
              <span
                className="text-xs"
                style={{ color: pwd.new_password === pwd.new_password2 ? "#16a34a" : "#D97757" }}
              >
                {pwd.new_password === pwd.new_password2 ? "Passwords match" : "Passwords do not match"}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="btn-primary w-full"
          >
            {changePassword.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating Password…
              </span>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function InfoChip({ icon, label, value, valueColor }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "#C2A98A" }}>{icon}</span>
      <div>
        <p className="text-[9px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
          {label.toUpperCase()}
        </p>
        <p className="text-xs font-medium" style={{ color: valueColor ?? "#2B2B2B" }}>
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

// Stable module-level component — no focus loss
function ProfileField({ label, value, error, onChange, placeholder, required, inputMode, maxLength, icon }) {
  return (
    <div>
      <label className="label-ivory">
        {label} {required && <span style={{ color: "#D97757" }}>*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete="off"
          className={`input-ivory ${icon ? "pl-9" : ""} ${error ? "error" : ""}`}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function PasswordField({ label, value, error, show, onToggle, onChange, placeholder }) {
  return (
    <div>
      <label className="label-ivory">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`input-ivory pr-10 ${error ? "error" : ""}`}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
        >
          {show
            ? <EyeOff size={15} style={{ color: "#7A6E67" }} />
            : <Eye    size={15} style={{ color: "#7A6E67" }} />
          }
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: "Weak",   color: "#D97757" },
    { label: "Fair",   color: "#f59e0b" },
    { label: "Good",   color: "#84cc16" },
    { label: "Strong", color: "#16a34a" },
  ];
  const { label, color } = levels[score - 1] ?? levels[0];

  return (
    <div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? color : "#E5DCD3" }}
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] font-semibold" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-10 space-y-6">
      <div className="skeleton h-6 w-24 rounded" />
      <div className="skeleton h-9 w-56 rounded" />
      <div className="skeleton h-16 w-full rounded-xl" />
      <div className="skeleton h-52 w-full rounded-xl" />
      <div className="skeleton h-64 w-full rounded-xl" />
    </div>
  );
}