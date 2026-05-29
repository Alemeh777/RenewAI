import { tavily } from "@tavily/core";
import { NextRequest, NextResponse } from "next/server";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export async function POST(req: NextRequest) {
  const { company, domain } = await req.json();

  if (!company) {
    return NextResponse.json({ error: "Company required" }, { status: 400 });
  }

  try {
    const result = await client.search(
      `${company} company news 2025 2026`,
      {
        searchDepth: "basic",
        maxResults: 3,
        includeAnswer: true,
      }
    );

    const news = result.answer || 
      result.results?.[0]?.content?.substring(0, 200) || 
      "No recent news found.";

    return NextResponse.json({ news });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}