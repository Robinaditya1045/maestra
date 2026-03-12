import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVideoById } from "@/lib/services/content.service";
import { getObjectMeta, getObjectStream } from "@/lib/services/minio.service";
import { isClassroomMember } from "@/lib/services/classroom.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const video = await getVideoById(id);
        if (!video || !video.storageKey) {
            return new Response("Video not found", { status: 404 });
        }

        // Check membership
        const member = await isClassroomMember(video.classroomId, session.user.id);
        if (!member) {
            return new Response("Forbidden", { status: 403 });
        }

        const range = request.headers.get("range");
        const meta = await getObjectMeta(video.storageKey);
        const totalSize = meta.contentLength;

        if (range) {
            // Range request for seeking
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 5 * 1024 * 1024 - 1, totalSize - 1);

            const s3Response = await getObjectStream(
                video.storageKey,
                `bytes=${start}-${end}`
            );

            const stream = s3Response.Body as ReadableStream;

            return new Response(stream as unknown as BodyInit, {
                status: 206,
                headers: {
                    "Content-Range": `bytes ${start}-${end}/${totalSize}`,
                    "Accept-Ranges": "bytes",
                    "Content-Length": String(end - start + 1),
                    "Content-Type": video.mimeType || "video/mp4",
                    "Cache-Control": "public, max-age=31536000",
                },
            });
        }

        // Full response
        const s3Response = await getObjectStream(video.storageKey);
        const stream = s3Response.Body as ReadableStream;

        return new Response(stream as unknown as BodyInit, {
            status: 200,
            headers: {
                "Content-Length": String(totalSize),
                "Content-Type": video.mimeType || "video/mp4",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=31536000",
            },
        });
    } catch (error) {
        console.error("Error streaming video:", error);
        return new Response("Internal server error", { status: 500 });
    }
}
