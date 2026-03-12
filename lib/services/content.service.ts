import { prisma } from "@/lib/db";
import type { CreateVideoInput, CreateNoteInput, CreateVideoQuestionInput, UpdateVideoQuestionInput } from "@/lib/validators";
import { deleteObject } from "./minio.service";

// ─── Videos ────────────────────────────────────────────

export async function getClassroomVideos(classroomId: string) {
    return prisma.video.findMany({
        where: { classroomId },
        include: {
            uploadedBy: { select: { id: true, name: true } },
            _count: { select: { questions: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getVideoById(videoId: string) {
    return prisma.video.findUnique({
        where: { id: videoId },
        include: {
            uploadedBy: { select: { id: true, name: true } },
            classroom: { select: { id: true, title: true } },
            _count: { select: { questions: true } },
        },
    });
}

export async function createVideo(
    classroomId: string,
    data: CreateVideoInput & {
        storageKey?: string;
        duration?: number;
        fileSize?: number;
        mimeType?: string;
    },
    userId: string
) {
    return prisma.video.create({
        data: {
            classroomId,
            title: data.title,
            description: data.description,
            videoUrl: data.videoUrl,
            storageKey: data.storageKey,
            duration: data.duration,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            uploadedById: userId,
        },
        include: {
            uploadedBy: { select: { id: true, name: true } },
        },
    });
}

export async function deleteVideo(videoId: string) {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (video?.storageKey) {
        try {
            await deleteObject(video.storageKey);
        } catch (err) {
            console.error("Failed to delete from MinIO:", err);
        }
    }
    return prisma.video.delete({
        where: { id: videoId },
    });
}

// ─── Video Questions ───────────────────────────────────

export async function getVideoQuestions(videoId: string) {
    return prisma.videoQuestion.findMany({
        where: { videoId },
        orderBy: { timestamp: "asc" },
    });
}

export async function createVideoQuestion(
    videoId: string,
    data: CreateVideoQuestionInput
) {
    return prisma.videoQuestion.create({
        data: {
            videoId,
            timestamp: data.timestamp,
            question: data.question,
            options: data.options,
            correctAnswer: data.correctAnswer,
            explanation: data.explanation,
        },
    });
}

export async function updateVideoQuestion(
    questionId: string,
    data: UpdateVideoQuestionInput
) {
    return prisma.videoQuestion.update({
        where: { id: questionId },
        data: {
            ...(data.timestamp !== undefined && { timestamp: data.timestamp }),
            ...(data.question !== undefined && { question: data.question }),
            ...(data.options !== undefined && { options: data.options }),
            ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
            ...(data.explanation !== undefined && { explanation: data.explanation }),
        },
    });
}

export async function deleteVideoQuestion(questionId: string) {
    return prisma.videoQuestion.delete({
        where: { id: questionId },
    });
}

// ─── Notes ─────────────────────────────────────────────

export async function getClassroomNotes(classroomId: string) {
    return prisma.note.findMany({
        where: { classroomId },
        include: {
            uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createNote(
    classroomId: string,
    data: CreateNoteInput,
    userId: string
) {
    return prisma.note.create({
        data: {
            classroomId,
            title: data.title,
            content: data.content,
            fileUrl: data.fileUrl,
            uploadedById: userId,
        },
        include: {
            uploadedBy: { select: { id: true, name: true } },
        },
    });
}

export async function deleteNote(noteId: string) {
    return prisma.note.delete({
        where: { id: noteId },
    });
}
