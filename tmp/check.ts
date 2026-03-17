import { prisma } from "../src/lib/prisma";

async function main() {
  const attachments = await prisma.attachment.findMany({
    where: { projectId: "cmmn32afm0008u6z4hsrfv38w" }
  });
  console.log("Attachments for project cmmn32afm0008u6z4hsrfv38w:", JSON.stringify(attachments, null, 2));

  const project = await prisma.project.findUnique({
    where: { id: "cmmn32afm0008u6z4hsrfv38w" }
  });
  console.log("Project cmmn32afm0008u6z4hsrfv38w exists?", !!project);
}

main().catch(console.error);
