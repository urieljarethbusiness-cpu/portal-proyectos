import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".log": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ts": "text/plain; charset=utf-8",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
};

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".log",
  ".xml",
  ".js",
  ".ts",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; filename: string }> }
) {
  const { projectId, filename } = await params;
  const filePath = path.join(process.cwd(), "storage", "projects", projectId, filename);
  const isPreview = request.nextUrl.searchParams.get("preview") === "1";
  const textMode = request.nextUrl.searchParams.get("text") === "1";

  try {
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const dispositionType = isPreview ? "inline" : "attachment";

    if (textMode && TEXT_EXTENSIONS.has(ext)) {
      const content = await fs.readFile(filePath, "utf-8");
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `${dispositionType}; filename="${filename}"`,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${dispositionType}; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
