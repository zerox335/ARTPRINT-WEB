import { NextResponse } from "next/server";
import { quoteProduct } from "@/src/modules/pricing/application/quote-product";
import { quoteRequestSchema } from "@/src/modules/pricing/domain/price-engine";
import { apiError } from "@/src/shared/http";

export async function POST(request: Request) {
  try {
    const input = quoteRequestSchema.parse(await request.json());
    return NextResponse.json({ quote: await quoteProduct(input) });
  } catch (error) {
    return apiError(error);
  }
}
