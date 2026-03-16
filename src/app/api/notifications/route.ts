import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

// GET /api/notifications?userId=xxx  — fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        icon: n.icon,
        color: n.color,
        read: n.read,
        emergencyId: n.emergencyId?.toString(),
        chatId: n.chatId,
        fromUserId: n.fromUserId?.toString(),
        fromUserName: n.fromUserName,
        status: n.status,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PUT /api/notifications  — mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { notificationId, userId, markAllRead } = body;

    if (markAllRead && userId) {
      // Mark ALL as read for this user
      await Notification.updateMany({ userId, read: false }, { read: true });
      return NextResponse.json({ success: true, message: "All marked as read" });
    }

    if (notificationId) {
      // Mark single notification read
      await Notification.findByIdAndUpdate(notificationId, { read: true });
      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    return NextResponse.json({ error: "notificationId or markAllRead+userId required" }, { status: 400 });
  } catch (error: any) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// POST /api/notifications  — create a notification
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { userId, type, title, message, icon, color, emergencyId, chatId, fromUserId, fromUserName, status } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "userId, title, message required" }, { status: 400 });
    }

    // Dedupe: don't create if identical notification exists in last 30 seconds
    const recent = await Notification.findOne({
      userId,
      type: type || "system",
      title,
      message,
      createdAt: { $gte: new Date(Date.now() - 30000) },
    });

    if (recent) {
      return NextResponse.json({ success: true, message: "Duplicate skipped", notification: { id: recent._id.toString() } });
    }

    const notification = await Notification.create({
      userId,
      type: type || "system",
      title,
      message,
      icon: icon || "🔔",
      color: color || "#3b82f6",
      emergencyId: emergencyId || undefined,
      chatId: chatId || undefined,
      fromUserId: fromUserId || undefined,
      fromUserName: fromUserName || undefined,
      status: status || undefined,
      read: false,
    });

    console.log(`Notification created for user ${userId}: "${title}" - ${message}`);

    return NextResponse.json({
      success: true,
      notification: { id: notification._id.toString() },
    });
  } catch (error: any) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}