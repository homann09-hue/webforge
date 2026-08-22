"use client";

import { FormEvent, useState } from "react";

export default function LeadForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        setMsg("Danke. Ihre Anfrage ist angekommen.");
        form.reset();
      } else {
        setState("error");
        setMsg(data.error || "Das hat nicht geklappt. Bitte versuchen Sie es noch einmal.");
      }
    } catch {
      setState("error");
      setMsg("Die Verbindung hat nicht geklappt. Bitte versuchen Sie es noch einmal.");
    }
  }

  return (
    <form onSubmit={submit}>
      <label>
        Name Ihres Unternehmens
        <input name="company" required minLength={2} maxLength={120} placeholder="z. B. Mustermann GmbH" />
      </label>
      <label>
        Haben Sie schon eine Website oder einen Google-Eintrag?
        <input name="website" maxLength={300} placeholder="Link einfügen – falls vorhanden" />
      </label>
      <label>
        Ihre E-Mail-Adresse
        <input name="email" required type="email" maxLength={254} placeholder="name@unternehmen.de" />
      </label>

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
        {state === "loading" ? "Wird gesendet…" : "Kostenlose Ersteinschätzung anfragen →"}
      </button>
      <small>{msg || "Unverbindlich. Sie gehen damit keinen Vertrag ein."}</small>
    </form>
  );
}
