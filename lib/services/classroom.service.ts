import { prisma } from "@/lib/db";
import { generateInviteCode } from "@/lib/utils";
import type { CreateClassroomInput, UpdateClassroomInput } from "@/lib/validators";

export async function createClassroom(
    data: CreateClassroomInput,
    userId: string
) {
    return prisma.classroom.create({
        data: {
            title: data.title,
            description: data.description,
            inviteCode: generateInviteCode(),
            createdById: userId,
            members: {
                create: {
                    userId,
                    role: "MENTOR",
                },
            },
        },
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true } },
        },
    });
}

export async function getUserClassrooms(userId: string) {
    return prisma.classroom.findMany({
        where: {
            members: {
                some: { userId },
            },
        },
        include: {
            createdBy: { select: { id: true, name: true } },
            _count: { select: { members: true, videos: true, notes: true } },
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getClassroomById(classroomId: string) {
    return prisma.classroom.findUnique({
        where: { id: classroomId },
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true, avatar: true } },
                },
                orderBy: { joinedAt: "asc" },
            },
            _count: { select: { members: true, videos: true, notes: true, messages: true } },
        },
    });
}

export async function updateClassroom(
    classroomId: string,
    data: UpdateClassroomInput
) {
    return prisma.classroom.update({
        where: { id: classroomId },
        data,
    });
}

export async function deleteClassroom(classroomId: string) {
    return prisma.classroom.delete({
        where: { id: classroomId },
    });
}

export async function joinClassroom(inviteCode: string, userId: string) {
    const classroom = await prisma.classroom.findUnique({
        where: { inviteCode },
    });

    if (!classroom) {
        throw new Error("Invalid invite code");
    }

    // Check if already a member
    const existingMember = await prisma.classroomMember.findUnique({
        where: {
            classroomId_userId: {
                classroomId: classroom.id,
                userId,
            },
        },
    });

    if (existingMember) {
        throw new Error("You are already a member of this classroom");
    }

    await prisma.classroomMember.create({
        data: {
            classroomId: classroom.id,
            userId,
            role: "STUDENT",
        },
    });

    return classroom;
}

export async function isClassroomMember(classroomId: string, userId: string) {
    const member = await prisma.classroomMember.findUnique({
        where: {
            classroomId_userId: { classroomId, userId },
        },
    });
    return member;
}

export async function isClassroomMentor(classroomId: string, userId: string) {
    const member = await isClassroomMember(classroomId, userId);
    return member?.role === "MENTOR";
}
