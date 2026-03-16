import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import Pusher from "pusher";
import { Types } from "mongoose";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// GET chats for user or public chats
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    let query: any = { isActive: true };

    if (type === "public") {
      query.type = "public";
    } else if (userId) {
      query.$or = [{ participants: userId }, { type: "public" }];
    }

    if (type && type !== "public") {
      query.type = type;
      if (userId) query.participants = userId;
    }

    const chats = await Chat.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ chats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE new chat
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { type, name, participants, participantNames, emergencyId } = body;

    if (!type) {
      return NextResponse.json({ error: "Chat type is required" }, { status: 400 });
    }

    if (!Array.isArray(participants) || participants.length < 1) {
      return NextResponse.json({ error: "At least one participant is required" }, { status: 400 });
    }

    const cleanedParticipants = participants.filter(Boolean);
    if (cleanedParticipants.length < 1) {
      return NextResponse.json({ error: "Invalid participants" }, { status: 400 });
    }

    const invalidParticipant = cleanedParticipants.find((id: string) => !Types.ObjectId.isValid(id));
    if (invalidParticipant) {
      return NextResponse.json({ error: "Invalid participant id", invalidParticipant }, { status: 400 });
    }

    if (type === "emergency") {
      if (!emergencyId || !Types.ObjectId.isValid(emergencyId)) {
        return NextResponse.json({ error: "Valid emergencyId is required for emergency chat" }, { status: 400 });
      }

      const existingEmergencyChat = await Chat.findOne({
        type: "emergency",
        emergencyId,
        participants: { $all: cleanedParticipants },
        isActive: true,
      });

      if (existingEmergencyChat) {
        return NextResponse.json({ chat: existingEmergencyChat }, { status: 200 });
      }
    }

    const chat = await Chat.create({
      type,
      name: name || (type === "public" ? "Public Health Chat" : "Private Chat"),
      participants: cleanedParticipants,
      participantNames,
      emergencyId,
      isActive: true,
    });

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error: any) {
    console.error("Create chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// SEND message (PUT)
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { chatId, senderId, senderName, senderRole, content, type, metadata } = body;

    const message = await Message.create({
      chatId,
      senderId,
      senderName,
      senderRole,
      content,
      type: type || "text",
      metadata,
    });

    // Update chat last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: content,
      lastMessageAt: new Date(),
    });

    // Push realtime update
    try {
      await pusher.trigger(`chat-${chatId}`, "new-message", {
        message: message.toObject(),
      });
    } catch (e) {
      console.log("Pusher not configured, skipping realtime");
    }

    // Also notify each participant on their user channel (for badge when chat is closed)
    try {
      const chat: any = await Chat.findById(chatId).select("participants").lean();
      if (chat?.participants?.length) {
        const otherParticipants = (chat.participants as any[]).filter(
          (p: any) => p.toString() !== senderId
        );
        for (const participantId of otherParticipants) {
          try {
            await pusher.trigger(`user-${participantId.toString()}`, "new-chat-message", {
              chatId,
              senderName,
              preview: content?.slice(0, 60),
            });
          } catch {}
        }
      }
    } catch (e) {
      console.log("Pusher user channel notify failed:", e);
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}