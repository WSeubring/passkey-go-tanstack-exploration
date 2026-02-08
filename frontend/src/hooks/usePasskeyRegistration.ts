import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { API_BASE_URL } from "@/config";

export type AuthStatus = "idle" | "loading" | "success" | "error";

export function usePasskeyRegistration() {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");

  const register = async (username: string) => {
    setStatus("loading");
    setMessage("");

    try {
      const resp = await fetch(
        `${API_BASE_URL}/api/auth/register/begin?username=${encodeURIComponent(username)}`,
        { method: "POST" },
      );
      if (!resp.ok) throw new Error("Failed to start registration");

      const options = await resp.json();
      const optionsJSON = options.publicKey ? options.publicKey : options;

      const attResp = await startRegistration({ optionsJSON });

      const verificationResp = await fetch(
        `${API_BASE_URL}/api/auth/register/finish?username=${encodeURIComponent(username)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attResp),
        },
      );

      if (verificationResp.ok) {
        setStatus("success");
        setMessage("Registration successful! You can now log in.");
      } else {
        const errData = await verificationResp.json();
        throw new Error(errData.error || "Registration failed");
      }
    } catch (err: unknown) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "An error occurred",
      );
    }
  };

  return { status, message, register };
}
