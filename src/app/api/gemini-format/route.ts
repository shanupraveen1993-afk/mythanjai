// src/app/api/gemini-format/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { TANJORE_LOCALITIES, SHOP_CATEGORIES } from "@/lib/constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const today = new Date().toISOString().split("T")[0];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawDescription = body.rawDescription || body.raw_text || "";
    const type = body.type || "sell";

    if (!rawDescription) {
      return NextResponse.json(
        { error: "rawDescription is required" },
        { status: 400 }
      );
    }

    // ── For "offer" / "shops": extract structured fields + format text ──────
    if (type === "offer" || type === "shops") {
      const offerPrompt = `
You are an expert AI assistant for Namma Thanjai (a local marketplace in Tanjore, Tamil Nadu).
The user has typed a raw description for a store offer or deal.

Your job is TWO things:
1. Return a clean, professional formatted description (plain text, NO markdown asterisks, NO #, NO **).
2. Extract structured fields from the raw description.

Today's date is: ${today}

Respond ONLY in this exact JSON format (no markdown fences, no extra text):
{
  "formattedText": "Clean formatted offer description here. Use • for bullet points. No ** or # symbols.",
  "extractedFields": {
    "shop_name": "Extracted business/store name, or empty string if not found",
    "valid_from": "YYYY-MM-DD start date if mentioned, else today ${today}",
    "valid_to": "YYYY-MM-DD end date if mentioned (e.g. 'till Sunday', 'until 20th', '30 days'), else empty string",
    "area_tag": "Must match closest item from: ${TANJORE_LOCALITIES.join(", ")}. Default: Tanjore Town (General)",
    "category": "Must match closest item from: ${SHOP_CATEGORIES.join(", ")}"
  }
}

Raw Description from user:
"${rawDescription}"
`;

      let raw = "";
      try {
        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: offerPrompt }] }],
        });
        raw = res.text?.trim() || "";
      } catch {
        const res = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts: [{ text: offerPrompt }] }],
        });
        raw = res.text?.trim() || "";
      }

      // Strip markdown fences if present
      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        const parsed = JSON.parse(cleaned);
        let formattedText: string = parsed.formattedText || rawDescription;
        formattedText = formattedText
          .replace(/\*\*/g, "")
          .replace(/\*/g, "•")
          .replace(/#/g, "")
          .replace(/__/g, "")
          .replace(/• • /g, "• ");

        return NextResponse.json({
          success: true,
          formattedText,
          extractedFields: parsed.extractedFields || {},
        });
      } catch {
        // JSON parse failed — return just formatted text
        const fallback = raw
          .replace(/\*\*/g, "")
          .replace(/\*/g, "•")
          .replace(/#/g, "");
        return NextResponse.json({
          success: true,
          formattedText: fallback || rawDescription,
          extractedFields: {},
        });
      }
    }

    // ── For sell / need / service: text-only formatting (unchanged) ──────────
    const systemPrompt = `
You are an expert AI copy editor for Namma Thanjai (a local marketplace & directory app in Tanjore, Tamil Nadu).
Convert raw user descriptions into clean, professional, readable plain text.

CRITICAL: DO NOT USE ** * # or code blocks. Use • for bullets. Plain text only.

Templates:
- sell: Product Details: • Item/Model • Condition • Key Features
- need: Requirement Summary: • Looking For • Preferences
- services: Services Offered: • [List] • Experience & Coverage
`;

    let formattedText = "";
    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: `Post Type: "${type}"\nRaw Description: "${rawDescription}"` },
          ],
        }],
      });
      formattedText = res.text?.trim() || "";
    } catch {
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: `Post Type: "${type}"\nRaw Description: "${rawDescription}"` },
          ],
        }],
      });
      formattedText = res.text?.trim() || "";
    }

    if (!formattedText) formattedText = rawDescription;

    formattedText = formattedText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "•")
      .replace(/#/g, "")
      .replace(/__/g, "")
      .replace(/• • /g, "• ");

    return NextResponse.json({ success: true, formattedText });
  } catch (error: any) {
    console.error("Gemini formatting error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to format description.", details: error.message },
      { status: 500 }
    );
  }
}
