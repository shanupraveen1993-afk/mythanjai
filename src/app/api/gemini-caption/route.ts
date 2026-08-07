// src/app/api/gemini-caption/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawCaption } = body;

    if (!rawCaption) {
      return NextResponse.json(
        { error: "rawCaption parameter is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `
      You are an expert copywriter for local businesses in Tanjore, Tamil Nadu.
      Your task is to take a raw caption/description of an offer, discount, or announcement, and summarize it into a clean, highly engaging 1-line headline under 60 characters.
      
      CRITICAL RULES:
      1. Prefix the headline with a highly relevant emoji.
      2. Keep it concise, energetic, and highly readable on a mobile screen.
      3. Return ONLY the raw string of the headline. Do not wrap in quotes, do not include markdown, explanations, or conversational text.
      
      Examples:
      - Raw: "Come and try our special mutton biryani combo. buy one get one free only for today evening from 6pm to 9pm at Old Bus Stand."
        Output: Buy 1 Get 1 FREE Mutton Biryani Combo
      - Raw: "New design wedding silk sarees launched at our showroom. We are offering flat 15% discount for aadi festival buyers."
        Output: 15% OFF New Wedding Silk Sarees
      - Raw: "Residential plots launch near medical college road. booking starts at just 50000 rupees. direct owner sales."
        Output: New Residential Plots Launch
    `;

    // Call Gemini Model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: `Raw Caption: "${rawCaption}"` },
          ],
        },
      ],
    });

    const headline = response.text?.trim() || "Special Local Offer";

    return NextResponse.json({
      success: true,
      headline,
    });
  } catch (error: any) {
    console.error("Gemini Caption processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate offer headline.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
