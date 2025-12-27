import { z } from 'zod';
import type { IssueCategory, Severity } from '@/types/proofread';

export const issueCategorySchema = z.enum([
  'punctuation',
  'capitalization',
  'spelling',
  'speaker_formatting'
]);

export const severitySchema = z.enum([
  'blocking',
  'review',
  'info'
]);

export const issueSchema = z.object({
  line_number: z.number().int().positive(),
  category: issueCategorySchema,
  severity: severitySchema,
  description: z.string().min(1),
  suggested_fix: z.string().min(1).max(200), // Approximate max for 1 sentence
  confidence: z.number().min(0).max(1),
});

export const proofreadResponseSchema = z.object({
  issues: z.array(issueSchema),
});

export type IssueSchema = z.infer<typeof issueSchema>;
export type ProofreadResponseSchema = z.infer<typeof proofreadResponseSchema>;

// Input validation constants
export const MAX_LINES = 1000;
export const MAX_CHARS = 120000;
