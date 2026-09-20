import { useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function LoginButton() {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return;

    let cancelled = false;
    // The GIS script (loaded in index.html) may not have finished loading
    // yet on first mount — poll briefly rather than assuming it's ready.
    const tryInit = () => {
      if (cancelled) return;
      if (!window.google) {
        setTimeout(tryInit, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          loginWithGoogle(response.credential).catch(() => {
            // Silent — a failed login just leaves the button visible to retry.
          });
        },
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "medium",
          shape: "pill",
        });
      }
    };
    tryInit();

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle]);

  if (!CLIENT_ID) return null;

  return <div ref={buttonRef} />;
}
