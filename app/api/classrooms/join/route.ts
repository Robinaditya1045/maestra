import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { joinClassroom } from "@/lib/services/classroom.service";
import { joinClassroomSchema } from "@/lib/validators";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = joinClassroomSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const classroom = await joinClassroom(validation.data.inviteCode, session.user.id);
        return NextResponse.json({
            message: "Successfully joined classroom",
            classroom: { id: classroom.id, title: classroom.title },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to join classroom";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
