import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getNeonSql } from "@/lib/neon-db";

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
  "text/plain": ["txt"],
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = String(form.get("token") || "");
    const label = String(form.get("label") || "Datei").trim();
    const file = form.get("file");
    if (!token || token.length < 40 || token.length > 128 || !label || label.length > 120 || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Datei muss zwischen 1 Byte und 10 MB groß sein." },
        { status: 400 },
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "upload";
    const ext = safeName.includes(".") ? safeName.split(".").pop()!.toLowerCase() : "";
    const allowedExts = ALLOWED_TYPES[file.type];
    if (!allowedExts || !allowedExts.includes(ext)) {
      return NextResponse.json({ ok: false, error: "Dateityp nicht erlaubt." }, { status: 400 });
    }

    const sql = getNeonSql();
    const projectRows = await sql`select public.portal_get_project(${token}) as project`;
    const firstProjectRow =
      Array.isArray(projectRows) && projectRows.length > 0 && !Array.isArray(projectRows[0])
        ? (projectRows[0] as Record<string, unknown>)
        : undefined;
    const project = firstProjectRow?.project as { project_id?: number } | undefined;
    if (!project?.project_id)
      return NextResponse.json({ ok: false, error: "Portal-Link ungültig oder abgelaufen." }, { status: 401 });

    const pathname = `portal/${project.project_id}/${crypto.randomUUID()}-${safeName}`;
    const blob = await put(pathname, file, { access: "private", contentType: file.type });

    try {
      await sql`select public.portal_register_file(${token}, ${label}, ${blob.url}, ${file.name})`;
    } catch (error) {
      try {
        await del(blob.url);
      } catch (cleanupError) {
        console.error("WEBFORGE_PORTAL_BLOB_CLEANUP_FAILED", cleanupError);
      }
      console.error("WEBFORGE_PORTAL_BLOB_REGISTER_FAILED", error);
      throw error;
    }

    return NextResponse.json({ ok: true, fileName: file.name }, { status: 201 });
  } catch (error) {
    console.error("WEBFORGE_PORTAL_BLOB_UPLOAD_ERROR", error);
    return NextResponse.json(
      { ok: false, error: "Upload fehlgeschlagen. Erlaubt: JPG, PNG, WebP, PDF, TXT bis 10 MB." },
      { status: 400 },
    );
  }
}
