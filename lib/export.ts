import type { Issue } from '@/types/proofread';

/**
 * Export issues to JSON format
 */
export function exportToJSON(issues: Issue[]): string {
  return JSON.stringify({ issues }, null, 2);
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export issues to CSV format
 * Simple utility function with no heavy dependencies
 */
export function exportToCSV(issues: Issue[]): string {
  // CSV header
  const headers = [
    'line_number',
    'category',
    'severity',
    'description',
    'suggested_fix',
    'confidence',
  ];

  const rows = [headers.join(',')];

  // CSV rows
  for (const issue of issues) {
    const row = [
      issue.line_number.toString(),
      escapeCSV(issue.category),
      escapeCSV(issue.severity),
      escapeCSV(issue.description),
      escapeCSV(issue.suggested_fix),
      issue.confidence.toString(),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Download file with given content and filename
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
