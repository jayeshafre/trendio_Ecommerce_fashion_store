/**
 * ForgotPasswordPage — Trendio
 *
 * Step 1 of 3 — matches image 5 exactly:
 * • Lock icon in beige circle
 * • "STEP 1 OF 3" label
 * • "Forgot your password?" serif heading
 * • Description text with "Trendio" highlighted
 * • "REGISTERED EMAIL" input label
 * • Email input (pre-filled if passed via state)
 * • Helper text about 6-digit code
 * • "SEND RECOVERY CODE" warm-sand button
 * • "TRY A DIFFERENT EMAIL" outline button
 * • Divider + help text with links
 *
 * On success → navigate to /auth/reset-password with email in state
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { ROUTES } from "@constants";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // TODO: await authApi.forgotPassword({ email: data.email })
      await new Promise((r) => setTimeout(r, 800)); // simulate API
      navigate("/auth/reset-password", { state: { email: data.email } });
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
            <Lock size={26} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
          </div>
        </div>

        {/* ── Step label ───────────────────────────────────── */}
        <p
          className="mb-3 text-center text-[10px] font-semibold tracking-[0.2em]"
          style={{ color: "#7A6E67" }}
        >
          STEP 1 OF 3
        </p>

        {/* ── Heading ──────────────────────────────────────── */}
        <h1
          className="mb-3 text-center text-[2rem] font-bold leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
        >
          Forgot your password?
        </h1>

        {/* ── Description ──────────────────────────────────── */}
        <p className="mb-8 text-center text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
          No need to worry. Enter the email address linked to your{" "}
          <span style={{ color: "#C2A98A", fontStyle: "italic" }}>Trendio</span>{" "}
          account and we'll send a recovery code.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Email field */}
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold tracking-widest"
              style={{ color: "#7A6E67" }}
            >
              REGISTERED EMAIL
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="amara.jones@email.com"
              autoFocus
              className="w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition-all focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
              style={{
                backgroundColor: "#EDE3D9",
                borderColor: errors.email ? "#D97757" : "#E5DCD3",
                color: "#2B2B2B",
              }}
            />
            {errors.email ? (
              <p className="mt-1 text-xs" style={{ color: "#D97757" }}>
                • {errors.email.message}
              </p>
            ) : (
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#7A6E67" }}>
                We'll send a 6-digit code to this address. Check your spam folder if it
                doesn't arrive within 2 minutes.
              </p>
            )}
          </div>

          {/* Send Recovery Code button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.18em] text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#C2A98A" }}
          >
            {loading ? "SENDING CODE…" : "SEND RECOVERY CODE"}
          </button>

          {/* Try different email */}
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-xl border py-3.5 text-xs font-bold tracking-[0.18em] transition-all duration-200 hover:border-[#C2A98A] hover:text-[#C2A98A]"
            style={{ borderColor: "#E5DCD3", color: "#7A6E67" }}
          >
            TRY A DIFFERENT EMAIL
          </button>
        </form>

        {/* ── Footer help ──────────────────────────────────── */}
        <div className="mt-8">
          <div className="mb-4 border-t" style={{ borderColor: "#E5DCD3" }} />
          <p className="text-center text-xs leading-relaxed" style={{ color: "#7A6E67" }}>
            Need help?{" "}
            <Link to="/support" className="underline" style={{ color: "#C2A98A" }}>
              Contact our support team
            </Link>
            <br />
            or visit our{" "}
            <Link to="/help" className="underline" style={{ color: "#C2A98A" }}>
              Help Centre
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}