import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUserApi();
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, message: err.message },
      { status: err.status || 401 }
    );
  }
}
