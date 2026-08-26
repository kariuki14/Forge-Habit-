import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { checkIn, HabitError } from "@/lib/habits";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await checkIn(user.id, id, {
      valueLogged: body?.valueLogged != null ? Number(body.valueLogged) : undefined,
      durationMinutes:
        body?.durationMinutes != null ? Number(body.durationMinutes) : undefined,
      note: body?.note ? String(body.note) : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof HabitError) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Habit not found" ? 404 : 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
