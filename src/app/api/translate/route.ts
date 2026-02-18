typescript
import { NextResponse } from 'next/server';
import { LpuCopilot } from '@groq/lpu-copilot';

const token = process.env.COPILOT_TOKEN;

// Initialize copilot only if a real token is provided
const copilot = token && token !== 'YOUR_COPILOT_TOKEN' ? new LpuCopilot({ token }) : null;

export const dynamic = 'force-static';

export async function POST(request: Request) {
  try {
    const { content, targetLanguage, type } = await request.json();

    // Basic validation
    if (!content || !targetLanguage || !type) {
      return NextResponse.json(
        { error: 'content, targetLanguage, and type are required.' },
        { status: 400 }
      );
    }

    const validTypes = ['flashcards', 'summary', 'quiz', 'notes'] as const;
    if (!validTypes.includes(type as any)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Prompt for the LPU copilot
    const prompt = `
      Translate the following ${type} content into ${targetLanguage} while:
      1. Translating naturally (not word‑by‑word)
      2. Adapting cultural references and examples to the target language context
      3. Maintaining full educational accuracy
      4. Keeping any [Source: ...] citation tags exactly as they appear.

      Content:
      ${content}
    `;

    // If we have a real copilot instance, call it; otherwise return a mock response
    let translatedContent: string;
    if (copilot) {
      translatedContent = await copilot.chat(prompt);
    } else {
      // Mock response – simply echo the request with a note that this is a placeholder
      translatedContent = `[Mock translation to ${targetLanguage} for ${type}]\n${content}`;
    }

    return NextResponse.json({ translatedContent });
  } catch (err) {
    console.error('Translation API error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}