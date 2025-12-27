import OpenAI from 'openai';
import { proofreadResponseSchema } from './schemas';
import type { ProofreadResponse } from '@/types/proofread';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * JSON Schema for OpenAI structured output
 */
const issueJsonSchema = {
  type: 'object',
  properties: {
    line_number: {
      type: 'number',
      description: '1-based line number where the issue occurs',
    },
    category: {
      type: 'string',
      enum: ['punctuation', 'capitalization', 'spelling', 'speaker_formatting'],
      description: 'Category of the issue',
    },
    severity: {
      type: 'string',
      enum: ['blocking', 'review', 'info'],
      description: 'Severity level of the issue',
    },
    description: {
      type: 'string',
      description: 'Brief description of the issue',
    },
    suggested_fix: {
      type: 'string',
      description: 'Minimal suggested fix (≤1 sentence, instructional only, not a rewrite)',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Confidence score from 0 to 1',
    },
  },
  required: ['line_number', 'category', 'severity', 'description', 'suggested_fix', 'confidence'],
  additionalProperties: false,
} as const;

const responseJsonSchema = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: issueJsonSchema,
      description: 'Array of detected issues',
    },
  },
  required: ['issues'],
  additionalProperties: false,
} as const;

/**
 * Proofread transcript using OpenAI structured outputs
 */
export async function proofreadTranscript(transcript: string): Promise<ProofreadResponse> {
  const systemPrompt = `You are a transcript proofreading assistant. Your task is to detect and report issues in transcripts WITHOUT rewriting or modifying the original text.

CRITICAL RULES:
1. NEVER rewrite or paraphrase the transcript text
2. ONLY detect issues in: punctuation, capitalization, spelling, and speaker/turn formatting (Q/A labels)
3. Provide minimal suggested fixes (≤1 sentence, instructional only)
4. Return issues with accurate line numbers (1-based)
5. Suggested fixes must be minimal instructions, not rewrites

Focus on:
- Punctuation errors (missing periods, commas, quotation marks, etc.)
- Capitalization errors (proper nouns, sentence starts, etc.)
- Spelling errors (misspelled words)
- Speaker/turn formatting issues (inconsistent Q/A labels, speaker labels, etc.)

For each issue, provide:
- line_number: The line where the issue occurs (1-based)
- category: One of the four categories above
- severity: "blocking" (critical errors), "review" (should be reviewed), or "info" (minor suggestions)
- description: Brief description of the issue
- suggested_fix: Minimal instruction for fixing (e.g., "Add period at end" not "Change to: ...")
- confidence: Your confidence level (0-1)`;

  const userPrompt = `Please proofread the following transcript and identify any issues. Return only the issues found, with accurate line numbers.

Transcript:
${transcript}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'proofread_response',
          strict: true,
          schema: responseJsonSchema,
        },
      },
      temperature: 0.3, // Lower temperature for more consistent, focused output
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse and validate response
    const parsed = JSON.parse(content);
    const validated = proofreadResponseSchema.parse(parsed);

    return validated;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw new Error('Unknown error during OpenAI API call');
  }
}
