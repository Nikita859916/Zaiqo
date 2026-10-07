import mongoose from 'mongoose';

/**
 * Embedded message turn schema within a conversation
 */
const messageTurnSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: {
        values: ['user', 'assistant'],
        message: '{VALUE} is not a valid message role. Allowed roles are "user" or "assistant".',
      },
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    action: {
      type: String,
      default: null,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Zai Conversation Schema
 * Represents a multi-turn conversation session scoped strictly to an authenticated user.
 */
const zaiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    messages: {
      type: [messageTurnSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for retrieving a user's conversations ordered by most recent activity
zaiConversationSchema.index({ user: 1, updatedAt: -1 });

const ZaiConversation = mongoose.model('ZaiConversation', zaiConversationSchema);

export default ZaiConversation;
