"use client";

import { FormEvent, useState } from "react";

export default function LeadForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Capture the form before awaiting: React clears currentTarget once the
    // handler returns, so reading it after the await threw a TypeError and the
    // form was never reset.
    const form = event.currentTarget;
    const fields = new FormData(form);

    setState("loading");
    setMsg("");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          company: fields.get("company"),
          website: fields.get("website"),
          email: fields.get("email"),
          website_url: fields.get("website_url"),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setState("done");
        setMsg("Danke. Die Anfrage ist angekommen.");
        form.reset();
      } else {
        setState("error");
        setMsg(data.error || "Bitte erneut versuchen.");
      }
    } catch {
      setState("error");
      setMsg("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    }
  }

  return (
    <form onSubmit={submit}>
      <label>
        Unternehmen
        <input name="company" required minLength={2} maxLength={120} placeholder="z. B. Mustermann GmbH" />
      </label>
      <label>
        Website oder Google-Eintrag
        <input name="website" maxLength={300} placeholder="Link (falls vorhanden)" />
      </label>
      <label>
        E-Mail
        <input name="email" required type="email" maxLength={254} placeholder="name@unternehmen.de" />
      </label>

      {/*
        Honeypot: hidden from people, irresistible to form-filling bots.
        aria-hidden and tabIndex keep it away from screen readers and keyboard
        users, so it costs real visitors nothing.
      */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
      >
        <label>
          Bitte dieses Feld leer lassen
          <input name="website_url" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button className="button" disabled={state === "loading"} type="submit">
        {state === "loading" ? "Wird gesendet…" : "Kostenlosen Entwurf anfragen →"}
      </button>
      <small>{msg || "Unverbindlich. Keine automatische Bestellung."}</small>
    </form>
  );
}
