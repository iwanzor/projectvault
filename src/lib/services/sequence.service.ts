import { prisma } from "@/lib/prisma";

export async function getNextNumber(objectName: string): Promise<string> {
  const result = await prisma.sequence.upsert({
    where: { objectName },
    update: { objectKey: { increment: 1 }, lastDate: new Date() },
    create: { objectName, objectKey: 1, lastDate: new Date() },
  });

  const num = Number(result.objectKey).toString().padStart(6, "0");
  return `${objectName}-${num}`;
}
