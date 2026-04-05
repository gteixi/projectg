'use server'

import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/require-auth'
import { createServerClient } from '@/lib/supabase'
import { suggestShelfLifeSchema } from '@/lib/validation'
import { z } from 'zod'

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

const aiResponseSchema = z.object({
  hours: z.union([z.number().int().gt(0), z.null()]),
  reasoning: z.string(),
})

async function checkAiRateLimit(userId: string): Promise<string | null> {
  const supabase = await createServerClient()
  const maxDaily = parseInt(process.env.AI_DAILY_LIMIT ?? '50', 10)
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('ai_usage')
    .select('call_count')
    .eq('kitchen_user_id', userId)
    .eq('used_at', today)
    .single()

  if (data && data.call_count >= maxDaily) {
    return `Límit diari de ${maxDaily} suggerències assolit. Torna demà.`
  }
  return null
}

async function incrementAiUsage(userId: string): Promise<void> {
  const supabase = await createServerClient()
  const today = new Date().toISOString().slice(0, 10)

  // Upsert to avoid read-modify-write race condition
  const { error } = await supabase.rpc('increment_ai_usage', {
    p_kitchen_user_id: userId,
    p_date: today,
  })
  // Fallback: if RPC doesn't exist yet, use insert with conflict handling
  if (error) {
    await supabase
      .from('ai_usage')
      .upsert(
        { kitchen_user_id: userId, used_at: today, call_count: 1 },
        { onConflict: 'kitchen_user_id,used_at' }
      )
  }
}

export async function suggestShelfLife(name: string): Promise<SuggestResult> {
  const parsed = suggestShelfLifeSchema.safeParse({ name: name.trim() })
  if (!parsed.success) {
    return { suggestion: null, error: 'Nom massa curt per suggerir caducitat' }
  }

  const session = await requireAuth()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { suggestion: null, error: 'ANTHROPIC_API_KEY no configurada' }
  }

  const rateLimitError = await checkAiRateLimit(session.userId)
  if (rateLimitError) {
    return { suggestion: null, error: rateLimitError }
  }

  try {
    await incrementAiUsage(session.userId)

    // Sanitize: keep letters, numbers, basic punctuation. Strip newlines to prevent prompt injection.
    const sanitized = parsed.data.name
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^\p{L}\p{N}\s.,'-]/gu, '')
      .slice(0, 100)

    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: sanitized }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const text = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
    const jsonParsed = aiResponseSchema.safeParse(JSON.parse(text))

    if (!jsonParsed.success) {
      return { suggestion: null, error: 'Resposta invàlida del model' }
    }

    return { suggestion: jsonParsed.data, error: null }
  } catch {
    return { suggestion: null, error: 'No s\'ha pogut obtenir la suggerència' }
  }
}
