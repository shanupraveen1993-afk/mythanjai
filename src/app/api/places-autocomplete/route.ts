import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input") || searchParams.get("q") || "";

  if (!input.trim()) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "AIzaSyACU4Z--tOj1D2ZUY1ks7kots9WQVoDo-s";

  try {
    // Bias results strictly to Thanjavur (lat: 10.7870, lng: 79.1378, radius 25,000m)
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input.trim()
    )}&location=10.7870,79.1378&radius=25000&components=country:in&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      return NextResponse.json({ predictions: [], status: data.status, error_message: data.error_message });
    }

    const predictions = (data.predictions || []).map((p: any) => ({
      place_id: p.place_id,
      description: p.description,
      main_text: p.structured_formatting?.main_text || p.description,
      secondary_text: p.structured_formatting?.secondary_text || "Thanjavur, Tamil Nadu",
    }));

    return NextResponse.json({ predictions, status: "OK" });
  } catch (error) {
    console.error("Google Places Autocomplete Error:", error);
    return NextResponse.json({ error: "Places API request failed" }, { status: 500 });
  }
}
