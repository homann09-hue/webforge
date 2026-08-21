import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { getNeonSql } from "@/lib/neon-db";

function contentDisposition(fileName: string | null): string {
  const name = (fileName || "download").replace(/[\r\n"]/g, "_");
  return `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "Ungültige Datei." }, { status: 400 });
    }

    const sql = getNeonSql();
    const rows = await sql`
      select file_path, file_name
      from public.portal_submissions
      where id = ${id}
        and kind = 'file'
      limit 1
    `;

    const submission = rows[0] as { file_path?: string | null; file_name?: string | null } | undefined;
    if (!submission?.file_path) {
      return new NextResponse("Datei nicht gefunden.", { status: 404 });
    }

    const result = await get(submission.file_path, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return new NextResponse("Datei nicht gefunden.", { status: 404 });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Content-Disposition": contentDisposition(submission.file_name || null),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });
    }

    console.error("WEBFORGE_ADMIN_BLOB_DOWNLOAD_ERROR", error);
    return NextResponse.json({ ok: false, error: "Datei konnte nicht geladen werden." }, { status: 500 });
  }
}
