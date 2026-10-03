import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/express/webhooks";

const router = express.Router();

router.post(["/", "/clerk"], async (req, res) => {
  try {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) {
      console.warn("⚠️  CLERK_WEBHOOK_SIGNING_SECRET is not set in environment.");
      return res.status(503).json({ message: "Webhook secret is not provided" });
    }

    // Official @clerk/express webhook verifier handles incoming Express request & headers automatically
    const evt = await verifyWebhook(req, { signingSecret });

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;

      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
        u.email_addresses?.[0]?.email_address ??
        "";

      const fullName =
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        u.username ||
        email.split("@")[0] ||
        "User";

      await User.findOneAndUpdate(
        { clerkId: u.id },
        { clerkId: u.id, email, fullName, profilePic: u.image_url || "" },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
      );

      console.log(`👤 User synced from Clerk webhook [${evt.type}]:`, u.id);
    }

    if (evt.type === "user.deleted") {
      if (evt.data?.id) {
        await User.findOneAndDelete({ clerkId: evt.data.id });
        console.log("🗑️ User deleted via Clerk webhook:", evt.data.id);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Error in Clerk webhook:", error.message);
    res.status(400).json({ message: "Webhook verification failed", error: error.message });
  }
});

export default router;
