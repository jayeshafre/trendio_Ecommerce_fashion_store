/**
 * ResetPasswordPage — Trendio
 *
 * Steps 2 & 3 combined — matches image 6 exactly:
 * • Menu icon in beige circle
 * • "STEPS 2 & 3"
 * • "Verify & reset." serif italic heading
 * • Description with bold email
 * • 6-box OTP entry + timer + Resend
 * • NEW PASSWORD field
 * • CONFIRM NEW PASSWORD field
 * • "RESET MY PASSWORD" warm-sand button
 * • "Remembered it? Back to Sign In"
 *
 * Receives email via location.state from ForgotPasswordPage.
 */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlignJustify, Eye, EyeOff } from "lucide-react";
import OtpInput from "@components/ui/OtpInput";
import { useOtpTimer } from "@hooks/useOtpTimer";
import { ROUTES } from "@constants";
import toast from "react-hot-toast";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Minimum 8 characters"),
    confirm:  z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export default function ResetPasswordPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "your email";

  const [otp, setOtp]             = useState("");
  const [otpError, setOtpError]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const timer                      = useOtpTimer(262); // 04:22

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    if (otp.length < 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }
    setOtpError("");
    setLoading(true);
    try {
      // TODO: await authApi.resetPassword({ email, otp, password: data.password })
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Password reset successfully! Please sign in.");
      navigate(ROUTES.LOGIN);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#F8F5F2" }}
    >
      <div className="w-full max-w-[420px]">

        {/* ── Icon ─────────────────────────────────────────── */}
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "#EDE3D9" }}
          >
            <AlignJustify size={24} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
          </div>
        </div>

        {/* ── Step label ───────────────────────────────────── */}
        <p
          className="mb-3 text-center text-[10px] font-semibold tracking-[0.2em]"
          style={{ color: "#7A6E67" }}
        >
          STEPS 2 &amp; 3
        </p>

        {/* ── Heading ──────────────────────────────────────── */}
        <h1
          className="mb-3 text-center text-[2rem] font-bold leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B", fontStyle: "italic" }}
        >
          Verify &amp; reset.
        </h1>

        {/* ── Description ──────────────────────────────────── */}
        <p className="mb-8 text-center text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
          Enter the 6-digit code sent to{" "}
          <span className="font-semibold" style={{ color: "#2B2B2B" }}>
            {email}
          </span>{" "}
          then set your new password below.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── OTP ──────────────────────────────────────────── */}
          <div>
            <label
              className="mb-2 block text-[10px] font-semibold tracking-widest"
              style={{ color: "#7A6E67" }}
            >
              ONE-TIME PASSCODE
            </label>
            <OtpInput value={otp} onChange={setOtp} />
            {otpError && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>{otpError}</p>
            )}
            <div className="mt-2.5 flex items-center justify-between text-xs" style={{ color: "#7A6E67" }}>
              <span>
                Code expires in{" "}
                <span style={{ color: timer.isExpired ? "#D97757" : "#7A6E67" }}>
                  {timer.display}
                </span>
              </span>
              <button
                type="button"
                onClick={() => { timer.restart(); setOtp(""); }}
                className="font-medium transition-opacity hover:opacity-60"
                style={{ color: "#C2A98A" }}
              >
                Resend code
              </button>
            </div>
          </div>

          {/* ── New Password ─────────────────────────────────── */}
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

          {/* ── Confirm New Password ──────────────────────────── */}
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
                type={showConfirm ? "text" : "password"}
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
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#7A6E67" }}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirm && (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                • {errors.confirm.message}
              </p>
            )}
          </div>

          {/* ── Reset button ──────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.18em] text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#C2A98A" }}
          >
            {loading ? "RESETTING…" : "RESET MY PASSWORD"}
          </button>
        </form>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="mt-6">
          <div className="mb-4 border-t" style={{ borderColor: "#E5DCD3" }} />
          <p className="text-center text-xs" style={{ color: "#7A6E67" }}>
            Remembered it?{" "}
            <Link
              to={ROUTES.LOGIN}
              className="font-medium transition-opacity hover:opacity-60"
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