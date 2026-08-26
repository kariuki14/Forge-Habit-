import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createHabit, HabitError, habitInputFromJson, listHabits } from "@/lib/habits";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const habits = await listHabits(user.id);
  return NextResponse.json({ habits });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    const habit = await createHabit(user.id, habitInputFromJson(body));
    return NextResponse.json({ habit }, { status: 201 });
  } catch (e) {
    if (e instanceof HabitError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
