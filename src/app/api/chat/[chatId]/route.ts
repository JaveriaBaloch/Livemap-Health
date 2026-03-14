import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";

// GET messages for a chat
export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    await dbConnect();
    const chatId = params.chatId;
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
