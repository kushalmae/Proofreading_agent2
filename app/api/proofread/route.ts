import { NextRequest, NextResponse } from 'next/server';
import { proofreadTranscript } from '@/lib/openai';
import { validateInput, deduplicateIssues, validateLineNumbers, enforceFixConstraints } from '@/lib/validation';
import { proofreadResponseSchema } from '@/lib/schemas';
import type { ProofreadRequest, Issue } from '@/types/proofread';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ProofreadRequest = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript text is required' },
        { status: 400 }
      );
    }

    // Validate input limits (AC-L1)
    const validation = validateInput(transcript);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          max_lines: 1000,
          max_chars: 120000,
          current_lines: validation.lines,
          current_chars: validation.chars,
        },
        { status: 400 }
      );
    }

    // Split transcript into lines (preserve original text exactly)
    const lines = transcript.split('\n');
    const totalLines = lines.length;

    // Call OpenAI API
    const response = await proofreadTranscript(transcript);

    // Validate response with Zod schema (AC-O1)
    let validatedResponse;
    try {
      validatedResponse = proofreadResponseSchema.parse(response);
    } catch (error) {
      console.error('Zod validation error:', error);
      return NextResponse.json(
        { error: 'Invalid response format from AI service' },
        { status: 500 }
      );
    }

    // Filter invalid line numbers (AC-O2)
    let issues = validateLineNumbers(validatedResponse.issues, totalLines);

    // Deduplicate issues (AC-O3)
    issues = deduplicateIssues(issues);

    // Enforce fix constraints (AC-F1, AC-F2)
    issues = issues.map((issue: Issue) => ({
      ...issue,
      suggested_fix: enforceFixConstraints(issue.suggested_fix),
    }));

    // Return response with validated and deduplicated issues
    return NextResponse.json({
      issues,
      totalLines,
    });
  } catch (error) {
    console.error('Proofread API error:', error);
    
    // Return user-friendly error message (AC-E3)
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred during proofreading';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
