import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVideoById, updateVideoQuestion, deleteVideoQuestion } from "@/lib/services/content.service";
import { isClassroomMentor } from "@/lib/services/classroom.service";
import { updateVideoQuestionSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ id: string; qid: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, qid } = await params;
        const video = await getVideoById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const isMentor = await isClassroomMentor(video.classroomId, session.user.id);
        if (!isMentor) {
            return NextResponse.json({ error: "Only mentors can edit questions" }, { status: 403 });
        }

        const body = await request.json();
        const validation = updateVideoQuestionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const question = await updateVideoQuestion(qid, validation.data);
        return NextResponse.json(question);
    } catch (error) {
        console.error("Error updating question:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, qid } = await params;
        const video = await getVideoById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const isMentor = await isClassroomMentor(video.classroomId, session.user.id);
        if (!isMentor) {
            return NextResponse.json({ error: "Only mentors can delete questions" }, { status: 403 });
        }

        await deleteVideoQuestion(qid);
        return NextResponse.json({ message: "Question deleted" });
    } catch (error) {
        console.error("Error deleting question:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
