import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import App from "./App";
import "./index.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const authSupabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function PasswordResetOverlay() {
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authSupabase) return;

    const hashParams = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash
    );
    const queryParams = new URLSearchParams(window.location.search);

    if (
      hashParams.get("type") === "recovery" ||
      queryParams.get("type") === "recovery"
    ) {
      setRecoveryMode(true);
    }

    const { data } = authSupabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!authSupabase) {
      setError("Supabase ist nicht verbunden.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setError("Die beiden Passwörter stimmen nicht überein.");
      return;
    }

    setBusy(true);
    const { error: updateError } = await authSupabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    setSuccess("Passwort geändert. Du kannst dich jetzt neu anmelden.");
    await authSupabase.auth.signOut();
    setBusy(false);

    window.setTimeout(() => {
      window.location.replace(window.location.origin + "/");
    }, 1400);
  }

  if (!recoveryMode) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-[#f7edda] px-5 py-10 text-stone-900">
      <form
        onSubmit={savePassword}
        className="w-full max-w-md rounded-[2rem] border-2 border-stone-300 bg-[#fff8e9] p-6 shadow-lg"
      >
        <h2 className="text-2xl font-black">Neues Passwort festlegen</h2>
        <p className="mt-2 text-sm text-stone-600">
          Wähle ein neues Passwort mit mindestens 8 Zeichen.
        </p>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-semibold">
            Neues Passwort
          </span>
          <div className="flex items-center rounded-2xl border-2 border-stone-300 bg-white pr-2">
            <input
              type={showNewPassword ? "text" : "password"}
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="min-w-0 flex-1 rounded-2xl bg-transparent p-3 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              aria-label={
                showNewPassword ? "Passwort verbergen" : "Passwort anzeigen"
              }
              className="rounded-xl px-3 py-2 text-xl"
            >
              {showNewPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold">
            Passwort wiederholen
          </span>
          <div className="flex items-center rounded-2xl border-2 border-stone-300 bg-white pr-2">
            <input
              type={showRepeatPassword ? "text" : "password"}
              minLength={8}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              autoComplete="new-password"
              className="min-w-0 flex-1 rounded-2xl bg-transparent p-3 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword((value) => !value)}
              aria-label={
                showRepeatPassword ? "Passwort verbergen" : "Passwort anzeigen"
              }
              className="rounded-xl px-3 py-2 text-xl"
            >
              {showRepeatPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </label>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-2xl bg-stone-900 px-4 py-4 font-bold text-white disabled:opacity-60"
        >
          {busy ? "Bitte warten…" : "Passwort speichern"}
        </button>
      </form>
    </div>
  );
}

function LoginEnhancer() {
  useEffect(() => {
    let stopped = false;

    function enhance() {
      if (stopped) return;

      const forms = Array.from(document.querySelectorAll("form"));
      const authForm = forms.find((form) => {
        const text = form.textContent || "";
        return (
          text.includes("Einloggen") ||
          text.includes("Benutzer anlegen") ||
          text.includes("Neues Profil")
        );
      });

      if (!authForm) return;

      const passwordInput = authForm.querySelector(
        'input[type="password"], input[data-wk-password="true"]'
      ) as HTMLInputElement | null;

      if (!passwordInput) return;
      passwordInput.dataset.wkPassword = "true";

      if (!authForm.querySelector("[data-wk-password-eye]")) {
        const eye = document.createElement("button");
        eye.type = "button";
        eye.dataset.wkPasswordEye = "true";
        eye.textContent = "👁️";
        eye.setAttribute("aria-label", "Passwort anzeigen");
        eye.title = "Passwort anzeigen";

        Object.assign(eye.style, {
          marginTop: "8px",
          marginLeft: "6px",
          border: "1px solid #d6d3d1",
          borderRadius: "12px",
          background: "#ffffff",
          cursor: "pointer",
          fontSize: "18px",
          padding: "5px 10px",
        });

        eye.addEventListener("click", () => {
          const hidden = passwordInput.type === "password";
          passwordInput.type = hidden ? "text" : "password";
          eye.textContent = hidden ? "🙈" : "👁️";
          eye.setAttribute(
            "aria-label",
            hidden ? "Passwort verbergen" : "Passwort anzeigen"
          );
          eye.title = hidden ? "Passwort verbergen" : "Passwort anzeigen";
        });

        passwordInput.insertAdjacentElement("afterend", eye);
      }

      const loginMode = (authForm.textContent || "").includes("Einloggen");
      const existingReset = authForm.querySelector(
        "[data-wk-password-reset]"
      ) as HTMLButtonElement | null;
      const existingMessage = authForm.querySelector(
        "[data-wk-password-reset-message]"
      );

      if (!loginMode) {
        existingReset?.remove();
        existingMessage?.remove();
        return;
      }

      if (!existingReset) {
        const resetButton = document.createElement("button");
        resetButton.type = "button";
        resetButton.dataset.wkPasswordReset = "true";
        resetButton.textContent = "Passwort vergessen?";

        Object.assign(resetButton.style, {
          display: "block",
          marginTop: "10px",
          border: "0",
          background: "transparent",
          color: "#44403c",
          cursor: "pointer",
          fontWeight: "700",
          textDecoration: "underline",
          padding: "0",
        });

        const passwordLabel = passwordInput.closest("label");
        if (passwordLabel) {
          passwordLabel.insertAdjacentElement("afterend", resetButton);
        } else {
          passwordInput.insertAdjacentElement("afterend", resetButton);
        }

        resetButton.addEventListener("click", async () => {
          let message = authForm.querySelector(
            "[data-wk-password-reset-message]"
          ) as HTMLDivElement | null;

          if (!message) {
            message = document.createElement("div");
            message.dataset.wkPasswordResetMessage = "true";

            Object.assign(message.style, {
              marginTop: "10px",
              padding: "12px",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "600",
            });

            resetButton.insertAdjacentElement("afterend", message);
          }

          const emailInput = authForm.querySelector(
            'input[type="email"]'
          ) as HTMLInputElement | null;

          const email = emailInput?.value.trim() || "";

          if (!email) {
            message.textContent =
              "Bitte zuerst deine E-Mail-Adresse eingeben.";
            message.style.background = "#fef2f2";
            message.style.color = "#b91c1c";
            return;
          }

          if (!authSupabase) {
            message.textContent = "Supabase ist nicht verbunden.";
            message.style.background = "#fef2f2";
            message.style.color = "#b91c1c";
            return;
          }

          resetButton.disabled = true;
          resetButton.textContent = "Reset-Link wird gesendet…";

          const { error } =
            await authSupabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/`,
            });

          resetButton.disabled = false;
          resetButton.textContent = "Passwort vergessen?";

          if (error) {
            message.textContent = error.message;
            message.style.background = "#fef2f2";
            message.style.color = "#b91c1c";
          } else {
            message.textContent =
              "Reset-Link wurde gesendet. Bitte prüfe dein E-Mail-Postfach.";
            message.style.background = "#f0fdf4";
            message.style.color = "#166534";
          }
        });
      }
    }

    enhance();

    const observer = new MutationObserver(() => enhance());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      stopped = true;
      observer.disconnect();
    };
  }, []);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <LoginEnhancer />
    <PasswordResetOverlay />
  </React.StrictMode>
);
