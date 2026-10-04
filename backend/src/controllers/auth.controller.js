import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const JWT_SECRET =
  process.env.GUEST_JWT_SECRET ||
  process.env.CLERK_SECRET_KEY ||
  "messenger_default_guest_secret_key_2026";

export async function checkAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.status(200).json(req.user);
}

/**
 * Handle Guest User Login / Account Creation
 * Allows users to instantly chat without requiring Clerk registration.
 */
export async function guestLogin(req, res, next) {
  try {
    const rawName = req.body?.fullName || req.body?.name || "";
    const fullName = String(rawName).trim();

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters long." });
    }

    if (fullName.length > 50) {
      return res.status(400).json({ message: "Name must not exceed 50 characters." });
    }

    // Generate unique guest credentials compliant with User model constraints
    const guestId = "guest_" + crypto.randomUUID();
    const guestEmail = `guest_${Date.now()}_${crypto.randomBytes(4).toString("hex")}@guest.local`;
    const profilePic = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`;

    const user = await User.create({
      clerkId: guestId,
      email: guestEmail,
      fullName,
      profilePic,
      isGuest: true,
    });

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        isGuest: true,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        isGuest: true,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

