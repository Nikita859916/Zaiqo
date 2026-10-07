/**
 * Zai AI Service & Action Pipeline
 * 
 * Pipeline architecture:
 * User message
 * → (Future: Gemini API / LLM)
 * → structured intent/action JSON
 * → Zaiqo action handler
 * → appropriate feature/component
 * 
 * Currently uses a modular action resolver to test the pipeline.
 */

import { resolveActionFromMessage } from '../actions/actionResolver.js';
import { handleZaiqoAction } from '../actions/actionHandlers.js';

/**
 * Process a user message through the intent/action pipeline.
 * Later, this function will call Gemini API with a system prompt and structured schema.
 * 
 * @param {string} userMessage - Text entered by the user
 * @param {Array} conversationHistory - Full prior chat history for context
 * @returns {Promise<Object>} Structured action response
 */
export async function processUserMessage(userMessage, conversationHistory = []) {
  // Simulate network / AI inference latency (650ms)
  await new Promise((resolve) => setTimeout(resolve, 650));

  // Step 1: Resolve structured action intent and parameters
  // (In future: this step is replaced by Gemini structured JSON generation)
  const resolvedAction = resolveActionFromMessage(userMessage);

  // Step 2: Route through Zaiqo Action Handler registry
  const actionPayload = handleZaiqoAction(resolvedAction);

  // Step 3: Return clean structured result
  return {
    intent: resolvedAction.intent,
    message: resolvedAction.message,
    parameters: resolvedAction.parameters,
    actionPayload,
  };
}

/**
 * Legacy wrapper for simple string responses
 */
export async function getZaiMockResponse(userMessage) {
  const result = await processUserMessage(userMessage);
  return result.message;
}
