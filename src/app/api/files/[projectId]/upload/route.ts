import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file found in formData" }, { status: 400 });
    }

    const filename = file.name;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const projectDir = path.join(process.cwd(), "storage", "projects", projectId);
    const filePath = path.join(projectDir, filename);

    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    const attachment = await prisma.attachment.create({
      data: {
        filename,
        filepath: `/storage/projects/${projectId}/${filename}`,
        projectId,
      },
    });

    revalidatePath(`/proyectos/${projectId}`);
    revalidatePath("/archivos");

    return NextResponse.json({ ok: true, attachmentId: attachment.id });
  } catch (error) {
    console.error("[api-upload] Upload failed", { projectId, error });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
