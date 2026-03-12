import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVideoById, getVideoQuestions, createVideoQuestion } from "@/lib/services/content.service";
import { isClassroomMember, isClassroomMentor } from "@/lib/services/classroom.service";
import { createVideoQuestionSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const video = await getVideoById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const member = await isClassroomMember(video.classroomId, session.user.id);
        if (!member) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const questions = await getVideoQuestions(id);
        return NextResponse.json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const video = await getVideoById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const isMentor = await isClassroomMentor(video.classroomId, session.user.id);
        if (!isMentor) {
            return NextResponse.json({ error: "Only mentors can add questions" }, { status: 403 });
        }

        const body = await request.json();
        const validation = createVideoQuestionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const question = await createVideoQuestion(id, validation.data);
        return NextResponse.json(question, { status: 201 });
    } catch (error) {
        console.error("Error creating question:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
