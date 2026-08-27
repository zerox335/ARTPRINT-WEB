import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLocaleLowerCase("en");
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrador ArtPrint";
  if (!email || !email.includes("@")) throw new Error("Define ADMIN_EMAIL con un correo válido");
  if (!password || password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres, mayúscula, minúscula y número");
  const passwordHash = await hash(password, 12);
  const user = await prisma.user.upsert({ where: { email }, update: { name, passwordHash, role: "ADMIN", active: true }, create: { email, name, passwordHash, role: "ADMIN", active: true } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "ADMIN_ACCOUNT_UPSERTED", entityType: "User", entityId: user.id, metadata: { source: "create-admin-script" } } });
  console.info(`Administrador listo: ${user.email}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "No pudimos crear el administrador"); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
