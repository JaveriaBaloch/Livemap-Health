import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { location, query, type, radius = 5000 } = await request.json();

    if (!location || !location.lat || !location.lng) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      console.error("Google Places API key not found in environment variables");
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      );
    }

    console.log("API Key loaded:", GOOGLE_PLACES_API_KEY ? "✓ Present" : "✗ Missing");

    // Build search query based on type and custom query
    let searchQuery = query || "doctor";
    if (type === "hospital") {
      searchQuery = "hospital medical center";
    } else if (type === "dentist") {
      searchQuery = "dentist dental clinic";
    } else if (type !== "doctor" && !query) {
      searchQuery = `${type} doctor`;
    }

    // Use Google Places API (New) - Text Search
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
    
    const requestBody = {
      textQuery: `${searchQuery} near me`,
      locationBias: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng
          },
          radius: radius
        }
      },
      maxResultCount: 20,
      includedTypes: ["hospital", "doctor", "dentist", "pharmacy", "physiotherapist"],
      languageCode: "en"
    };

    console.log("Searching with new Places API:", searchUrl);
    console.log("Search parameters:", { location, searchQuery, type, radius });

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber,places.types,places.businessStatus'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Places API (New) error:", data);
      console.log("Falling back to Google Maps Text Search API...");
      
      // Fallback to Google Maps Text Search API
      const fallbackUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=${encodeURIComponent(searchQuery + " near " + location.lat + "," + location.lng)}&` +
        `location=${location.lat},${location.lng}&` +
        `radius=${radius}&` +
        `type=health&` +
        `key=${GOOGLE_PLACES_API_KEY}`;

      console.log("Using fallback URL:", fallbackUrl.replace(GOOGLE_PLACES_API_KEY, '[API_KEY]'));

      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();

      if (!fallbackResponse.ok || fallbackData.status !== 'OK') {
        console.error("Fallback API also failed:", fallbackData);
        return NextResponse.json(
          { error: `Both APIs failed. Please enable Places API (New) in Google Cloud Console: ${data.error?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }

      console.log(`Found ${fallbackData.results?.length || 0} places from fallback Text Search API`);

      // Transform fallback results to match expected format
      const transformedFallbackResults = (fallbackData.results || []).map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        vicinity: place.formatted_address || '',
        formatted_phone_number: place.formatted_phone_number,
        opening_hours: place.opening_hours,
        types: place.types || [],
        geometry: place.geometry,
        business_status: place.business_status
      }));

      return NextResponse.json({
        results: transformedFallbackResults,
        status: 'OK',
        fallback_used: true
      });
    }

    console.log(`Found ${data.places?.length || 0} places from Google Places API (New)`);

    // Transform the new API response to match our expected format
    const transformedResults = (data.places || []).map((place: any) => ({
      place_id: place.id,
      name: place.displayName?.text || 'Unknown',
      rating: place.rating || 0,
      user_ratings_total: place.userRatingCount || 0,
      vicinity: place.formattedAddress || '',
      formatted_phone_number: place.nationalPhoneNumber,
      opening_hours: place.currentOpeningHours ? {
        open_now: place.currentOpeningHours.openNow
      } : undefined,
      types: place.types || [],
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0
        }
      },
      business_status: place.businessStatus
    }));

    return NextResponse.json({
      results: transformedResults,
      status: 'OK'
    });

  } catch (error: any) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}