import { getAuth, clerkClient } from "@clerk/express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const JWT_SECRET =
  process.env.GUEST_JWT_SECRET ||
  process.env.CLERK_SECRET_KEY ||
  "messenger_default_guest_secret_key_2026";

/**
 * Route protection middleware supporting dual authentication:
 * 1. Clerk authentication (for signed-in Clerk accounts)
 * 2. Guest JWT token (for instant guest chat accounts)
 */
export async function protectRoute(req, res, next) {
  try {
    // 1. Check for Clerk authentication
    const { isAuthenticated, userId } = getAuth(req);

    if (isAuthenticated && userId) {
      let user = await User.findOne({ clerkId: userId }).lean();

      // Fallback: If webhook was delayed or running locally without ngrok,
      // sync profile directly from Clerk API using clerkClient
      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(userId);
          if (clerkUser) {
            const email =
              clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
              clerkUser.emailAddresses?.[0]?.emailAddress ??
              "";

            const fullName =
              [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
              clerkUser.username ||
              email.split("@")[0] ||
              "User";

            user = await User.findOneAndUpdate(
              { clerkId: userId },
              {
                clerkId: userId,
                email,
                fullName,
                profilePic: clerkUser.imageUrl || "",
                isGuest: false,
              },
              { returnDocument: "after", upsert: true, setDefaultsOnInsert: true, lean: true },
            );

            console.log("⚡ Auto-synced user profile from Clerk API:", userId);
          }
        } catch (clerkError) {
          console.warn("⚠️  Could not auto-fetch user from Clerk:", clerkError.message);
        }
      }

      if (!user) {
        return res.status(404).json({ message: "User profile is not synced yet. Please try again in a moment." });
      }

      req.user = user;
      return next();
    }

    // 2. Check for Guest JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded?.userId) {
            const guestUser = await User.findById(decoded.userId).lean();
            if (guestUser) {
              req.user = guestUser;
              return next();
            }
          }
        } catch (jwtErr) {
          // Token is invalid, expired, or a malformed Clerk token
        }
      }
    }

    return res.status(401).json({ message: "Unauthorized: Please log in or continue as guest" });
  } catch (error) {
    next(error);
  }
}
