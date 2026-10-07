import mongoose from 'mongoose';
import zaiActionService from '../services/zaiAction.service.js';
import { badRequest, unauthorized, ApiError } from '../utils/apiError.js';

/**
 * Handle incoming user messages for the Zai orchestration layer
 * POST /api/zai/message
 */
export const handleZaiMessage = async (req, res, next) => {
  try {
    // 1. Authenticate user presence
    if (!req.user || !req.user._id) {
      return next(unauthorized('Authentication required to message Zai.'));
    }

    // 2. Validate request body
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return next(badRequest('Request body must be a valid JSON object.'));
    }

    const { message, sessionId } = req.body;

    if (message === undefined || message === null) {
      return next(badRequest('Message is required.'));
    }

    if (typeof message !== 'string') {
      return next(badRequest('Message must be a string.'));
    }

    if (message.trim().length === 0) {
      return next(badRequest('Message cannot be empty.'));
    }

    // Validate optional sessionId format
    if (sessionId !== undefined && sessionId !== null) {
      if (typeof sessionId !== 'string') {
        return next(badRequest('Session ID must be a string.'));
      }
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return next(badRequest('Invalid session ID format.'));
      }
    }

    // 3. Database connection availability check
    if (mongoose.connection.readyState !== 1) {
      return next(
        new ApiError(
          503,
          'Database service is currently unavailable. Please verify MONGODB_URI configuration.'
        )
      );
    }

    // 4. Delegate to ZaiActionService orchestrator with session support
    const result = await zaiActionService.processMessage(req.user._id, message, sessionId);

    // 5. Return structured response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
