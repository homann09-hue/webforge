"use client";
import { FormEvent, useState } from "react";
export default function LeadForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ company: f.get("company"), website: f.get("website"), email: f.get("email") }),
    });
    const j = await r.json();
    if (r.ok) {
      setState("done");
      setMsg("Danke. Die Anfrage ist angekommen.");
      e.currentTarget.reset();
    } else {
      setState("error");
      setMsg(j.error || "Bitte erneut versuchen.");
    }
  }
  return (
    <form onSubmit={submit}>
      <label>
        Unternehmen
        <input name="company" required minLength={2} placeholder="z. B. Mustermann GmbH" />
      </label>
      <label>
        Website oder Google-Eintrag
        <input name="website" placeholder="Link (falls vorhanden)" />
      </label>
      <label>
        E-Mail
        <input name="email" required type="email" placeholder="name@unternehmen.de" />
      </label>
      <button className="button" disabled={state === "loading"} type="submit">
        {state === "loading" ? "Wird gesendet…" : "Kostenlosen Entwurf anfragen →"}
      </button>
      <small>{msg || "Unverbindlich. Keine automatische Bestellung."}</small>
    </form>
  );
}
