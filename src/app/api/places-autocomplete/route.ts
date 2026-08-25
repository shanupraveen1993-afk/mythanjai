import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input") || searchParams.get("q") || "";

  if (!input.trim()) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    "AIzaSyACU4Z--tOj1D2ZUY1ks7kots9WQVoDo-s";

  try {
    // Google Places API (New v1) endpoint - works with new Google Cloud Projects
    const url = "https://places.googleapis.com/v1/places:autocomplete";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input: input.trim(),
        locationBias: {
          circle: {
            center: { latitude: 10.7870, longitude: 79.1378 },
            radius: 25000.0,
          },
        },
      }),
      next: { revalidate: 0 },
    });

    const data = await response.json();

    if (data.suggestions && data.suggestions.length > 0) {
      const predictions = data.suggestions
        .map((item: any) => {
          const pred = item.placePrediction;
          if (!pred) return null;
          return {
            place_id: pred.placeId || pred.place,
            description: pred.text?.text || pred.structuredFormat?.mainText?.text || input,
            main_text: pred.structuredFormat?.mainText?.text || pred.text?.text || input,
            secondary_text: pred.structuredFormat?.secondaryText?.text || "Thanjavur, Tamil Nadu",
          };
        })
        .filter(Boolean);

      return NextResponse.json({ predictions, status: "OK", source: "google_places_v1" });
    }
  } catch (error) {
    console.error("Google Places API (v1) error:", error);
  }

  // Local Tanjore Fallback list if API has 0 results or fails
  const localList = [
    "Medical College Road, Thanjavur",
    "Old Bus Stand, Thanjavur",
    "New Bus Stand, Thanjavur",
    "Thillai Nagar, Thanjavur",
    "Vallam, Thanjavur",
    "Pillayarpatti, Thanjavur",
    "Karanthai, Thanjavur",
    "Srinivasapuram, Thanjavur",
    "Sakkottai, Thanjavur",
    "Punnainallur, Thanjavur",
    "Raja Serfoji College Road, Thanjavur",
    "South Rampart, Thanjavur",
    "North Rampart, Thanjavur",
    "East Gate, Thanjavur",
    "West Gate, Thanjavur",
    "Villar Road, Thanjavur",
    "MC Road, Thanjavur",
    "Yagappa Nagar, Thanjavur",
    "LIC Colony, Thanjavur",
    "EB Colony, Thanjavur",
    "SR Mahal, Thanjavur",
    "Nanjikottai Road, Thanjavur",
    "Reddypalayam, Thanjavur",
  ].filter((loc) => loc.toLowerCase().includes(input.toLowerCase().trim()));

  return NextResponse.json({
    predictions: localList.map((loc, idx) => ({
      place_id: `fallback_${idx}`,
      description: loc,
      main_text: loc.split(",")[0],
      secondary_text: "Thanjavur, Tamil Nadu",
    })),
    status: localList.length > 0 ? "OK" : "ZERO_RESULTS",
    source: "local_fallback",
  });
}
