import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/src/infrastructure/database/prisma";
import { registerSchema } from "@/src/modules/identity/domain/credentials";
import { createSession, hashPassword } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertRateLimit, assertSameOrigin, clientKey } from "@/src/shared/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    assertRateLimit(`register:${clientKey(request)}`, 5, 15 * 60 * 1000);
    const input = registerSchema.parse(await request.json());
    const user = await prisma.user.create({ data: { name: input.name, email: input.email, phone: input.phone, passwordHash: await hashPassword(input.password) } });
    await createSession(user.id, { userAgent: request.headers.get("user-agent") ?? undefined });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "EMAIL_IN_USE", message: "Ya existe una cuenta con este correo" }, { status: 409 });
    return apiError(error);
  }
}
