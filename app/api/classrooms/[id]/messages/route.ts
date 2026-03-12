import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClassroomMessages, sendMessage } from "@/lib/services/chat.service";
import { isClassroomMember } from "@/lib/services/classroom.service";
import { sendMessageSchema } from "@/lib/validators";

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

        const messages = await getClassroomMessages(id);
        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
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
        const member = await isClassroomMember(id, session.user.id);
        if (!member) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const body = await request.json();
        const validation = sendMessageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const message = await sendMessage(id, session.user.id, validation.data.content);
        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
