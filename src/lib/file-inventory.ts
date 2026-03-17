"use server";

import fs from "fs/promises";
import path from "path";
import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";

export interface ResidualFile {
  filename: string;
  projectId: string;
  projectName?: string;
  reason: "orphan_folder" | "missing_db_record";
}

export async function getFilesInventory() {
  const storagePath = path.join(process.cwd(), "storage", "projects");
  const projects = await prisma.project.findMany({
    include: { attachments: true }
  });

  const projectFolders = await fs.readdir(storagePath).catch(() => [] as string[]);
  
  const residualFiles: ResidualFile[] = [];

  // 1. Identify "orphan_folders" (folders where project no longer exists)
  for (const folder of projectFolders) {
    const isProjectValid = projects.find(p => p.id === folder);
    if (!isProjectValid) {
      const folderPath = path.join(storagePath, folder);
      const files = await fs.readdir(folderPath).catch(() => []);
      for (const file of files) {
        residualFiles.push({
          filename: file,
          projectId: folder,
          projectName: "Proyecto Inexistente",
          reason: "orphan_folder"
        });
      }
    }
  }

  // 2. Identify "missing_db_record" (valid project folder, but file not in DB)
  for (const project of projects) {
    const projectFolderPath = path.join(storagePath, project.id);
    const filesInFs = await fs.readdir(projectFolderPath).catch(() => []);
    
    for (const fileName of filesInFs) {
      const isTracked = project.attachments.some(a => a.filename === fileName);
      if (!isTracked) {
        residualFiles.push({
          filename: fileName,
          projectId: project.id,
          projectName: project.title,
          reason: "missing_db_record"
        });
      }
    }
  }

  return residualFiles;
}

export async function deleteResidualFile(projectId: string, filename: string) {
  const filePath = path.join(process.cwd(), "storage", "projects", projectId, filename);
  await fs.unlink(filePath).catch(() => {});
  
  // Also check if directory is empty and remove it if orphan
  const projectFolderPath = path.join(process.cwd(), "storage", "projects", projectId);
  const remaining = await fs.readdir(projectFolderPath).catch(() => []);
  if (remaining.length === 0) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      await fs.rmdir(projectFolderPath).catch(() => {});
    }
  }

  revalidatePath("/archivos");
}

export async function registerFileToProject(projectId: string, filename: string) {
  // Check if project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  await prisma.attachment.create({
    data: {
      filename,
      filepath: `/storage/projects/${projectId}/${filename}`,
      projectId
    }
  });

  revalidatePath("/archivos");
  revalidatePath(`/proyectos/${projectId}`);
}
