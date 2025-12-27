# Transcript Proofreading Agent

A verbatim-safe transcript proofreading application built with Next.js. This tool detects and explains issues in transcripts while keeping the original text unchanged.

## Features

- **Verbatim-safe**: Never rewrites or modifies your transcript text
- **Line-anchored issues**: Issues are linked to specific line numbers
- **Issue categories**: Detects punctuation, capitalization, spelling, and speaker formatting issues
- **Severity levels**: Issues are classified as blocking, review, or info
- **Export**: Export issues as JSON or CSV
- **Real-time analysis**: Uses OpenAI's structured outputs API for accurate issue detection

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js (for API routes)
- **AI**: OpenAI Node SDK with Structured Outputs (JSON Schema)
- **Validation**: Zod for runtime validation
- **UI**: Tailwind CSS, shadcn/ui, lucide-react
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Proofreading_agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Paste your transcript text into the input area
2. Click "Proofread Transcript" to analyze
3. Review issues in the Issues List (grouped by category, ordered by severity)
4. Click on an issue to view details and see the original line
5. Click on a line in the transcript viewer to navigate to issues on that line
6. Export issues as JSON or CSV using the export buttons

## Input Limits

- Maximum lines: 1,000
- Maximum characters: 120,000

These limits are enforced server-side to protect cost and stability.

## Acceptance Criteria

This application adheres to strict verbatim safety requirements:

- ✅ Transcript text remains byte-identical before/after analysis
- ✅ API/UI never outputs rewritten transcript text
- ✅ App never applies edits automatically
- ✅ All AI output validated via Zod schema
- ✅ Issues validated for valid line numbers
- ✅ Duplicate issues removed
- ✅ Suggested fixes are minimal (≤1 sentence)
- ✅ Lines with issues are highlighted
- ✅ Issues ordered by severity (blocking → review → info)
- ✅ Clicking issues scrolls to the referenced line

## Deployment

### Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
3. Set the `OPENAI_API_KEY` environment variable
4. Deploy

The application is configured to use Node.js runtime for API routes.

## License

MIT
