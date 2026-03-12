import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClassroom, getUserClassrooms } from "@/lib/services/classroom.service";
import { createClassroomSchema } from "@/lib/validators";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const classrooms = await getUserClassrooms(session.user.id);
        return NextResponse.json(classrooms);
    } catch (error) {
        console.error("Error fetching classrooms:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "MENTOR" && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Only mentors can create classrooms" }, { status: 403 });
        }

        const body = await request.json();
        const validation = createClassroomSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const classroom = await createClassroom(validation.data, session.user.id);
        return NextResponse.json(classroom, { status: 201 });
    } catch (error) {
        console.error("Error creating classroom:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
