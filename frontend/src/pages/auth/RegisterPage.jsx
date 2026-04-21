/**
 * RegisterPage — Trendio (FIXED)
 *
 * What was broken:
 *   - useSendOtp / useVerifyOtp called authApi.sendOtp which didn't exist
 *   - useVerifyOtp was called with {onSuccess} arg — hook signature changed
 *   - OTP verify/send mutations used wrong call pattern
 *
 * How it works now:
 *   1. User fills name, email, phone
 *   2. Clicks SEND OTP → mutate({ identifier: phone, purpose: "phone_verify" })
 *      → Django logs: [DEV] OTP for 9876543210: 483921
 *   3. User types 6-digit code
 *   4. Clicks VERIFY → mutate({ identifier, code, purpose: "phone_verify" })
 *      → onSuccess sets otpVerified=true
 *   5. User fills password, confirms, checks terms
 *   6. Clicks CREATE ACCOUNT → register mutation → navigates to login
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff, CircleCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import OtpInput from "@components/ui/OtpInput";
import { useOtpTimer } from "@hooks/useOtpTimer";
import { useRegister, useSendOtp, useVerifyOtp } from "@hooks/useAuth";
import { ROUTES } from "@constants";

// ─── Password strength helper ────────────────────────────────
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#D97757", "#f59e0b", "#84cc16", "#22c55e"];
  return { score, label: labels[score] || "", color: colors[score] || "" };
}

// ─── Zod schema ─────────────────────────────────────────────
const schema = z
  .object({
    firstName: z.string().min(2, "Min 2 characters"),
    lastName:  z.string().min(2, "Min 2 characters"),
    email:     z.string().email("Enter a valid email address"),
    phone:     z.string().length(10, "Enter a valid 10-digit number"),
    password:  z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "One uppercase letter (A–Z)")
      .regex(/[0-9]/, "One number (0–9)")
      .regex(/[^A-Za-z0-9]/, "One special character (!@#$%)"),
    confirm: z.string(),
    terms:   z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

// ─── Step progress bar ──────────────────────────────────────
function StepBar({ current }) {
  const steps = ["PERSONAL", "VERIFY", "SECURITY"];
  return (
    <div className="mb-7 flex items-center">
      {steps.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className="h-px flex-1 transition-all duration-300"
                  style={{ backgroundColor: done || active ? "#C2A98A" : "#E5DCD3" }}
                />
              )}
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                style={
                  done
                    ? { backgroundColor: "#C2A98A", color: "#fff" }
                    : active
                    ? { backgroundColor: "#2B2B2B", color: "#fff" }
                    : { backgroundColor: "#EDE3D9", color: "#7A6E67" }
                }
              >
                {done ? <Check size={11} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className="h-px flex-1 transition-all duration-300"
                  style={{ backgroundColor: done ? "#C2A98A" : "#E5DCD3" }}
                />
              )}
            </div>
            <span
              className="mt-1.5 text-[9px] font-semibold tracking-wider"
              style={{ color: active ? "#2B2B2B" : done ? "#C2A98A" : "#7A6E67" }}
            >
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Field validation icon ──────────────────────────────────
function FieldIcon({ valid, error }) {
  if (valid) return <CircleCheck size={15} style={{ color: "#84cc16" }} className="absolute right-3.5 top-1/2 -translate-y-1/2" />;
  if (error) return <AlertCircle size={15} style={{ color: "#D97757" }} className="absolute right-3.5 top-1/2 -translate-y-1/2" />;
  return null;
}

// ─── Input style helper ─────────────────────────────────────
function inputBorder(err, touched) {
  if (err)              return "#D97757";
  if (touched && !err)  return "#84cc16";
  return "#E5DCD3";
}

// ────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep]               = useState(0);
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSent, setOtpSent]         = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp]                 = useState("");
  const [otpError, setOtpError]       = useState("");
  const timer                          = useOtpTimer(221); // 03:41

  // ── Mutations ──────────────────────────────────────────────
  const registerMutation = useRegister();
  const sendOtpMutation  = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  // ── Form ──────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm({ resolver: zodResolver(schema), mode: "onChange" });

  const watchPassword = watch("password", "");
  const watchPhone    = watch("phone", "");
  const strength      = getStrength(watchPassword);

  // ── Submit ────────────────────────────────────────────────
  const onSubmit = (data) => {
    registerMutation.mutate({
      first_name: data.firstName,
      last_name:  data.lastName,
      email:      data.email,
      phone:      data.phone,
      password:   data.password,
      password2:  data.confirm,
    });
  };

  // ── Send OTP ──────────────────────────────────────────────
  // Calls POST /api/v1/auth/otp/send/
  // Check Django terminal for: [DEV] OTP for 9665311057: 483921
  const handleSendOtp = () => {
    if (!watchPhone || watchPhone.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number first.");
      return;
    }
    sendOtpMutation.mutate(
      { identifier: watchPhone, purpose: "phone_verify" },
      {
        onSuccess: () => {
          setOtpSent(true);
          setOtp("");
          setOtpError("");
          timer.restart();
          toast.success("OTP sent! Check your Django terminal in dev.");
        },
        onError: (err) => {
          const msg =
            err?.response?.data?.detail || "Failed to send OTP. Try again.";
          toast.error(msg);
        },
      }
    );
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResendOtp = () => {
    sendOtpMutation.mutate(
      { identifier: watchPhone, purpose: "phone_verify" },
      {
        onSuccess: () => {
          setOtp("");
          setOtpError("");
          timer.restart();
          toast.success("New OTP sent!");
        },
        onError: (err) => {
          toast.error(err?.response?.data?.detail || "Failed to resend OTP.");
        },
      }
    );
  };

  // ── Verify OTP ────────────────────────────────────────────
  // Calls POST /api/v1/auth/otp/verify/
  const handleVerifyOtp = () => {
    if (otp.length < 6) {
      setOtpError("Enter the complete 6-digit code.");
      return;
    }
    setOtpError("");
    verifyOtpMutation.mutate(
      { identifier: watchPhone, code: otp, purpose: "phone_verify" },
      {
        onSuccess: () => {
          setOtpVerified(true);
          setStep(2);
          toast.success("Mobile number verified!");
        },
        onError: (err) => {
          const msg =
            err?.response?.data?.detail ||
            "Invalid or expired code. Please try again.";
          setOtpError(msg);
        },
      }
    );
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#F8F5F2" }}
    >
      <div className="w-full max-w-sm">

        {/* Header */}
        <p className="mb-0.5 text-[10px] font-semibold tracking-[0.18em]" style={{ color: "#7A6E67" }}>
          CREATE ACCOUNT
        </p>
        <h1
          className="mb-1 text-[2rem] font-bold leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
        >
          Your wardrobe awaits.
        </h1>
        <p className="mb-6 text-sm" style={{ color: "#7A6E67" }}>
          Takes less than a minute — let's get you started.
        </p>

        <StepBar current={step} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── First + Last Name ─────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: "firstName", placeholder: "Amara", label: "FIRST NAME" },
              { field: "lastName",  placeholder: "Jones",  label: "LAST NAME" },
            ].map(({ field, placeholder, label }) => (
              <div key={field}>
                <label className="mb-1.5 block text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
                  {label} <span style={{ color: "#D97757" }}>*</span>
                </label>
                <div className="relative">
                  <input
                    {...register(field)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border px-3.5 py-3 pr-9 text-sm outline-none transition-all focus:ring-1 focus:ring-[#C2A98A]"
                    style={{
                      backgroundColor: "#EDE3D9",
                      borderColor: inputBorder(errors[field], touchedFields[field]),
                      color: "#2B2B2B",
                    }}
                  />
                  <FieldIcon
                    valid={touchedFields[field] && !errors[field]}
                    error={!!errors[field]}
                  />
                </div>
                {errors[field] && (
                  <p className="mt-0.5 text-[10px]" style={{ color: "#D97757" }}>
                    {errors[field].message}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── Email ─────────────────────────────────────── */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
              EMAIL ADDRESS <span style={{ color: "#D97757" }}>*</span>
            </label>
            <div className="relative">
              <input
                {...register("email")}
                type="email"
                placeholder="amara.jones@email.com"
                className="w-full rounded-xl border px-4 py-3 pr-9 text-sm outline-none transition-all focus:ring-1 focus:ring-[#C2A98A]"
                style={{
                  backgroundColor: "#EDE3D9",
                  borderColor: inputBorder(errors.email, touchedFields.email),
                  color: "#2B2B2B",
                }}
              />
              <FieldIcon
                valid={touchedFields.email && !errors.email}
                error={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="mt-0.5 text-xs" style={{ color: "#D97757" }}>
                • {errors.email.message}
              </p>
            )}
          </div>

          {/* ── Mobile + OTP ──────────────────────────────── */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "#E5DCD3", backgroundColor: "#FFFFFF" }}
          >
            <label className="mb-2 block text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
              MOBILE NUMBER <span style={{ color: "#D97757" }}>*</span>
              <span className="ml-1 normal-case font-normal tracking-normal">
                — VERIFICATION REQUIRED
              </span>
            </label>

            {/* Phone input row */}
            <div className="flex gap-2">
              <div
                className="flex items-center rounded-xl px-3 text-sm font-medium"
                style={{ backgroundColor: "#EDE3D9", color: "#2B2B2B", minWidth: 52 }}
              >
                +91
              </div>
              <input
                {...register("phone")}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                disabled={otpVerified}
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                style={{
                  backgroundColor: otpVerified ? "#F0F9EA" : "#EDE3D9",
                  borderColor: otpVerified ? "#84cc16" : "#E5DCD3",
                  color: "#2B2B2B",
                }}
              />

              {/* SEND OTP / RESEND button */}
              {!otpVerified && (
                <button
                  type="button"
                  onClick={otpSent ? handleResendOtp : handleSendOtp}
                  disabled={sendOtpMutation.isPending}
                  className="shrink-0 rounded-xl px-3 text-xs font-bold tracking-wide text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#C2A98A" }}
                >
                  {sendOtpMutation.isPending
                    ? "..."
                    : otpSent
                    ? "RESEND"
                    : "SEND OTP"}
                </button>
              )}

              {/* Verified checkmark */}
              {otpVerified && (
                <div className="flex items-center px-1">
                  <CircleCheck size={20} style={{ color: "#84cc16" }} />
                </div>
              )}
            </div>

            {errors.phone && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                • {errors.phone.message}
              </p>
            )}

            {/* OTP entry — shown after SEND OTP clicked */}
            {otpSent && !otpVerified && (
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs" style={{ color: "#7A6E67" }}>
                    Code sent to{" "}
                    <span className="font-semibold" style={{ color: "#C2A98A" }}>
                      +91 {watchPhone}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setOtpError("");
                    }}
                    className="text-xs underline"
                    style={{ color: "#C2A98A" }}
                  >
                    Change number
                  </button>
                </div>

                {/* 6 OTP boxes */}
                <OtpInput value={otp} onChange={setOtp} />

                {/* OTP error */}
                {otpError && (
                  <p className="mt-1.5 text-xs" style={{ color: "#D97757" }}>
                    • {otpError}
                  </p>
                )}

                {/* Timer + resend */}
                <div
                  className="mt-2 flex items-center justify-between text-xs"
                  style={{ color: "#7A6E67" }}
                >
                  <span>
                    Expires in{" "}
                    <span style={{ color: "#D97757" }}>{timer.display}</span>
                  </span>
                  <span>
                    Didn't receive it?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="font-medium disabled:opacity-50"
                      style={{ color: "#C2A98A" }}
                    >
                      {sendOtpMutation.isPending ? "Sending…" : "Resend"}
                    </button>
                  </span>
                </div>

                {/* Verify button */}
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyOtpMutation.isPending || otp.length < 6}
                  className="mt-3 w-full rounded-xl py-2.5 text-xs font-bold tracking-[0.15em] text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#2B2B2B" }}
                >
                  {verifyOtpMutation.isPending
                    ? "VERIFYING…"
                    : "VERIFY MOBILE NUMBER"}
                </button>
              </div>
            )}
          </div>

          {/* ── Password ──────────────────────────────────── */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
              PASSWORD <span style={{ color: "#D97757" }}>*</span>
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all focus:ring-1 focus:ring-[#C2A98A]"
                style={{
                  backgroundColor: "#EDE3D9",
                  borderColor: inputBorder(errors.password, touchedFields.password),
                  color: "#2B2B2B",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#7A6E67" }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength bar */}
            {watchPassword.length > 0 && (
              <div className="mt-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "#7A6E67" }}>
                    Password strength
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          i <= strength.score ? strength.color : "#E5DCD3",
                      }}
                    />
                  ))}
                </div>
                <ul className="mt-2 space-y-0.5">
                  {[
                    { rule: watchPassword.length >= 8,          label: "At least 8 characters" },
                    { rule: /[A-Z]/.test(watchPassword),        label: "One uppercase letter (A–Z)" },
                    { rule: /[0-9]/.test(watchPassword),        label: "One number (0–9)" },
                    { rule: /[^A-Za-z0-9]/.test(watchPassword), label: "One special character (!@#$%)" },
                  ].map(({ rule, label }) => (
                    <li
                      key={label}
                      className="flex items-center gap-1.5 text-[10px]"
                      style={{ color: rule ? "#84cc16" : "#7A6E67" }}
                    >
                      <span>{rule ? "●" : "○"}</span> {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Confirm Password ──────────────────────────── */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
              CONFIRM PASSWORD <span style={{ color: "#D97757" }}>*</span>
            </label>
            <div className="relative">
              <input
                {...register("confirm")}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all focus:ring-1 focus:ring-[#C2A98A]"
                style={{
                  backgroundColor: "#EDE3D9",
                  borderColor: inputBorder(errors.confirm, touchedFields.confirm),
                  color: "#2B2B2B",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#7A6E67" }}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirm && (
              <p className="mt-0.5 text-xs" style={{ color: "#D97757" }}>
                • {errors.confirm.message}
              </p>
            )}
          </div>

          {/* ── Terms ─────────────────────────────────────── */}
          <label
            className="flex cursor-pointer items-start gap-2.5 text-xs"
            style={{ color: "#7A6E67" }}
          >
            <input
              type="checkbox"
              {...register("terms")}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#C2A98A]"
            />
            <span>
              I agree to Trendio's{" "}
              <Link to="/terms" className="underline" style={{ color: "#C2A98A" }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline" style={{ color: "#C2A98A" }}>
                Privacy Policy
              </Link>
              . I consent to receiving curated style updates and offers via SMS &amp; email.
            </span>
          </label>
          {errors.terms && (
            <p className="text-xs" style={{ color: "#D97757" }}>
              • {errors.terms.message}
            </p>
          )}

          {/* ── Create account button ─────────────────────── */}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.15em] text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#C2A98A" }}
          >
            {registerMutation.isPending
              ? "CREATING ACCOUNT…"
              : "CREATE MY TRENDIO ACCOUNT"}
          </button>
        </form>

        {/* Google sign up */}
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex-1 border-t" style={{ borderColor: "#E5DCD3" }} />
            <span className="text-xs" style={{ color: "#7A6E67" }}>
              or sign up with
            </span>
            <div className="flex-1 border-t" style={{ borderColor: "#E5DCD3" }} />
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-xs font-semibold tracking-widest transition-all hover:border-[#C2A98A]"
            style={{ borderColor: "#E5DCD3", color: "#2B2B2B", backgroundColor: "#FFFFFF" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            CONTINUE WITH GOOGLE
          </button>
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: "#7A6E67" }}>
          Already a member?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium"
            style={{ color: "#C2A98A" }}
          >
            Sign in here →
          </Link>
        </p>
      </div>
    </div>
  );
}