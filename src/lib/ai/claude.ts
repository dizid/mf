// AI client using xAI/Grok API (OpenAI-compatible)

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions'

export interface ClaudeResponse {
  content: string
  inputTokens: number
  outputTokens: number
}

// Call xAI/Grok API with retry logic
export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options: {
    maxTokens?: number
    temperature?: number
    retries?: number
  } = {}
): Promise<ClaudeResponse> {
  const { maxTokens = 2000, temperature = 0.3, retries = 2 } = options

  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set')
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(XAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4-fast-reasoning',
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`xAI API error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      // Extract content from OpenAI-compatible response
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('No content in response')
      }

      return {
        content,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on auth errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error('xAI API call failed')
}

// Parse JSON from response (handles markdown code blocks)
export function parseJsonResponse<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim()

  // Handle ```json ... ``` format
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim()
  }

  try {
    return JSON.parse(cleaned)
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
