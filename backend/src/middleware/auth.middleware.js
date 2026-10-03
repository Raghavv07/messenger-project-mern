import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/user.model.js";

/**
 * Route protection middleware using Clerk Express SDK.
 * Follows Clerk's official Quickstart guide:
 * Uses getAuth(req) to check session status and userId.
 * Includes automatic on-demand profile sync via clerkClient if webhooks haven't delivered yet.
 */
export async function protectRoute(req, res, next) {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

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
    next();
  } catch (error) {
    next(error);
  }
}
