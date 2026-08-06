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
    const { rawDescription, type } = body;

    if (!rawDescription) {
      return NextResponse.json(
        { error: "rawDescription is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `
      You are an expert AI editor for Namma Thanjai (a local hyper-local noticeboard app in Tanjore, Tamil Nadu).
      Your task is to take a raw description written by a user and format it into a clean, structured, standard layout using markdown.
      
      COMPETITOR-STANDARD LAYOUTS TO APPLY:
      
      1. For "sell" (OLX / classified selling posts):
         Format exactly as:
         **Product Specifications:**
         • **Model / Item:** [Item Name & Model]
         • **Condition:** [e.g. Brand New / Like New / Good / Fair]
         • **Key Features:** [Bullet points of specs]
         **Pricing:** [e.g. ₹X,XXX (Negotiable/Fixed)]
         
      2. For "need" (99acres / buyer requirements):
         Format exactly as:
         **Requirement Details:**
         • **Looking For:** [What user is buying/renting]
         • **Specific Requirements:** [Size, specifications, area preferences]
         **Target Budget:** [e.g. Up to ₹X,XXX or Negotiable]
         **Timeline:** [Urgent / Flexible / Within 15 Days]

      3. For "services" (Urban Company / Sulekha services):
         Format exactly as:
         **Services Offered:**
         • [Bullet list of specific job types, repairs, or skill sets]
         **Expertise & Timings:**
         • **Experience:** [Years of experience]
         • **Coverage:** [Areas covered in Thanjavur]
         • **Visiting Charge:** [e.g. Free consultation / ₹100 visiting charge]

      4. For "shops" or "offers" (Justdial / Google Maps business style):
         Format exactly as:
         **Business Overview:**
         • **Category Focus:** [What the shop sells or specializes in]
         • **Store Timings:** [e.g. 9:00 AM - 9:00 PM]
         **Active Offer details:**
         • **Discount Campaign:** [e.g. Flat 15% Off / Buy 1 Get 1]
         • **Terms:** [e.g. Valid till end of month / Minimum purchase requirements]
      
      CRITICAL RULES:
      1. Correct any spelling or grammar mistakes, but preserve all crucial information (prices, model names, contact details, areas, timings).
      2. Do NOT add conversational replies, markdown code blocks, or introductory text (like "Here is your formatted text:"). Only return the formatted description itself.
      3. Keep it brief, easy to read on mobile, and highly professional.
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

    const formattedText = response.text?.trim() || rawDescription;

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
