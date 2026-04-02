'use server'

import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/require-auth'

interface ShelfLifeSuggestion {
  hours: number | null
  reasoning: string
}

interface SuggestResult {
  suggestion: ShelfLifeSuggestion | null
  error: string | null
}

const SYSTEM_PROMPT = `You are a food safety expert specializing in HACCP (APPCC) regulations for professional kitchens in the European Union.

Given a preparation name, return the recommended maximum shelf life in hours when stored refrigerated at 0-4°C, following EU food safety regulations.

Rules:
- Return ONLY a JSON object: {"hours": <integer>, "reasoning": "<one sentence in Catalan>"}
- Base your answer on EU Regulation 852/2004 and standard HACCP guidelines
- If the preparation contains multiple ingredients, use the shortest shelf life
- If you cannot determine a safe shelf life with confidence, return {"hours": null, "reasoning": "<explanation in Catalan>"}
- Be conservative — when in doubt, use the shorter estimate
- Do not return markdown, code blocks, or any text outside the JSON object`

// --- Daily rate limiter (in-memory, resets on server restart) ---
let dailyCalls = 0
let dailyResetDate = new Date().toDateString()

function checkRateLimit(): string | null {
  const today = new Date().toDateString()
  if (today !== dailyResetDate) {
    dailyCalls = 0
    dailyResetDate = today
  }
  const maxDaily = parseInt(process.env.AI_DAILY_LIMIT ?? '50', 10)
  if (dailyCalls >= maxDaily) {
    return `Límit diari de ${maxDaily} suggerències assolit. Torna demà.`
  }
  return null
}

export async function suggestShelfLife(name: string): Promise<SuggestResult> {
  await requireAuth()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { suggestion: null, error: 'ANTHROPIC_API_KEY no configurada' }
  }

  const trimmed = name.trim()
  if (trimmed.length < 2) {
    return { suggestion: null, error: 'Nom massa curt per suggerir caducitat' }
  }

  const rateLimitError = checkRateLimit()
  if (rateLimitError) {
    return { suggestion: null, error: rateLimitError }
  }

  try {
    dailyCalls++

    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: trimmed }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const text = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
    const parsed: ShelfLifeSuggestion = JSON.parse(text)

    if (parsed.hours !== null && (typeof parsed.hours !== 'number' || parsed.hours <= 0)) {
      return { suggestion: null, error: 'Resposta invàlida del model' }
    }

    return { suggestion: parsed, error: null }
  } catch {
    return { suggestion: null, error: 'No s\'ha pogut obtenir la suggerència' }
  }
}
