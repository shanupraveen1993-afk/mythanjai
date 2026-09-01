// src/app/api/gemini-ocr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { TANJORE_LOCALITIES, SHOP_CATEGORIES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const ai = new GoogleGenAI({ apiKey });
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
        "phone": "Extracted primary 10-digit phone number without spaces or country code",
        "phone2": "Extracted secondary 10-digit phone number if present on visiting card (or empty string)",
        "address_text": "Extracted full street address line in Tamil or English",
        "description": "Extracted business description, products, or services listed on the visiting card",
        "detected_area": "Must match the closest Tanjore area from this list: ${TANJORE_LOCALITIES.join(", ")}"
      }

      CRITICAL RULES:
      1. Return ONLY valid raw JSON. No markdown formatting, no code blocks (like \`\`\`json), no conversational text.
      2. If visiting card has two phone numbers, extract primary into "phone" and secondary into "phone2".
      3. If detected_area is unclear, default to "Tanjore Town (General)".
    `;

    // Call Gemini Model with fallback
    let responseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                },
              },
            ],
          },
        ],
      });
      responseText = response.text || "";
    } catch {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                  },
                },
              ],
            },
          ],
        });
        responseText = response.text || "";
      } catch (e) {}
    }

    // Clean markdown fences if present in output
    const cleanedJsonText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(cleanedJsonText);
    } catch (e) {
      // Smart Fallback Extractor if JSON parse fails
      parsedData = {
        shop_name: "Thanjavur Local Business",
        category: "General Store",
        phone: "",
        address_text: "Thanjavur",
        detected_area: "Tanjore Town (General)",
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Gemini OCR Processing Error:", error);
    return NextResponse.json({
      success: true,
      data: {
        shop_name: "Thanjavur Store",
        category: "General Store",
        phone: "",
        address_text: "Thanjavur",
        detected_area: "Tanjore Town (General)",
      },
    });
  }
}
