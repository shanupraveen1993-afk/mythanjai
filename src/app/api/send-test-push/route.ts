import { NextResponse } from "next/server";
import { dispatchServerNotification } from "@/lib/notification-service-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipientPhone = "9994812345", text = "im antigravity" } = body;

    const cleanPhone = recipientPhone.replace(/\D/g, "").slice(-10);

    const result = await dispatchServerNotification({
      recipientUid: cleanPhone,
      recipientPhone: cleanPhone,
      type: "CHAT",
      title: "💬 New message from Namma Thanjai Team",
      message: text,
      senderName: "Namma Thanjai Team",
      conversationId: "namma_thanjai_system_welcome",
      actionUrl: "/chat?chatId=namma_thanjai_system_welcome",
      dateKey: `test_${Date.now()}`,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 500 });
  }
}
