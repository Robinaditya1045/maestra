import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    getClassroomById,
    updateClassroom,
    deleteClassroom,
    isClassroomMentor,
    isClassroomMember,
} from "@/lib/services/classroom.service";
import { updateClassroomSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const member = await isClassroomMember(id, session.user.id);
        if (!member) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const classroom = await getClassroomById(id);
        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
        }

        return NextResponse.json({ ...classroom, currentUserRole: member.role });
    } catch (error) {
        console.error("Error fetching classroom:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const isMentor = await isClassroomMentor(id, session.user.id);
        if (!isMentor) {
            return NextResponse.json({ error: "Only mentors can edit classrooms" }, { status: 403 });
        }

        const body = await request.json();
        const validation = updateClassroomSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const classroom = await updateClassroom(id, validation.data);
        return NextResponse.json(classroom);
    } catch (error) {
        console.error("Error updating classroom:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const isMentor = await isClassroomMentor(id, session.user.id);
        if (!isMentor) {
            return NextResponse.json({ error: "Only mentors can delete classrooms" }, { status: 403 });
        }

        await deleteClassroom(id);
        return NextResponse.json({ message: "Classroom deleted" });
    } catch (error) {
        console.error("Error deleting classroom:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
