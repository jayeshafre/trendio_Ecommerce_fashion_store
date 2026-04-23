/**
 * LoginPage — Trendio
 *
 * Supports:
 *   Tab 1 → Mobile Number + Password  (sends identifier: phone)
 *   Tab 2 → Email Address + Password  (sends identifier: email)
 *   OTP section → Send OTP → verify boxes → VERIFY & SIGN IN
 */
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Smartphone, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import OtpInput from "@components/ui/OtpInput";
import { useOtpTimer } from "@hooks/useOtpTimer";
import { useLogin, useSendOtp, useVerifyOtp } from "@hooks/useAuth";
import { ROUTES } from "@constants";

// ─── Schemas ─────────────────────────────────────────────────
const phoneSchema = z.object({
  identifier: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const emailSchema = z.object({
  identifier: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [tab, setTab]               = useState("mobile");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [otpSent, setOtpSent]       = useState(false);
  const [otp, setOtp]               = useState("");
  const [otpError, setOtpError]     = useState("");
  const timer                        = useOtpTimer(202);

  const loginMutation      = useLogin();
  const sendOtpMutation    = useSendOtp();
  const verifyOtpMutation  = useVerifyOtp();

  const schema = tab === "mobile" ? phoneSchema : emailSchema;
  const { register, handleSubmit, watch, reset, formState: { errors } } =
    useForm({ resolver: zodResolver(schema) });

  const watchIdentifier = watch("identifier", "");

  // Reset OTP state when switching tabs
  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setOtpSent(false);
    setOtp("");
    setOtpError("");
    reset();
  };

  // ── Password login ────────────────────────────────────────
  // Sends { identifier: "9876543210" or "user@email.com", password }
  const onSubmit = (data) => {
    loginMutation.mutate({ identifier: data.identifier, password: data.password });
  };

  // ── OTP Send ─────────────────────────────────────────────
  const handleSendOtp = () => {
    const phone = watchIdentifier?.trim();
    if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit mobile number first.");
      return;
    }
    sendOtpMutation.mutate(
      { identifier: phone, purpose: "otp_login" },
      {
        onSuccess: () => {
          setOtpSent(true);
          setOtp("");
          setOtpError("");
          timer.restart();
          toast.success("OTP sent! Check Django terminal in dev.");
        },
        onError: (err) => {
          toast.error(err?.response?.data?.detail || "Failed to send OTP.");
        },
      }
    );
  };

  // ── OTP Verify ────────────────────────────────────────────
  const handleVerifyOtp = () => {
    if (otp.length < 6) {
      setOtpError("Enter the complete 6-digit code.");
      return;
    }
    setOtpError("");
    verifyOtpMutation.mutate(
      { identifier: watchIdentifier?.trim(), code: otp, purpose: "otp_login" },
      {
        // useVerifyOtp handles otp_login success internally (saves tokens + navigates)
        onError: (err) => {
          setOtpError(err?.response?.data?.detail || "Invalid or expired code.");
        },
      }
    );
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#FFFFFF" }}
    >
     <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-lg" style={{ borderColor: "#E5DCD3" }}>

        {/* Heading */}
        <h1
          className="mb-1 text-[2.1rem] font-bold leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
        >
          Welcome back.
        </h1>
        <p className="mb-6 text-sm" style={{ color: "#7A6E67" }}>
          Sign in to continue your{" "}
          <span style={{ color: "#C2A98A", fontStyle: "italic" }}>Trendio</span> journey.
        </p>

        {/* Tab Toggle */}
        <div
          className="mb-5 flex rounded-xl p-1"
          style={{ backgroundColor: "#EDE3D9" }}
        >
          {[
            { key: "mobile", icon: <Smartphone size={13} />, label: "Mobile Number" },
            { key: "email",  icon: <Mail size={13} />,       label: "Email Address" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabSwitch(key)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all duration-200"
              style={
                tab === key
                  ? { backgroundColor: "#FFFFFF", color: "#2B2B2B", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                  : { color: "#7A6E67" }
              }
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Identifier field */}
          {tab === "mobile" ? (
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
                MOBILE NUMBER
              </label>
              <div className="flex gap-2">
                <div
                  className="flex items-center gap-1 rounded-xl px-3 text-sm font-medium"
                  style={{ backgroundColor: "#EDE3D9", color: "#2B2B2B", minWidth: 68 }}
                >
                  +91 <span style={{ color: "#C2A98A", fontSize: 9 }}>▼</span>
                </div>
                <input
                  {...register("identifier")}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                  style={{ backgroundColor: "#EDE3D9", borderColor: errors.identifier ? "#D97757" : "#E5DCD3", color: "#2B2B2B" }}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-xs" style={{ color: "#D97757" }}>• {errors.identifier.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
                EMAIL ADDRESS
              </label>
              <input
                {...register("identifier")}
                type="email"
                placeholder="your@email.com"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                style={{ backgroundColor: "#EDE3D9", borderColor: errors.identifier ? "#D97757" : "#E5DCD3", color: "#2B2B2B" }}
              />
              {errors.identifier && (
                <p className="mt-1 text-xs" style={{ color: "#D97757" }}>• {errors.identifier.message}</p>
              )}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
              PASSWORD
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                style={{ backgroundColor: "#EDE3D9", borderColor: errors.password ? "#D97757" : "#E5DCD3", color: "#2B2B2B" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#7A6E67" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>• {errors.password.message}</p>
            )}
            {loginMutation.isError && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                • {loginMutation.error?.response?.data?.detail || "Invalid credentials. Please try again."}
              </p>
            )}
          </div>

          {/* Keep signed in + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs" style={{ color: "#7A6E67" }}>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-3.5 w-3.5 rounded border accent-[#C2A98A]"
              />
              Keep me signed in
            </label>
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs" style={{ color: "#7A6E67" }}>
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

        {/* OTP Login — only shown on mobile tab */}
        {tab === "mobile" && (
          <div className="mt-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1 border-t" style={{ borderColor: "#E5DCD3" }} />
              <span className="text-xs" style={{ color: "#7A6E67" }}>or login with OTP</span>
              <div className="flex-1 border-t" style={{ borderColor: "#E5DCD3" }} />
            </div>

            {/* Send OTP card */}
            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendOtpMutation.isPending}
                className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-200 hover:border-[#C2A98A] disabled:opacity-60"
                style={{ borderColor: "#E5DCD3", backgroundColor: "#FFFFFF", color: "#2B2B2B" }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "#EDE3D9" }}>
                  <Smartphone size={14} style={{ color: "#C2A98A" }} />
                </div>
                <span>
                  {sendOtpMutation.isPending
                    ? "Sending OTP…"
                    : `Send OTP to +91 ${watchIdentifier || "XXXXXXXXXX"}`}
                </span>
              </button>
            ) : (
              /* OTP entry card */
              <div className="rounded-xl border p-4" style={{ borderColor: "#E5DCD3", backgroundColor: "#FFFFFF" }}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
                      ENTER ONE-TIME PASSCODE
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "#7A6E67" }}>
                      Code sent to{" "}
                      <span className="font-semibold" style={{ color: "#C2A98A" }}>
                        +91 {watchIdentifier}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); setOtpError(""); }}
                    className="text-xs underline"
                    style={{ color: "#C2A98A" }}
                  >
                    Change number
                  </button>
                </div>

                <OtpInput value={otp} onChange={setOtp} />

                {otpError && (
                  <p className="mt-2 text-xs" style={{ color: "#D97757" }}>• {otpError}</p>
                )}

                <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "#7A6E67" }}>
                  <span>
                    Expires in <span style={{ color: "#D97757" }}>{timer.display}</span>
                  </span>
                  <span>
                    Didn't get it?{" "}
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="font-medium disabled:opacity-50"
                      style={{ color: "#C2A98A" }}
                    >
                      {sendOtpMutation.isPending ? "Sending…" : "Resend"}
                    </button>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyOtpMutation.isPending || otp.length < 6}
                  className="mt-4 w-full rounded-xl py-3 text-xs font-bold tracking-[0.15em] text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{ backgroundColor: "#2B2B2B" }}
                >
                  {verifyOtpMutation.isPending ? "VERIFYING…" : "VERIFY & SIGN IN"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-7 flex items-center justify-between border-t pt-5 text-xs"
          style={{ borderColor: "#E5DCD3", color: "#7A6E67" }}
        >
          <span>
            New to Trendio?{" "}
            <Link to={ROUTES.REGISTER} className="font-medium" style={{ color: "#C2A98A" }}>
              Create an account →
            </Link>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} style={{ color: "#7A6E67" }} />
            256-BIT SECURE
          </span>
        </div>
      </div>
    </div>
  );
}