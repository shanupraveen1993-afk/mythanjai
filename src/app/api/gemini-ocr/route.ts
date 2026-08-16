// src/app/api/gemini-ocr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { TANJORE_LOCALITIES, SHOP_CATEGORIES } from "@/lib/constants";

// Initialize Gemini Client using the official SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image base64 data is required." },
        { status: 400 }
      );
    }

    // Build strict extraction prompt with allowed locality/category constants
    const systemPrompt = `
      You are an expert OCR parser for Tanjore (Thanjavur), Tamil Nadu local business visiting cards.
      Examine the provided visiting card image and extract the following details into a clean JSON object:

      Required JSON Schema:
      {
        "shop_name": "Extracted Shop/Business Name",
        "category": "Must match the closest item from this list: ${SHOP_CATEGORIES.join(", ")}",
        "phone": "Extracted 10-digit phone number without spaces or country code (or empty string if missing)",
        "address_text": "Extracted full address line in Tamil or English",
        "detected_area": "Must match the closest Tanjore area from this list: ${TANJORE_LOCALITIES.join(", ")}"
      }

      CRITICAL RULES:
      1. Return ONLY valid raw JSON. No markdown formatting, no code blocks (like \`\`\`json), no conversational text.
      2. If phone has multiple numbers, pick the primary contact number (e.g. 10 digits).
      3. If detected_area is unclear, default to "Tanjore Town (General)".
    `;

    // Call Gemini Model
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Fast, multimodal vision model
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ""), // Strip base64 prefix
              },
            },
          ],
        },
      ],
    });

    const responseText = response.text || "";

    // Clean markdown fences if present in output
    const cleanedJsonText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(cleanedJsonText);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Gemini OCR Processing Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract visiting card details.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
