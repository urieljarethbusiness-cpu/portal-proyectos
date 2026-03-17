import { prisma } from "@/lib/prisma";
import ProjectBrowser from "@/components/ProjectBrowser";

export default async function ProyectosPage() {
  const allProjects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <ProjectBrowser initialProjects={allProjects} />
  );
}
