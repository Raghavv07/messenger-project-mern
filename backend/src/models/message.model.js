import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver ID is required"],
    },
    text: {
      type: String,
      trim: true,
      maxLength: [5000, "Message cannot exceed 5000 characters"],
    },
    image: {
      type: String,
      trim: true,
    },
    video: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes for scalable query performance (fetching chat history and conversation lists)
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });

/**
 * Model Static Method: Get chat history between two users sorted by creation time
 */
messageSchema.statics.getChatBetweenUsers = function (userA, userB) {
  return this.find({
    $or: [
      { senderId: userA, receiverId: userB },
      { senderId: userB, receiverId: userA },
    ],
  }).sort({ createdAt: 1 });
};

/**
 * Model Static Method: Aggregate conversations for the sidebar
 */
messageSchema.statics.getConversations = function (userId) {
  const targetId = userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId);

  return this.aggregate([
    // 1. Filter messages sent or received by this user
    { $match: { $or: [{ senderId: targetId }, { receiverId: targetId }] } },
    // 2. Group by chat partner, capturing the most recent message timestamp
    {
      $group: {
        _id: { $cond: [{ $eq: ["$senderId", targetId] }, "$receiverId", "$senderId"] },
        lastMessageAt: { $max: "$createdAt" },
      },
    },
    // 3. Sort by most recent conversation first
    { $sort: { lastMessageAt: -1 } },
    // 4. Lookup user details
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    // 5. Ensure user exists (safely filters out deleted users)
    { $match: { "user.0": { $exists: true } } },
    // 6. Unpack user document
    { $replaceRoot: { newRoot: { $first: "$user" } } },
    // 7. Exclude internal clerkId
    { $project: { clerkId: 0 } },
  ]);
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
