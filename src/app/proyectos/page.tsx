export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import ProjectBrowser from "@/components/ProjectBrowser";

export default async function ProyectosPage() {
  const allProjects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Serializar fechas (Date → string) antes de pasar al Client Component
  const projects = allProjects.map(p => ({
    ...p,
    slaDate: p.slaDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <ProjectBrowser initialProjects={projects} />
  );
}
