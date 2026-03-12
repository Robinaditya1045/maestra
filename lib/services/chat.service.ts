import { prisma } from "@/lib/db";

export async function getClassroomMessages(classroomId: string) {
    return prisma.message.findMany({
        where: { classroomId },
        include: {
            sender: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
    });
}

export async function sendMessage(
    classroomId: string,
    senderId: string,
    content: string
) {
    return prisma.message.create({
        data: {
            classroomId,
            senderId,
            content,
        },
        include: {
            sender: { select: { id: true, name: true, avatar: true } },
        },
    });
}
