# Sample Transcripts

This directory contains sample transcript files for testing the proofreading application.

## Files

### `sample-transcript.txt`
A basic transcript with intentional errors including:
- Missing punctuation (question marks, periods, commas)
- Capitalization errors (proper nouns like "smith", "main street", "march")
- Inconsistent speaker formatting

**Issues to detect:**
- Line 1: Missing question mark, missing comma
- Line 2: "smith" should be "Smith"
- Line 3: "Smith" (correct), "main street" should be "Main Street"
- Line 4: Missing question mark
- Line 6: "main street" should be "Main Street"
- Line 7: Missing question mark
- Line 9: Missing question mark
- Line 10: Missing period at end
- Line 11: Missing question mark, "march" should be "March"
- Line 12: Missing question mark
- Line 13: "michael Johnson" should be "Michael Johnson"
- Line 14: Missing question mark
- Line 16: Missing period at end

### `sample-transcript-clean.txt`
The same transcript but with all errors corrected. Use this for reference or to verify the proofreading tool is working correctly.

### `sample-transcript-complex.txt`
A more complex transcript with:
- Different speaker labels (INTERVIEWER/SUBJECT instead of Q/A)
- Medical/technical terminology
- More varied punctuation needs
- Additional capitalization requirements (titles like "dr.", "Dr Williams")
- More complex sentence structures

**Issues to detect:**
- Line 1: "todays" should be "today's", missing period
- Line 2: "dr." should be "Dr.", missing period at end
- Line 3: "thank you" should be "Thank you", "Dr Williams" should be "Dr. Williams", missing question mark
- Line 4: Missing period at end
- Line 5: Missing question mark
- Line 6: Missing period at end
- Line 7: Missing question mark
- Line 8: Missing period at end
- Line 9: Missing question mark
- Line 10: Missing period at end
- Line 11: Missing question mark
- Line 12: Missing period at end
- Line 13: Missing question mark
- Line 14: Missing period at end

## Usage

1. Copy the content from any sample file
2. Paste it into the Transcript Proofreading Agent
3. Click "Proofread Transcript"
4. Review the detected issues

These samples are designed to help test:
- Punctuation detection
- Capitalization correction
- Spelling verification
- Speaker/turn formatting consistency

