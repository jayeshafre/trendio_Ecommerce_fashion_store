import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@hooks/useAuth";
import toast from "react-hot-toast";

export default function GoogleAuthButton({ label = "continue_with" }) {
  const googleAuth = useGoogleAuth();

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        // credentialResponse.credential is the id_token — exactly what backend expects
        googleAuth.mutate(credentialResponse.credential);
      }}
      onError={() => {
        toast.error("Google sign-in failed. Please try again.");
      }}
      width="368"
      text={label}
      shape="rectangular"
      theme="outline"
      logo_alignment="left"
    />
  );
}