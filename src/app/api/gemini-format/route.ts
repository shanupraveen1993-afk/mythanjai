// src/app/api/gemini-format/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

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

    const systemPrompt = `
      You are an expert AI copy editor for Namma Thanjai (a local marketplace & directory app in Tanjore, Tamil Nadu).
      Your task is to convert raw user descriptions into clean, professional, readable plain text.

      CRITICAL FORMATTING RULE:
      DO NOT USE ANY MARKDOWN ASTERISKS (** or *), HASHES (#), OR CODE BLOCKS.
      Output ONLY clean plain text with standard capital headings and bullet points (•).

      LAYOUT TEMPLATES:

      1. For "sell" (Marketplace items / property / vehicles):
         Product Details:
         • Item / Model: [Name & Details]
         • Condition: [Condition]
         • Key Features: [Key bullet points]

      2. For "need" (Buyer requirements):
         Requirement Summary:
         • Looking For: [What user is buying/renting]
         • Preferences: [Size, specs, location preferences]

      3. For "services" (Local tradespeople & services):
         Services Offered:
         • [List of specific jobs/services]
         • Experience & Coverage: [Details]

      4. For "shops" / "offers" (Local store deals):
         Offer Details:
         • Promotion: [Discount / Offer details]
         • Terms: [Validity & Store hours]

      CRITICAL RULES:
      1. Correct spelling and grammar, but PRESERVE the user's facts. Do NOT add fake hype or unmentioned claims.
      2. ZERO MARKDOWN SYMBOLS. NO ASTERISKS. NO BOLD SYMBOLS. Plain readable text only.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: `Post Type: "${type || "sell"}"\nRaw Description: "${rawDescription}"` },
          ],
        },
      ],
    });

    let formattedText = response.text?.trim() || rawDescription;

    // Post-processing sanitizer: strip all raw markdown asterisks, hashes, and double underlines
    formattedText = formattedText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "•")
      .replace(/#/g, "")
      .replace(/__/g, "")
      .replace(/• • /g, "• ");

    return NextResponse.json({
      success: true,
      formattedText,
    });
  } catch (error: any) {
    console.error("Gemini formatting error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to format description.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
