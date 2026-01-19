import Anthropic from '@anthropic-ai/sdk'

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeResponse {
  content: string
  inputTokens: number
  outputTokens: number
}

// Call Claude API with retry logic
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

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })

      // Extract text content
      const textContent = response.content.find(block => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response')
      }

      return {
        content: textContent.text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on auth errors or invalid requests
      if (error instanceof Anthropic.APIError) {
        if (error.status === 401 || error.status === 400) {
          throw error
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error('Claude API call failed')
}

// Parse JSON from Claude response (handles markdown code blocks)
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
