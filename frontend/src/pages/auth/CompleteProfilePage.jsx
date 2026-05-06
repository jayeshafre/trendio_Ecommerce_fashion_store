import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSendOtp, useVerifyOtp } from "@hooks/useAuth";
import { useAuthStore } from "@store";
import { authApi } from "@api";

export default function CompleteProfilePage() {
  const navigate   = useNavigate();
  const user       = useAuthStore((s) => s.user);
  const setUser    = useAuthStore((s) => s.setUser);
  const sendOtp    = useSendOtp();
  const verifyOtp  = useVerifyOtp();

  const [step, setStep]   = useState("phone");   // "phone" | "otp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp]     = useState("");

  // ── Step 1: Submit phone ──────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    const clean = phone.trim().replace(/\s/g, "");
    if (!/^\d{10}$/.test(clean)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    sendOtp.mutate(
      { identifier: clean, purpose: "phone_verify" },
      {
        onSuccess: () => {
          toast.success(`OTP sent to +91 ${clean}`);
          setStep("otp");
        },
        onError: () => toast.error("Failed to send OTP. Try again."),
      }
    );
  }

  // ── Step 2: Verify OTP + save phone ──────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const clean = phone.trim().replace(/\s/g, "");

    verifyOtp.mutate(
      { identifier: clean, code: otp.trim(), purpose: "phone_verify" },
      {
        onSuccess: async () => {
          // Save phone to profile
          try {
            const { data } = await authApi.updateMe({ phone: clean });
            setUser(data);
            toast.success("Mobile number verified!");
            navigate("/");
          } catch {
            toast.error("Could not save phone. Please update it in your profile.");
            navigate("/");
          }
        },
        onError: (err) => toast.error(err?.response?.data?.detail || "Invalid OTP."),
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            One last step
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hi {user?.first_name}, please verify your mobile number to continue.
          </p>
        </div>

        {/* Step 1 — Phone */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-400">
                <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit number"
                  className="flex-1 px-3 py-2.5 text-sm outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={sendOtp.isPending}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {sendOtp.isPending ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Enter the 6-digit OTP sent to{" "}
              <span className="font-medium text-gray-700">+91 {phone}</span>
            </p>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter OTP"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-center tracking-widest outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
            <button
              type="submit"
              disabled={verifyOtp.isPending}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {verifyOtp.isPending ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
            >
              ← Change number
            </button>
          </form>
        )}

        {/* Skip option */}
        <p className="text-center text-xs text-gray-400 mt-6">
          <button
            onClick={() => navigate("/")}
            className="hover:underline hover:text-gray-600"
          >
            Skip for now →
          </button>
        </p>

      </div>
    </div>
  );
}