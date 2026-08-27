import { NextResponse } from "next/server";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const products = await catalogRepository.listProducts({ category: url.searchParams.get("category") ?? undefined, query: url.searchParams.get("q") ?? undefined });
  return NextResponse.json({ products });
}
