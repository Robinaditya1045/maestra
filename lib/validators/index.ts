import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["STUDENT", "MENTOR"]).default("STUDENT"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

// ─── Classroom ─────────────────────────────────────────

export const createClassroomSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().max(500).optional(),
});

export const updateClassroomSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
});

export const joinClassroomSchema = z.object({
    inviteCode: z.string().min(1, "Invite code is required"),
});

// ─── Content ───────────────────────────────────────────

export const createVideoSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(500).optional(),
    videoUrl: z.string().url("Must be a valid URL"),
});

export const uploadVideoSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(500).optional(),
    fileName: z.string().min(1),
    fileSize: z.number().positive().max(500 * 1024 * 1024, "File must be under 500MB"),
    mimeType: z.string().regex(/^video\//, "Must be a video file"),
    duration: z.number().positive().optional(),
});

export const createNoteSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    content: z.string().optional(),
    fileUrl: z.string().url().optional(),
});

// ─── Video Questions ───────────────────────────────────

export const createVideoQuestionSchema = z.object({
    timestamp: z.number().min(0, "Timestamp must be positive"),
    question: z.string().min(1, "Question is required").max(500),
    options: z.array(z.string().min(1)).min(2, "At least 2 options").max(6, "Maximum 6 options"),
    correctAnswer: z.number().int().min(0, "Invalid answer index"),
    explanation: z.string().max(500).optional(),
});

export const updateVideoQuestionSchema = z.object({
    timestamp: z.number().min(0).optional(),
    question: z.string().min(1).max(500).optional(),
    options: z.array(z.string().min(1)).min(2).max(6).optional(),
    correctAnswer: z.number().int().min(0).optional(),
    explanation: z.string().max(500).optional(),
});

// ─── Chat ──────────────────────────────────────────────

export const sendMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(2000),
});

// ─── Types ─────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type JoinClassroomInput = z.infer<typeof joinClassroomSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UploadVideoInput = z.infer<typeof uploadVideoSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateVideoQuestionInput = z.infer<typeof createVideoQuestionSchema>;
export type UpdateVideoQuestionInput = z.infer<typeof updateVideoQuestionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
