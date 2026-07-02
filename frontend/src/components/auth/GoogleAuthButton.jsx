import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@hooks/useAuth";
import toast from "react-hot-toast";

export default function GoogleAuthButton({ label = "continue_with" }) {
  const googleAuth = useGoogleAuth();
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  // GoogleLogin's `width` prop only accepts a fixed pixel number, not "100%".
  // Measure the actual parent width so the button matches every other
  // input/button in the form instead of overflowing/under-filling it.
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      const width = containerRef.current?.offsetWidth;
      if (width) setButtonWidth(Math.floor(width));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          // credentialResponse.credential is the id_token — exactly what backend expects
          googleAuth.mutate(credentialResponse.credential);
        }}
        onError={() => {
          toast.error("Google sign-in failed. Please try again.");
        }}
        width={buttonWidth}
        text={label}
        shape="rectangular"
        theme="outline"
        logo_alignment="left"
      />
    </div>
  );
}