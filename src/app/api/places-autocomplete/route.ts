import { NextResponse } from "next/server";

const THANJAVUR_LOCALITIES = [
  "Medical College Road, Thanjavur",
  "Old Bus Stand, Thanjavur",
  "New Bus Stand, Thanjavur",
  "Thillai Nagar, Thanjavur",
  "Vallam, Thanjavur",
  "Pillayarpatti, Thanjavur",
  "Karanthai, Thanjavur",
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
  "Srinivasapuram, Thanjavur",
  "Sankar Nagar, Thanjavur",
  "Gandhi Nagar, Thanjavur",
  "Periya Kovil Street, Thanjavur",
  "Hospital Road, Thanjavur",
  "Kumbakonam Road, Thanjavur",
  "Thiruvaiyaru Road, Thanjavur",
  "Papanasam Road, Thanjavur",
  "Aduthurai, Thanjavur",
  "Budalur, Thanjavur",
  "Thiruvidaimarudur, Thanjavur",
  "Swamimalai, Thanjavur",
  "Dharasuram, Thanjavur",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input") || searchParams.get("q") || "";

  if (!input.trim()) {
    return NextResponse.json({ predictions: [] });
  }

  // Use server-side key (not NEXT_PUBLIC) - always available in Vercel production
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    "";

  if (apiKey) {
    try {
      // Bias results strictly to Thanjavur (lat: 10.7870, lng: 79.1378, radius 25,000m)
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input.trim()
      )}&location=10.7870,79.1378&radius=25000&components=country:in&key=${apiKey}`;

      const res = await fetch(url, { next: { revalidate: 0 } });
      const data = await res.json();

      if (data.status === "OK" && data.predictions && data.predictions.length > 0) {
        const predictions = data.predictions.map((p: any) => ({
          place_id: p.place_id,
          description: p.description,
          main_text: p.structured_formatting?.main_text || p.description,
          secondary_text:
            p.structured_formatting?.secondary_text || "Thanjavur, Tamil Nadu",
        }));
        return NextResponse.json({ predictions, status: "OK" });
      }

      // Log failure reason in server logs (not exposed to client)
      if (data.status && data.status !== "OK") {
        console.warn(`[Places API] Status: ${data.status} — ${data.error_message || ""}`);
      }
    } catch (error) {
      console.error("[Places API] fetch error:", error);
    }
  }

  // Fallback: Local Thanjavur locality list
  const fallback = THANJAVUR_LOCALITIES.filter((loc) =>
    loc.toLowerCase().includes(input.toLowerCase().trim())
  );

  if (fallback.length > 0) {
    return NextResponse.json({
      predictions: fallback.map((loc, i) => ({
        place_id: `local_${i}`,
        description: loc,
        main_text: loc.split(",")[0].trim(),
        secondary_text: "Thanjavur, Tamil Nadu",
      })),
      status: "OK",
      source: "local_fallback",
    });
  }

  return NextResponse.json({ predictions: [], status: "ZERO_RESULTS" });
}
