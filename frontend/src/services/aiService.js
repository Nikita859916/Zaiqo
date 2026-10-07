import api from './api.js';
import { resolveActionFromMessage } from '../actions/actionResolver.js';
import { handleZaiqoAction } from '../actions/actionHandlers.js';

/**
 * Process a user message through the authenticated Zai orchestration pipeline.
 *
 * Flow:
 * User Message → Axios api client → Authenticated POST /api/zai/message
 * → Backend Zai Resolver / Action Dispatcher → Domain Services (Recipe / Grocery / Pricing)
 * → Returns structured response with multi-turn sessionId, recipe, groceryItems, and priceComparison.
 *
 * Falls back gracefully to the client-side action resolver if the backend is unreachable.
 *
 * @param {string} userMessage - Text entered by the user
 * @param {Array|Object} [conversationHistory=[]] - Prior chat history or options
 * @param {Object} [options={}] - Optional configuration including sessionId
 * @returns {Promise<Object>} Structured action response
 */
export async function processUserMessage(userMessage, conversationHistory = [], options = {}) {
  const text = String(userMessage || '').trim();
  if (!text) {
    throw new Error('Message cannot be empty.');
  }

  // Extract sessionId if passed in options or conversationHistory
  let sessionId = null;
  if (options && typeof options === 'object' && options.sessionId) {
    sessionId = options.sessionId;
  } else if (
    conversationHistory &&
    typeof conversationHistory === 'object' &&
    !Array.isArray(conversationHistory) &&
    conversationHistory.sessionId
  ) {
    sessionId = conversationHistory.sessionId;
  }

  // Check if user has an active authentication token
  let token = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      token = window.localStorage.getItem('zaiqo_auth_token');
    }
  } catch {
    // Ignore storage read error
  }

  // If token is present, attempt live call to authenticated backend
  if (token) {
    try {
      const payload = { message: text };
      if (sessionId && typeof sessionId === 'string' && sessionId.trim()) {
        payload.sessionId = sessionId.trim();
      }

      const response = await api.post('/zai/message', payload);

      if (response?.data?.success && response.data.data) {
        const data = response.data.data;
        const actionName = data.action || 'GENERAL_QUERY';

        // Construct backward-compatible action payload for UI intent tags
        const resolvedAction = {
          intent: actionName,
          parameters: data.parameters || {},
          message: data.response || data.message || '',
        };
        const actionPayload = handleZaiqoAction(resolvedAction);

        // Extract structured domain results
        const recipe =
          data.recipe ||
          (data.result && typeof data.result === 'object' && data.result.recipe
            ? data.result.recipe
            : null);

        const groceryItems =
          data.groceryItems ||
          (data.result && typeof data.result === 'object' && data.result.groceryItems
            ? data.result.groceryItems
            : null);

        const priceComparison =
          data.priceComparison ||
          (data.result && typeof data.result === 'object' && data.result.priceComparison
            ? data.result.priceComparison
            : null);

        const metadata =
          data.metadata ||
          (data.result && typeof data.result === 'object' && data.result.metadata
            ? data.result.metadata
            : {});

        return {
          success: true,
          sessionId: data.sessionId || sessionId || null,
          intent: actionName,
          action: actionName,
          message: data.response || data.message || 'I have processed your culinary request.',
          parameters: data.parameters || {},
          actionPayload,
          recipe,
          groceryItems: Array.isArray(groceryItems) ? groceryItems : null,
          priceComparison,
          metadata,
        };
      }
    } catch (err) {
      // 401 Unauthorized
      if (err?.response?.status === 401) {
        const authErr = new Error('Your session has expired. Please log in again to continue chatting with Zai.');
        authErr.status = 401;
        throw authErr;
      }

      // 503 Service Unavailable / DB down
      if (err?.response?.status === 503) {
        const serviceErr = new Error(
          err?.response?.data?.message || 'Zai service is temporarily offline for maintenance. Please try again shortly.'
        );
        serviceErr.status = 503;
        throw serviceErr;
      }

      // 400 Bad Request
      if (err?.response?.status === 400 && err?.response?.data?.message) {
        const reqErr = new Error(err.response.data.message);
        reqErr.status = 400;
        throw reqErr;
      }

      // Other backend errors (e.g. 500)
      if (err?.response?.data?.message) {
        const cleanMsg = String(err.response.data.message)
          .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, '[REDACTED]')
          .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[DATABASE]')
          .replace(/key=[a-zA-Z0-9_-]+/gi, '[KEY]');
        throw new Error(cleanMsg);
      }

      // If backend network error, log and fallback to client resolver
      console.warn('[Zai AI Service] Network error contacting backend, falling back to local resolver:', err?.message);
    }
  }

  // Graceful offline fallback / unauthenticated demonstration mode
  await new Promise((resolve) => setTimeout(resolve, 450));
  const resolvedAction = resolveActionFromMessage(text);
  const actionPayload = handleZaiqoAction(resolvedAction);

  return {
    success: true,
    sessionId: sessionId || null,
    intent: resolvedAction.intent,
    action: resolvedAction.intent,
    message: resolvedAction.message,
    parameters: resolvedAction.parameters,
    actionPayload,
    recipe: null,
    groceryItems: null,
    priceComparison: null,
    metadata: { isOfflineFallback: true },
  };
}

/**
 * Legacy wrapper for simple string responses
 */
export async function getZaiMockResponse(userMessage) {
  const result = await processUserMessage(userMessage);
  return result.message;
}

