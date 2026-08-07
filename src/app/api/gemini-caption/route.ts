import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reelUrl, rawCaption: inputRawCaption } = body;

    let scrapedCaption = inputRawCaption || "";
    let scrapedAuthor = "Thanjavur Local Partner";
    let scrapedThumbnail = "";

    // If Instagram Reel URL is provided, fetch public oEmbed metadata
    if (reelUrl && reelUrl.includes("instagram.com")) {
      try {
        const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(reelUrl)}`;
        const oembedRes = await fetch(oembedUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
        });
        
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          scrapedCaption = oembedData.title || scrapedCaption;
          scrapedAuthor = oembedData.author_name || scrapedAuthor;
          scrapedThumbnail = oembedData.thumbnail_url || scrapedThumbnail;
        } else {
          // HTML fallback metadata scraping
          const htmlRes = await fetch(reelUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
          });
          const htmlText = await htmlRes.text();
          
          const ogTitleMatch = htmlText.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
          const ogDescMatch = htmlText.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
          const ogImgMatch = htmlText.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

          if (ogDescMatch && ogDescMatch[1]) scrapedCaption = ogDescMatch[1];
          else if (ogTitleMatch && ogTitleMatch[1]) scrapedCaption = ogTitleMatch[1];
          if (ogImgMatch && ogImgMatch[1]) scrapedThumbnail = ogImgMatch[1];
        }
      } catch (scrapeErr) {
        console.warn("Instagram scraper fallback warning:", scrapeErr);
      }
    }

    // Default fallback caption if scraping was blocked
    if (!scrapedCaption || scrapedCaption.length < 5) {
      scrapedCaption = "Special promotional deal extracted directly from Instagram Video Reel. Watch full reel on Instagram for promo codes and store discounts.";
    }

    const systemPrompt = `
      You are an expert AI copywriter and data extractor for Thanjavur local directory.
      Analyze the provided raw Instagram caption text and extract a JSON object with:
      1. "headline": Short punchy 1-line offer title under 60 characters with relevant emoji.
      2. "shopName": Extracted store name or brand name (default to "Thanjavur Store Deal" if unclear).
      3. "category": Pick ONE from: ["Cafe & Restaurant", "Textiles & Clothing", "Jewelry Showroom", "Supermarket & Grocery", "Electronics", "General Shop"].
      4. "cleanDescription": Cleaned up, readable post description summarizing key offers.

      Return ONLY valid raw JSON with keys: headline, shopName, category, cleanDescription.
    `;

    let headline = "📸 Instagram Special Reel Deal";
    let shopName = scrapedAuthor || "Thanjavur Partner Offer";
    let category = "Cafe & Restaurant";
    let cleanDescription = scrapedCaption;

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                { text: `Raw Instagram Caption: "${scrapedCaption}"` },
              ],
            },
          ],
        });

        const textOutput = response.text?.trim() || "";
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          headline = parsed.headline || headline;
          shopName = parsed.shopName || shopName;
          category = parsed.category || category;
          cleanDescription = parsed.cleanDescription || cleanDescription;
        }
      } catch (aiErr) {
        console.warn("Gemini AI refinement fallback:", aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      headline,
      shopName,
      category,
      caption: cleanDescription,
      rawCaption: scrapedCaption,
      thumbnailUrl: scrapedThumbnail || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
    });
  } catch (error: any) {
    console.error("Gemini Caption processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate offer caption.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
