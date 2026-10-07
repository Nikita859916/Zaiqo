import mongoose from 'mongoose';
import ZaiConversation from '../models/zaiConversation.model.js';
import { badRequest, notFound } from '../utils/apiError.js';

const MAX_STORED_MESSAGES = 50;

/**
 * Helper class representing an in-memory conversation document
 * used when MongoDB connection is not active (e.g. in test suite).
 */
class InMemoryConversationDoc {
  constructor(userId, id = null) {
    this._id = id ? (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id) : new mongoose.Types.ObjectId();
    this.user = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    this.messages = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    this.updatedAt = new Date();
    if (this.messages.length > MAX_STORED_MESSAGES) {
      this.messages = this.messages.slice(-MAX_STORED_MESSAGES);
    }
    return this;
  }

  toJSON() {
    return {
      id: this._id,
      user: this.user,
      messages: this.messages,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Service to manage Zai conversation persistence and session memory.
 * The ONLY layer responsible for conversation storage and retrieval.
 */
class ZaiConversationService {
  constructor() {
    this.memoryStore = new Map();
    this.forceFailure = false;
  }

  /**
   * Test hook to simulate database persistence failures
   * @param {boolean} flag
   */
  setForceFailure(flag) {
    this.forceFailure = flag;
  }

  /**
   * Reset in-memory conversation cache (useful for test isolation)
   */
  clearMemoryStore() {
    this.memoryStore.clear();
  }

  /**
   * Create a new conversation session for an authenticated user
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<ZaiConversation|InMemoryConversationDoc>}
   */
  async createConversation(userId) {
    if (!userId) {
      throw badRequest('Authenticated user ID is required.');
    }

    if (this.forceFailure) {
      throw new Error('Database persistence failure during conversation creation.');
    }

    if (mongoose.connection.readyState === 1) {
      const doc = await ZaiConversation.create({
        user: userId,
        messages: [],
      });
      return doc;
    }

    const doc = new InMemoryConversationDoc(userId);
    this.memoryStore.set(doc._id.toString(), doc);
    return doc;
  }

  /**
   * Retrieve an existing conversation session strictly scoped to the authenticated user
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} sessionId
   * @returns {Promise<ZaiConversation|InMemoryConversationDoc|null>}
   */
  async getConversation(userId, sessionId) {
    if (!userId) {
      throw badRequest('Authenticated user ID is required.');
    }

    if (!sessionId || typeof sessionId !== 'string') {
      throw badRequest('Invalid session ID format.');
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw badRequest('Invalid session ID format.');
    }

    if (this.forceFailure) {
      throw new Error('Database query failure during conversation retrieval.');
    }

    if (mongoose.connection.readyState === 1) {
      return ZaiConversation.findOne({
        _id: sessionId,
        user: userId,
      });
    }

    const doc = this.memoryStore.get(sessionId.toString());
    if (!doc) {
      return null;
    }

    // Strictly enforce authenticated user ownership
    if (doc.user.toString() !== userId.toString()) {
      return null;
    }

    return doc;
  }

  /**
   * Retrieve an existing conversation or create a new one if sessionId is omitted.
   * If a sessionId is provided but not found for the authenticated user, throws 404.
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string|null} [sessionId]
   * @returns {Promise<ZaiConversation|InMemoryConversationDoc>}
   */
  async getOrCreateConversation(userId, sessionId = null) {
    if (!userId) {
      throw badRequest('Authenticated user ID is required.');
    }

    if (sessionId) {
      const existing = await this.getConversation(userId, sessionId);
      if (!existing) {
        throw notFound('Conversation session not found.');
      }
      return existing;
    }

    return this.createConversation(userId);
  }

  /**
   * Retrieve the most recent message turns from a conversation session
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} sessionId
   * @param {number} [limit=6]
   * @returns {Promise<Array<Object>>}
   */
  async getRecentMessages(userId, sessionId, limit = 6) {
    const conversation = await this.getConversation(userId, sessionId);
    if (!conversation) {
      throw notFound('Conversation session not found.');
    }

    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const boundedLimit = typeof limit === 'number' && limit > 0 ? limit : 6;
    return messages.slice(-boundedLimit);
  }

  /**
   * Append new message turns to an existing conversation session
   * Enforces max 50 stored messages per session, pruning oldest when exceeded.
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string|mongoose.Types.ObjectId} sessionId
   * @param {Array<Object>} turns
   * @returns {Promise<ZaiConversation|InMemoryConversationDoc>}
   */
  async appendTurns(userId, sessionId, turns) {
    if (!userId) {
      throw badRequest('Authenticated user ID is required.');
    }

    if (!Array.isArray(turns) || turns.length === 0) {
      throw badRequest('Turns array must not be empty.');
    }

    if (this.forceFailure) {
      throw new Error('Database persistence failure during message append.');
    }

    const sessionIdStr = sessionId ? sessionId.toString() : null;
    const conversation = await this.getConversation(userId, sessionIdStr);
    if (!conversation) {
      throw notFound('Conversation session not found.');
    }

    const sanitizedTurns = turns.map((turn) => {
      if (!turn || typeof turn !== 'object') {
        throw badRequest('Turn must be an object.');
      }

      if (!['user', 'assistant'].includes(turn.role)) {
        throw badRequest(`Invalid turn role: ${turn.role}. Must be 'user' or 'assistant'.`);
      }

      if (!turn.content || typeof turn.content !== 'string' || turn.content.trim().length === 0) {
        throw badRequest('Turn content is required and cannot be empty.');
      }

      return {
        role: turn.role,
        content: turn.content.trim(),
        action: typeof turn.action === 'string' ? turn.action : null,
        parameters:
          turn.parameters && typeof turn.parameters === 'object' && !Array.isArray(turn.parameters)
            ? turn.parameters
            : {},
        timestamp: turn.timestamp instanceof Date ? turn.timestamp : new Date(),
      };
    });

    conversation.messages.push(...sanitizedTurns);

    // Enforce 50-message boundary (retain newest 50, prune oldest)
    if (conversation.messages.length > MAX_STORED_MESSAGES) {
      conversation.messages = conversation.messages.slice(-MAX_STORED_MESSAGES);
    }

    await conversation.save();

    // If using in-memory store, update the map
    if (mongoose.connection.readyState !== 1) {
      this.memoryStore.set(conversation._id.toString(), conversation);
    }

    return conversation;
  }
}

const zaiConversationService = new ZaiConversationService();
export default zaiConversationService;
