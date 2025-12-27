export type IssueCategory = 
  | 'punctuation' 
  | 'capitalization' 
  | 'spelling' 
  | 'speaker_formatting';

export type Severity = 
  | 'blocking' 
  | 'review' 
  | 'info';

export interface Issue {
  line_number: number;
  category: IssueCategory;
  severity: Severity;
  description: string;
  suggested_fix: string;
  confidence: number;
}

export interface ProofreadResponse {
  issues: Issue[];
}

export interface ProofreadRequest {
  transcript: string;
}

export interface InputValidationError {
  error: string;
  max_lines?: number;
  max_chars?: number;
  current_lines?: number;
  current_chars?: number;
}
