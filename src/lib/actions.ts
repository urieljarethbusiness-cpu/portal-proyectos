"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

export async function uploadFile(projectId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    console.warn("[uploadFile] No file found in formData", { projectId });
    return;
  }

  const uploadStart = Date.now();
  const filename = file.name;
  const filenameExt = path.extname(filename).toLowerCase();
  const filenameLength = filename.length;
  const suspiciousNamePattern = /[<>:"|?*\\]/.test(filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Define upload path: storage/projects/[projectId]/[filename]
  const projectDir = path.join(process.cwd(), "storage", "projects", projectId);
  const filePath = path.join(projectDir, filename);
  const resolvedProjectDir = path.resolve(projectDir);
  const resolvedFilePath = path.resolve(filePath);
  const isPathInsideProjectDir = resolvedFilePath.startsWith(`${resolvedProjectDir}${path.sep}`) || resolvedFilePath === resolvedProjectDir;

  console.log("[uploadFile] Starting upload", {
    projectId,
    filename,
    filenameLength,
    filenameExt,
    suspiciousNamePattern,
    size: file.size,
    bytesFromBuffer: buffer.byteLength,
    mimeType: file.type,
    cwd: process.cwd(),
    projectDir,
    filePath,
    resolvedProjectDir,
    resolvedFilePath,
    isPathInsideProjectDir,
  });

  await fs.mkdir(projectDir, { recursive: true });

  try {
    await fs.writeFile(filePath, buffer);
  } catch (error) {
    console.error("[uploadFile] Failed to write file to disk", {
      projectId,
      filename,
      filePath,
      error,
    });
    throw error;
  }

  const fileExistsAfterWrite = await fs.access(filePath).then(() => true).catch(() => false);
  console.log("[uploadFile] File written to disk", {
    projectId,
    filename,
    fileExistsAfterWrite,
  });

  try {
    const attachment = await prisma.attachment.create({
      data: {
        filename,
        filepath: `/storage/projects/${projectId}/${filename}`,
        projectId,
      },
    });

    console.log("[uploadFile] Attachment persisted in database", {
      projectId,
      filename,
      attachmentId: attachment.id,
      elapsedMs: Date.now() - uploadStart,
    });
  } catch (error) {
    console.error("[uploadFile] Failed to persist attachment in database", {
      projectId,
      filename,
      error,
    });
    throw error;
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/archivos");
}

export async function createProject(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const basePrice = parseFloat(formData.get("basePrice") as string);
  const isFreelance = formData.get("isFreelance") === "on";
  const slaDate = formData.get("slaDate") ? new Date(formData.get("slaDate") as string) : null;

  const projectType = isFreelance ? "FREELANCE" : "CORPORATE";

  const project = await prisma.project.create({
    data: {
      title,
      description,
      basePrice,
      isFreelance,
      projectType,
      slaDate,
      phase: "Nuevo",
      status: "Abierto",
    },
  });

  revalidatePath("/");
  revalidatePath("/proyectos");

  return {
    ...project,
    slaDate: project.slaDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
  };
}

export async function deleteProject(id: string) {
  await prisma.project.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/proyectos");
}

export async function updateProjectStatus(id: string, status: string) {
  await prisma.project.update({
    where: { id },
    data: { status }
  });

  revalidatePath(`/proyectos/${id}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function updateProjectField(id: string, field: string, value: any) {
  let finalValue = value;
  
  // Basic type conversion for boolean or dates if passed as strings
  if (field === 'slaDate' && typeof value === 'string') {
    finalValue = value ? new Date(value) : null;
  }
  if (field === 'isFreelance' && typeof value === 'string') {
    finalValue = value === 'true';
  }

  const data: any = { [field]: finalValue };

  // Sync isFreelance and projectType for backward compatibility
  if (field === 'projectType') {
    data.isFreelance = value === 'FREELANCE';
  }

  await prisma.project.update({
    where: { id },
    data
  });

  revalidatePath(`/proyectos/${id}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function updateProjectPhase(id: string, phase: string) {
  const dataToUpdate: any = { phase };
  
  if (phase === "Terminado") {
    dataToUpdate.status = "Terminado";
  } else {
    // Si se mueve fuera de Terminado, reactivarlo (a menos que quieran dejarlo Perdido)
    const project = await prisma.project.findUnique({ where: { id } });
    if (project?.status === "Terminado") {
      dataToUpdate.status = "Abierto";
    }
  }

  await prisma.project.update({
    where: { id },
    data: dataToUpdate
  });

  revalidatePath(`/proyectos/${id}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function deleteAttachment(id: string, projectId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id }
  });

  if (attachment) {
    // Attempt to delete physical file
    const absolutePath = path.join(process.cwd(), attachment.filepath.replace(/^\//, ''));
    try {
      await fs.unlink(absolutePath);
    } catch (err) {
      console.error("Could not delete physical file:", err);
    }

    await prisma.attachment.delete({
      where: { id },
    });
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/archivos");
}

export async function addNote(projectId: string, formData: FormData) {
  const content = formData.get("content") as string;
  if (!content) return;

  await prisma.note.create({
    data: {
      content,
      projectId,
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
}

export async function deleteNote(id: string, projectId: string) {
  await prisma.note.delete({
    where: { id },
  });

  revalidatePath(`/proyectos/${projectId}`);
}

export async function addTask(projectId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const priority = (formData.get("priority") as string) || "MEDIUM";
  const slaDateStr = formData.get("slaDate") as string;
  const slaDate = slaDateStr ? new Date(slaDateStr) : null;

  if (!title) return;

  await prisma.task.create({
    data: {
      title,
      priority,
      slaDate,
      projectId,
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/tareas");
}

export async function deleteTask(id: string, projectId?: string) {
  await prisma.task.delete({
    where: { id },
  });

  if (projectId) revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/tareas");
}

export async function updateTask(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const priority = formData.get("priority") as string;
  const slaDateStr = formData.get("slaDate") as string;
  const isCompleted = formData.get("isCompleted") === "true";

  const data: any = { title, priority, isCompleted };
  if (slaDateStr !== undefined) {
    data.slaDate = slaDateStr ? new Date(slaDateStr) : null;
  }

  const task = await prisma.task.update({
    where: { id },
    data,
  });

  revalidatePath(`/proyectos/${task.projectId}`);
  revalidatePath("/tareas");
}

export async function toggleTask(id: string, currentStatus: boolean, projectId?: string | unknown) {
  await prisma.task.update({
    where: { id },
    data: { isCompleted: !currentStatus }
  });
  
  if (typeof projectId === 'string') {
    revalidatePath(`/proyectos/${projectId}`);
  }
  revalidatePath("/tareas");
  revalidatePath("/");
}

export async function addExtra(projectId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const cost = parseFloat(formData.get("cost") as string);

  await prisma.extra.create({
    data: {
      title,
      cost,
      projectId,
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

export async function addPayment(projectId: string, formData: FormData) {
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const dateStr = formData.get("date") as string;
  const expectedDate = dateStr ? new Date(dateStr) : null;

  await prisma.payment.create({
    data: {
      description,
      amount,
      expectedDate,
      projectId,
      isPaid: false, // Default to false when added to plan
    },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

export async function togglePaymentStatus(id: string, projectId: string) {
  const payment = await prisma.payment.findUnique({ 
    where: { id },
    include: { project: true }
  });
  if (!payment) return;

  const newPaidStatus = !payment.isPaid;

  await prisma.payment.update({
    where: { id },
    data: { isPaid: newPaidStatus }
  });

  // Recurring Logic: If marked as paid and project is recurring, generate next payment
  if (newPaidStatus && payment.project.projectType !== "FREELANCE" && payment.project.billingFrequency !== "NONE") {
    const freq = payment.project.billingFrequency;
    const lastDate = payment.expectedDate ? new Date(payment.expectedDate) : new Date();
    let nextDate = new Date(lastDate);

    if (freq === "WEEKLY") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (freq === "BIWEEKLY") {
      // Logic for 15/30: If we are near 15, go to end of month. If near end, go to 15 of next.
      const day = nextDate.getDate();
      if (day <= 20) {
        // Move to last day of current month
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
      } else {
        // Move to 15th of next month
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 15);
      }
    } else if (freq === "MONTHLY") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (freq === "ANNUAL") {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    await prisma.payment.create({
      data: {
        projectId,
        amount: payment.amount,
        description: `Próximo pago (${payment.project.projectType}: ${payment.project.title})`,
        expectedDate: nextDate,
        isPaid: false
      }
    });
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
  revalidatePath("/finanzas");
}

export async function updatePaymentDate(id: string, projectId: string, date: string) {
  await prisma.payment.update({
    where: { id },
    data: { expectedDate: date ? new Date(date) : null }
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
}

export async function deletePayment(id: string, projectId: string) {
  await prisma.payment.delete({
    where: { id },
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
  revalidatePath("/finanzas");
}
