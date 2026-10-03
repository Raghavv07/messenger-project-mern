import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import { io } from "../lib/socket.js";

export async function getUsersForSidebar(req, res, next) {
  try {
    const loggedInUserId = req.user._id;

    // Use User model static method with .lean() for zero-overhead query
    const filteredUsers = await User.getSidebarUsers(loggedInUserId).lean();

    res.status(200).json(filteredUsers);
  } catch (error) {
    next(error);
  }
}

export async function getConversationsForSidebar(req, res, next) {
  try {
    const loggedInUserId = req.user._id;

    // Use Message model static aggregation method
    const conversations = await Message.getConversations(loggedInUserId);

    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
}

export async function getMessages(req, res, next) {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(userToChatId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Use Message model static method for chat history
    const messages = await Message.getChatBetweenUsers(myId, userToChatId).lean();

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid recipient ID format" });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot send messages to yourself" });
    }

    const trimmedText = typeof text === "string" ? text.trim() : "";
    if (!trimmedText && !req.file) {
      return res.status(400).json({ message: "Message text or media is required" });
    }

    let imageUrl;
    let videoUrl;

    if (req.file) {
      if (!hasImageKitConfig()) {
        return res.status(503).json({ message: "Media upload service is not configured" });
      }

      const url = await uploadChatMedia(req.file);
      if (req.file.mimetype.startsWith("video/")) {
        videoUrl = url;
      } else {
        imageUrl = url;
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: trimmedText || undefined,
      image: imageUrl,
      video: videoUrl,
    });

    await newMessage.save();

    // Real-time notification via Socket.io (emits to all active tabs/devices for this recipient)
    io.to(String(receiverId)).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
}
