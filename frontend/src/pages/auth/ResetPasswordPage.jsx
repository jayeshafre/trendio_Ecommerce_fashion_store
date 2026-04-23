/**
 * ResetPasswordPage — Trendio (FIXED)
 *
 * Was using fake setTimeout. Now calls:
 *   POST /api/v1/auth/password/reset/
 *   body: { email, otp, password, password2 }
 *
 * Receives email via location.state.email (set by ForgotPasswordPage).
 * Route: /auth/reset-password  (no URL params — OTP-based)
 */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlignJustify, Eye, EyeOff } from "lucide-react";
import OtpInput from "@components/ui/OtpInput";
import { useOtpTimer } from "@hooks/useOtpTimer";
import { useResetPassword, useSendOtp } from "@hooks/useAuth";
import { ROUTES } from "@constants";
import toast from "react-hot-toast";

const schema = z
  .object({
    password: z.string().min(8, "Minimum 8 characters"),
    confirm:  z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // email was passed via navigate("/auth/reset-password", { state: { email } })
  const email    = location.state?.email || "";

  const [otp, setOtp]           = useState("");
  const [otpError, setOtpError] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);

  const timer            = useOtpTimer(262); // 04:22
  const resetMutation    = useResetPassword();
  const sendOtpMutation  = useSendOtp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  // If user landed here without email, redirect back
  if (!email) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <p className="text-sm" style={{ color: "#7A6E67" }}>
          Session expired. Please start again.
        </p>
        <Link
          to={ROUTES.FORGOT_PASSWORD}
          className="text-sm font-medium"
          style={{ color: "#C2A98A" }}
        >
          ← Back to Forgot Password
        </Link>
      </div>
    );
  }

  const handleResend = () => {
    sendOtpMutation.mutate(
      { identifier: email, purpose: "password_reset" },
      {
        onSuccess: () => {
          setOtp("");
          setOtpError("");
          timer.restart();
          toast.success("New recovery code sent!");
        },
        onError: (err) => {
          toast.error(err?.response?.data?.detail || "Failed to resend code.");
        },
      }
    );
  };

  const onSubmit = (data) => {
    if (otp.length < 6) {
      setOtpError("Enter the complete 6-digit code.");
      return;
    }
    setOtpError("");
    // POST /api/v1/auth/password/reset/
    resetMutation.mutate({
      email,
      otp,
      password:  data.password,
      password2: data.confirm,
    });
    // On success: hook shows toast + navigates to login
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border bg-white p-8 shadow-lg" style={{ borderColor: "#E5DCD3" }}>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "#EDE3D9" }}
          >
            <AlignJustify size={24} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
          </div>
        </div>

        {/* Step label */}
        <p
          className="mb-3 text-center text-[10px] font-semibold tracking-[0.2em]"
          style={{ color: "#7A6E67" }}
        >
          STEPS 2 &amp; 3
        </p>

        {/* Heading */}
        <h1
          className="mb-3 text-center text-[2rem] font-bold italic leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
        >
          Verify &amp; reset.
        </h1>

        {/* Description */}
        <p
          className="mb-8 text-center text-sm leading-relaxed"
          style={{ color: "#7A6E67" }}
        >
          Enter the 6-digit code sent to{" "}
          <strong style={{ color: "#2B2B2B" }}>{email}</strong> then set your
          new password below.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* OTP */}
          <div>
            <label
              className="mb-2 block text-[10px] font-semibold tracking-widest"
              style={{ color: "#7A6E67" }}
            >
              ONE-TIME PASSCODE
            </label>
            <OtpInput value={otp} onChange={setOtp} />
            {otpError && (
              <p className="mt-1.5 text-xs" style={{ color: "#D97757" }}>
                • {otpError}
              </p>
            )}
            <div
              className="mt-2.5 flex items-center justify-between text-xs"
              style={{ color: "#7A6E67" }}
            >
              <span>
                Code expires in{" "}
                <span style={{ color: "#D97757" }}>{timer.display}</span>
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={sendOtpMutation.isPending}
                className="font-medium disabled:opacity-50"
                style={{ color: "#C2A98A" }}
              >
                {sendOtpMutation.isPending ? "Sending…" : "Resend code"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold tracking-widest"
              style={{ color: "#7A6E67" }}
            >
              NEW PASSWORD
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border px-4 py-3.5 pr-11 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                style={{
                  backgroundColor: "#EDE3D9",
                  borderColor: errors.password ? "#D97757" : "#E5DCD3",
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
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                • {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold tracking-widest"
              style={{ color: "#7A6E67" }}
            >
              CONFIRM NEW PASSWORD
            </label>
            <div className="relative">
              <input
                {...register("confirm")}
                type={showCf ? "text" : "password"}
                placeholder="Repeat your password"
                className="w-full rounded-xl border px-4 py-3.5 pr-11 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
                style={{
                  backgroundColor: "#EDE3D9",
                  borderColor: errors.confirm ? "#D97757" : "#E5DCD3",
                  color: "#2B2B2B",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCf(!showCf)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#7A6E67" }}
              >
                {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirm && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                • {errors.confirm.message}
              </p>
            )}
          </div>

          {/* Reset button */}
          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.18em] text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#C2A98A" }}
          >
            {resetMutation.isPending ? "RESETTING…" : "RESET MY PASSWORD"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6">
          <div className="mb-4 border-t" style={{ borderColor: "#E5DCD3" }} />
          <p className="text-center text-xs" style={{ color: "#7A6E67" }}>
            Remembered it?{" "}
            <Link
              to={ROUTES.LOGIN}
              className="font-medium"
              style={{ color: "#C2A98A" }}
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}