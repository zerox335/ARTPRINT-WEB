import { NextResponse } from "next/server";
import { currentUser } from "@/src/modules/identity/infrastructure/session";

export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}
