import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClassroomNotes, createNote, deleteNote } from "@/lib/services/content.service";
import { isClassroomMember, isClassroomMentor } from "@/lib/services/classroom.service";
import { createNoteSchema } from "@/lib/validators";

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

        const notes = await getClassroomNotes(id);
        return NextResponse.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
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
            return NextResponse.json({ error: "Only mentors can create notes" }, { status: 403 });
        }

        const body = await request.json();
        const validation = createNoteSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const note = await createNote(id, validation.data, session.user.id);
        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error("Error creating note:", error);
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
            return NextResponse.json({ error: "Only mentors can delete notes" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get("noteId");
        if (!noteId) {
            return NextResponse.json({ error: "Note ID required" }, { status: 400 });
        }

        await deleteNote(noteId);
        return NextResponse.json({ message: "Note deleted" });
    } catch (error) {
        console.error("Error deleting note:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
