import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

// Minimal ZIP builder using Node's built-in buffer operations (no external deps)
async function createZipBuffer(files: { name: string; path: string }[]): Promise<Buffer> {
  const entries: { name: string; data: Buffer; offset: number }[] = [];
  const buffers: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const data = await fs.readFile(file.path).catch(() => null);
    if (!data) continue;

    const nameBytes = Buffer.from(file.name, "utf8");
    const localHeader = Buffer.alloc(30 + nameBytes.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8); // STORE (no compression)
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    const crc = crc32(data);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBytes.copy(localHeader, 30);

    entries.push({ name: file.name, data, offset });
    offset += localHeader.length + data.length;
    buffers.push(localHeader, data);
  }

  // Central directory
  const centralBuffers: Buffer[] = [];
  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, "utf8");
    const centralEntry = Buffer.alloc(46 + nameBytes.length);
    centralEntry.writeUInt32LE(0x02014b50, 0);
    centralEntry.writeUInt16LE(20, 4);
    centralEntry.writeUInt16LE(20, 6);
    centralEntry.writeUInt16LE(0, 8);
    centralEntry.writeUInt16LE(0, 10);
    centralEntry.writeUInt16LE(0, 12);
    centralEntry.writeUInt16LE(0, 14);
    centralEntry.writeUInt32LE(crc32(entry.data), 16);
    centralEntry.writeUInt32LE(entry.data.length, 20);
    centralEntry.writeUInt32LE(entry.data.length, 24);
    centralEntry.writeUInt16LE(nameBytes.length, 28);
    centralEntry.writeUInt16LE(0, 30);
    centralEntry.writeUInt16LE(0, 32);
    centralEntry.writeUInt16LE(0, 34);
    centralEntry.writeUInt16LE(0, 36);
    centralEntry.writeUInt32LE(0, 38);
    centralEntry.writeUInt32LE(entry.offset, 42);
    nameBytes.copy(centralEntry, 46);
    centralBuffers.push(centralEntry);
  }

  const centralDir = Buffer.concat(centralBuffers);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...buffers, centralDir, eocd]);
}

// CRC32 table
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const projectFolderPath = path.join(process.cwd(), "storage", "projects", projectId);

  // Try DB first (linked project)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { attachments: true }
  });

  let files: { name: string; path: string }[] = [];
  let zipName = `archivos_residuales.zip`;

  if (project && project.attachments.length > 0) {
    // Normal DB-linked project
    files = project.attachments.map(att => ({
      name: att.filename,
      path: path.join(projectFolderPath, att.filename)
    }));
    zipName = `${project.title.replace(/[^a-z0-9]/gi, "_")}_archivos.zip`;
  } else {
    // Orphan/residual folder — read directly from disk
    const diskFiles = await fs.readdir(projectFolderPath).catch(() => [] as string[]);
    files = diskFiles.map(name => ({
      name,
      path: path.join(projectFolderPath, name)
    }));
  }

  if (files.length === 0) {
    return new NextResponse("No files found", { status: 404 });
  }

  const zipBuffer = await createZipBuffer(files);

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Content-Length": zipBuffer.length.toString()
    }
  });
}
