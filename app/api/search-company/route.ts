import { tavily } from "@tavily/core";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { company, domain } = await req.json();

  if (!company) {
    return NextResponse.json({ error: "Company required" }, { status: 400 });
  }

  try {
    // Run 3 searches in parallel for richer data
    const [newsResult, companyResult, techResult] = await Promise.all([
      client.search(`${company} news funding announcement 2025 2026`, {
        searchDepth: "basic",
        maxResults: 3,
        includeAnswer: true,
      }),
      client.search(`${company} company size industry employees revenue`, {
        searchDepth: "basic",
        maxResults: 3,
        includeAnswer: true,
      }),
      client.search(`${company} tech stack software tools CRM ERP`, {
        searchDepth: "basic",
        maxResults: 2,
        includeAnswer: true,
      }),
    ]);

    // Combine all raw content
    const rawContent = [
      newsResult.answer || newsResult.results?.[0]?.content || '',
      companyResult.answer || companyResult.results?.[0]?.content || '',
      techResult.answer || techResult.results?.[0]?.content || '',
    ].join('\n\n');

    // Use Claude to extract structured intel
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a customer intelligence analyst. Extract key facts about a company from search results.
      
Always respond with valid JSON only, no markdown:
{
  "latest_news": "one sentence summary of most recent news",
  "intel": ["fact 1", "fact 2", "fact 3"],
  "industry": "industry name",
  "company_size": "small/medium/large/enterprise",
  "upsell_hints": ["potential upsell 1", "potential upsell 2"]
}

Keep each intel item under 15 words. Focus on facts useful for a renewal conversation.`,
      messages: [{
        role: 'user',
        content: `Company: ${company}\nDomain: ${domain || 'unknown'}\n\nSearch results:\n${rawContent}\n\nExtract customer intelligence.`
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsed = JSON.parse(clean);
      return NextResponse.json({
        news: parsed.latest_news || 'No recent news found.',
        intel: parsed.intel || [],
        industry: parsed.industry || '',
        company_size: parsed.company_size || '',
        upsell_hints: parsed.upsell_hints || [],
      });
    } catch {
      return NextResponse.json({ 
        news: newsResult.answer || 'No recent news found.',
        intel: [],
        industry: '',
        company_size: '',
        upsell_hints: [],
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}