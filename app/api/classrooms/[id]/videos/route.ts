import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClassroomVideos, createVideo, deleteVideo } from "@/lib/services/content.service";
import { isClassroomMember, isClassroomMentor } from "@/lib/services/classroom.service";
import { createVideoSchema } from "@/lib/validators";

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

        const videos = await getClassroomVideos(id);
        return NextResponse.json(videos);
    } catch (error) {
        console.error("Error fetching videos:", error);
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
        const isMentor = await isClassroomMentor(id, session.user.id);
        if (!isMentor) {
            return NextResponse.json({ error: "Only mentors can upload videos" }, { status: 403 });
        }

        const body = await request.json();
        const validation = createVideoSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const video = await createVideo(id, validation.data, session.user.id);
        return NextResponse.json(video, { status: 201 });
    } catch (error) {
        console.error("Error creating video:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const isMentor = await isClassroomMentor(id, session.user.id);
        if (!isMentor) {
            return NextResponse.json({ error: "Only mentors can delete videos" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");
        if (!videoId) {
            return NextResponse.json({ error: "Video ID required" }, { status: 400 });
        }

        await deleteVideo(videoId);
        return NextResponse.json({ message: "Video deleted" });
    } catch (error) {
        console.error("Error deleting video:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
