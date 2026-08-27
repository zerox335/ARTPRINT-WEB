import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/src/infrastructure/database/prisma";
import { loginSchema } from "@/src/modules/identity/domain/credentials";
import { createSession, verifyPassword } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertRateLimit, assertSameOrigin, clientKey } from "@/src/shared/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    assertRateLimit(`login:${clientKey(request)}`, 10, 15 * 60 * 1000);
    const input = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.active || !(await verifyPassword(input.password, user.passwordHash))) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS", message: "Correo o contraseña incorrectos" }, { status: 401 });
    }
    await createSession(user.id, { userAgent: request.headers.get("user-agent") ?? undefined });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return apiError(error);
  }
}
