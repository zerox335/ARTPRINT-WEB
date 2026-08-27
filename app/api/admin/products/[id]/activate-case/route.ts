import { NextResponse, type NextRequest } from "next/server";
import { activateCaseReference, CaseReferenceActivationError } from "@/src/modules/admin/application/activate-case-reference";
import { caseReferenceActivationSchema } from "@/src/modules/admin/domain/case-reference-activation";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertSameOrigin } from "@/src/shared/http";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const { id } = await context.params;
    const input = caseReferenceActivationSchema.parse(await request.json());
    const product = await activateCaseReference(id, input, user.id);
    return NextResponse.json({ product, message: "Referencia publicada con su mockup calibrado" });
  } catch (error) {
    if (error instanceof CaseReferenceActivationError) {
      const messages = {
        REFERENCE_NOT_FOUND: "La referencia de carcasa no existe",
        REFERENCE_ALREADY_ACTIVE: "Esta referencia ya fue configurada o no es un borrador activable",
        ASSET_NOT_FOUND: "La imagen no terminó de cargar o no pertenece a tu cuenta",
      } as const;
      return NextResponse.json({ error: error.code, message: messages[error.code] }, { status: error.code === "REFERENCE_ALREADY_ACTIVE" ? 409 : 400 });
    }
    return apiError(error);
  }
}
