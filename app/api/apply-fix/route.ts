import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { Issue } from '@/types/proofread';

export const runtime = 'nodejs';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ApplyFixRequest {
  lineText: string;
  issue: Issue;
}

/**
 * Use AI agent to apply a fix to a line of text
 */
export async function POST(request: NextRequest) {
  try {
    const body: ApplyFixRequest = await request.json();
    const { lineText, issue } = body;

    if (!lineText || !issue) {
      return NextResponse.json(
        { error: 'lineText and issue are required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a text correction assistant. Your task is to apply a specific fix to a line of text.

CRITICAL RULES:
1. Apply ONLY the specific fix requested - do not make any other changes
2. Preserve all original whitespace (leading and trailing spaces)
3. Do not rewrite or paraphrase the text
4. Only modify what is necessary to apply the fix
5. Return ONLY the corrected line text, nothing else

The fix should be applied exactly as specified in the issue description and suggested fix.`;

    const userPrompt = `Please apply the following fix to this line of text.

Line text: "${lineText}"

Issue description: ${issue.description}
Suggested fix: ${issue.suggested_fix}
Category: ${issue.category}

Return ONLY the corrected line text. Do not include any explanation or additional text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for faster/cheaper responses
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Very low temperature for deterministic output
      max_tokens: 500,
    });

    const correctedLine = completion.choices[0]?.message?.content?.trim();
    if (!correctedLine) {
      throw new Error('No corrected line returned from AI');
    }

    return NextResponse.json({ correctedLine });
  } catch (error) {
    console.error('Apply fix API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'An error occurred while applying the fix'
      },
      { status: 500 }
    );
  }
}


