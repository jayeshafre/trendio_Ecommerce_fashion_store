/**
 * LoginPage — Trendio
 *
 * Matches design exactly:
 * • Tab toggle: Mobile Number | Email Address
 * • Password input with show/hide + error state
 * • "Keep me signed in" checkbox + Forgot password link
 * • SIGN IN TO TRENDIO warm-sand button
 * • "or login with OTP" divider
 * • Send OTP card → OTP boxes → timer → VERIFY & SIGN IN
 * • Footer: New to Trendio | 256-BIT SECURE
 *
 * Theme: Ivory Luxe — #F8F5F2 bg, #C2A98A accent, #2B2B2B text
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Smartphone, Mail, Lock, ShieldCheck } from "lucide-react";
import OtpInput from "@components/ui/OtpInput";
import { useOtpTimer } from "@hooks/useOtpTimer";
import { useLogin } from "@hooks/useAuth";
import { ROUTES } from "@constants";

// ─── Validation schemas ──────────────────────────────────────
const phoneSchema = z.object({
  phone: z.string().min(10, "Enter a valid 10-digit mobile number").max(10),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [tab, setTab]               = useState("mobile"); // "mobile" | "email"
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [otpSent, setOtpSent]       = useState(false);
  const [otp, setOtp]               = useState("");
  const [otpError, setOtpError]     = useState("");
  const timer                        = useOtpTimer(202); // 03:22

  const loginMutation = useLogin();

  const schema = tab === "mobile" ? phoneSchema : emailSchema;
  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const watchPhone = watch("phone", "");

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  const handleSendOtp = () => {
    if (watchPhone?.length === 10) {
      setOtpSent(true);
      timer.restart();
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }
    setOtpError("");
    // TODO: call authApi.otp.verify({ phone: watchPhone, otp })
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#F8F5F2" }}
    >
      <div className="w-full max-w-sm">

        {/* ── Brand heading ─────────────────────────────────── */}
        <div className="mb-7">
          <h1
            className="mb-1 text-[2.1rem] font-bold leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
          >
            Welcome back.
          </h1>
          <p className="text-sm" style={{ color: "#7A6E67" }}>
            Sign in to continue your{" "}
            <span style={{ color: "#C2A98A", fontStyle: "italic" }}>Trendio</span>{" "}
            journey.
          </p>
        </div>

        {/* ── Tab Toggle ────────────────────────────────────── */}
        <div
          className="mb-6 flex rounded-xl p-1"
          style={{ backgroundColor: "#EDE3D9" }}
        >
          <button
            type="button"
            onClick={() => setTab("mobile")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200"
            style={
              tab === "mobile"
                ? { backgroundColor: "#FFFFFF", color: "#2B2B2B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "#7A6E67" }
            }
          >
            <Smartphone size={14} />
            Mobile Number
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200"
            style={
              tab === "email"
                ? { backgroundColor: "#FFFFFF", color: "#2B2B2B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "#7A6E67" }
            }
          >
            <Mail size={14} />
            Email Address
          </button>
        </div>

        {/* ── Sign-in Form ──────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Mobile / Email input */}
          {tab === "mobile" ? (
            <div>
              <label
                className="mb-1.5 block text-[10px] font-semibold tracking-widest"
                style={{ color: "#7A6E67" }}
              >
                MOBILE NUMBER
              </label>
              <div className="flex gap-2">
                {/* Country code */}
                <div
                  className="flex items-center gap-1 rounded-xl px-3 text-sm font-medium"
                  style={{ backgroundColor: "#EDE3D9", color: "#2B2B2B", minWidth: 68 }}
                >
                  +91 <span style={{ color: "#C2A98A", fontSize: 10 }}>▼</span>
                </div>
                <input
                  {...register("phone")}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                  style={{ backgroundColor: "#EDE3D9", borderColor: "#E5DCD3", color: "#2B2B2B" }}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                  • {errors.phone.message}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label
                className="mb-1.5 block text-[10px] font-semibold tracking-widest"
                style={{ color: "#7A6E67" }}
              >
                EMAIL ADDRESS
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="your@email.com"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                style={{ backgroundColor: "#EDE3D9", borderColor: "#E5DCD3", color: "#2B2B2B" }}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                  • {errors.email.message}
                </p>
              )}
            </div>
          )}

          {/* Password */}
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold tracking-widest"
              style={{ color: "#7A6E67" }}
            >
              PASSWORD
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                style={{
                  backgroundColor: "#EDE3D9",
                  borderColor: errors.password ? "#D97757" : "#E5DCD3",
                  color: "#2B2B2B",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#7A6E67" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                • {errors.password.message}
              </p>
            )}
            {/* Simulate incorrect password error — shown when API returns error */}
            {loginMutation.isError && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                • Incorrect password. Please try again or reset it.
              </p>
            )}
          </div>

          {/* Keep signed in + Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "#7A6E67" }}>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-3.5 w-3.5 rounded border accent-[#C2A98A]"
                style={{ borderColor: "#C2A98A" }}
              />
              Keep me signed in
            </label>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-sm transition-opacity hover:opacity-60"
              style={{ color: "#7A6E67" }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.15em] text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#C2A98A" }}
          >
            {loginMutation.isPending ? "SIGNING IN…" : "SIGN IN TO TRENDIO"}
          </button>
        </form>

        {/* ── OTP Section ───────────────────────────────────── */}
        <div className="mt-5">
          {/* Divider */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 border-t" style={{ borderColor: "#E5DCD3" }} />
            <span className="text-xs" style={{ color: "#7A6E67" }}>
              or login with OTP
            </span>
            <div className="flex-1 border-t" style={{ borderColor: "#E5DCD3" }} />
          </div>

          {/* Send OTP card */}
          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-200 hover:border-[#C2A98A]"
              style={{ borderColor: "#E5DCD3", backgroundColor: "#FFFFFF", color: "#2B2B2B" }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#EDE3D9" }}
              >
                <Smartphone size={15} style={{ color: "#C2A98A" }} />
              </div>
              <span>
                Send OTP to{" "}
                <span style={{ color: "#2B2B2B", fontWeight: 600 }}>
                  +91 {watchPhone || "XXXXXXXXXX"}
                </span>
              </span>
            </button>
          ) : (
            /* OTP entry card */
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "#E5DCD3", backgroundColor: "#FFFFFF" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p
                    className="text-[10px] font-semibold tracking-widest"
                    style={{ color: "#7A6E67" }}
                  >
                    ENTER ONE-TIME PASSCODE
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "#7A6E67" }}>
                    Code sent to{" "}
                    <span className="font-semibold" style={{ color: "#C2A98A" }}>
                      +91 {watchPhone}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs underline"
                  style={{ color: "#C2A98A" }}
                >
                  Change number
                </button>
              </div>

              <OtpInput value={otp} onChange={setOtp} />

              {otpError && (
                <p className="mt-2 text-xs" style={{ color: "#D97757" }}>
                  {otpError}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "#7A6E67" }}>
                <span>
                  Expires in{" "}
                  <span style={{ color: "#D97757" }}>{timer.display}</span>
                </span>
                {timer.isExpired ? (
                  <button
                    type="button"
                    onClick={() => { timer.restart(); setOtp(""); }}
                    className="font-medium"
                    style={{ color: "#C2A98A" }}
                  >
                    Resend
                  </button>
                ) : (
                  <span>
                    Didn't get it?{" "}
                    <button
                      type="button"
                      onClick={() => { timer.restart(); setOtp(""); }}
                      className="font-medium"
                      style={{ color: "#C2A98A" }}
                    >
                      Resend
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                className="mt-4 w-full rounded-xl py-3 text-xs font-bold tracking-[0.15em] text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#2B2B2B" }}
              >
                VERIFY &amp; SIGN IN
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div
          className="mt-7 flex items-center justify-between border-t pt-5 text-xs"
          style={{ borderColor: "#E5DCD3", color: "#7A6E67" }}
        >
          <span>
            New to Trendio?{" "}
            <Link
              to={ROUTES.REGISTER}
              className="font-medium transition-opacity hover:opacity-60"
              style={{ color: "#C2A98A" }}
            >
              Create an account →
            </Link>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} style={{ color: "#7A6E67" }} />
            256-BIT SECURE
          </span>
        </div>
      </div>
    </div>
  );
}