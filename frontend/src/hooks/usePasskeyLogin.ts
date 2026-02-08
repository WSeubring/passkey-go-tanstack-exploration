import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { API_BASE_URL } from "@/config";

export type AuthStatus = "idle" | "loading" | "success" | "error";

export function usePasskeyLogin() {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");

  const loginWithPasskey = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/login/begin`, {
        method: "POST",
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Failed to start login");
      }
      const options = await resp.json();
      const optionsJSON = options.publicKey ? options.publicKey : options;

      const authResp = await startAuthentication({ optionsJSON });

      const verifyResp = await fetch(
        `${API_BASE_URL}/api/auth/login/finish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authResp),
        },
      );

      const text = await verifyResp.text();
      let data: Record<string, string>;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server returned invalid response: " + text.substring(0, 100),
        );
      }

      if (verifyResp.ok) {
        setStatus("success");
        setMessage(data.message || "Passkey login successful!");
      } else {
        throw new Error(data.error || "Passkey verification failed");
      }
    } catch (err: unknown) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Passkey login failed",
      );
    }
  };

  return { status, message, loginWithPasskey };
}
