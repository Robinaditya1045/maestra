import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadVideoSchema } from "@/lib/validators";
import { getUploadPresignedUrl } from "@/lib/services/minio.service";
import { createVideo } from "@/lib/services/content.service";
import { isClassroomMentor } from "@/lib/services/classroom.service";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { classroomId, ...videoData } = body;

        if (!classroomId) {
            return NextResponse.json({ error: "classroomId is required" }, { status: 400 });
        }

        const isMentor = await isClassroomMentor(classroomId, session.user.id);
        if (!isMentor) {
            return NextResponse.json({ error: "Only mentors can upload videos" }, { status: 403 });
        }

        const validation = uploadVideoSchema.safeParse(videoData);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { title, description, fileName, fileSize, mimeType, duration } = validation.data;

        // Generate storage key
        const ext = fileName.split(".").pop() || "mp4";
        const storageKey = `${classroomId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        // Get presigned upload URL
        const uploadUrl = await getUploadPresignedUrl(storageKey, mimeType);

        // Create video record
        const video = await createVideo(
            classroomId,
            {
                title,
                description,
                videoUrl: `/api/videos/${storageKey}`,
                storageKey,
                duration,
                fileSize,
                mimeType,
            },
            session.user.id
        );

        return NextResponse.json({ uploadUrl, video }, { status: 201 });
    } catch (error) {
        console.error("Error uploading video:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
