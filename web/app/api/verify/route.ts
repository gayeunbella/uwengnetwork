import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
      {
        text: `Analyze this image. Determine if it is a valid University of Waterloo WatCard (student ID card).

Check for:
1. Is this a WatCard (University of Waterloo student ID)?
2. Does it belong to the Faculty of Engineering?
3. Extract the student's full name as shown on the card.
4. Extract the student ID number shown on the card.

Respond in JSON format only:
{
  "isWatCard": true/false,
  "isEngineering": true/false,
  "faculty": "detected faculty name or null",
  "name": "full name from card or null",
  "studentId": "student ID number from card or null",
  "confidence": "high" | "medium" | "low",
  "reason": "brief explanation"
}`,
      },
    ]);

    const text = result.response.text();
    // Extract JSON from the response (strip markdown code fences if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
