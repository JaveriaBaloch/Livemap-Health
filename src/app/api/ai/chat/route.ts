import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are MediBot, a helpful AI health assistant inside the LiveMap Emergency app. Your role:

1. Answer general health & first-aid questions in a clear, calm tone.
2. You are NOT a doctor. Always remind users you cannot diagnose or prescribe medication.
3. If symptoms sound serious or life-threatening (chest pain, difficulty breathing, severe bleeding, stroke signs, allergic reactions, loss of consciousness), immediately recommend using the SOS feature. Respond with the exact tag [ACTION:SOS] somewhere in your message so the app can show the SOS button.
4. If the user asks to find a doctor, specialist, or hospital nearby, respond with [ACTION:FIND_DOCTORS] so the app can show the search button.
5. If the user asks to find a pharmacy, respond with [ACTION:FIND_PHARMACY] so the app can show the pharmacy search button.
6. Keep responses concise (2-4 sentences max for simple questions, up to 6 for complex ones).
7. Use simple language. Avoid medical jargon unless explaining it.
8. Never provide specific drug dosages. Suggest consulting a doctor or pharmacist instead.
9. Be empathetic and reassuring.
10. If unsure, say so honestly and recommend professional consultation.

You can understand and respond in any language the user writes in.`;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured. Please add GEMINI_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    const { messages, userLocation } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // Build conversation for Gemini
    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Add location context to the system instruction if available
    let systemInstruction = SYSTEM_PROMPT;
    if (userLocation?.lat && userLocation?.lng) {
      systemInstruction += `\n\nThe user's current location is approximately: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}. You can reference this if they ask about nearby services.`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 512,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", response.status, errorData);
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't process that. Please try again.";

    // Parse action tags
    const actions: string[] = [];
    if (text.includes("[ACTION:SOS]")) actions.push("SOS");
    if (text.includes("[ACTION:FIND_DOCTORS]")) actions.push("FIND_DOCTORS");
    if (text.includes("[ACTION:FIND_PHARMACY]")) actions.push("FIND_PHARMACY");

    // Clean tags from displayed text
    const cleanText = text
      .replace(/\[ACTION:SOS\]/g, "")
      .replace(/\[ACTION:FIND_DOCTORS\]/g, "")
      .replace(/\[ACTION:FIND_PHARMACY\]/g, "")
      .trim();

    return NextResponse.json({ message: cleanText, actions });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}