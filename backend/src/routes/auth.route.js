import express from "express";
import { checkAuth, guestLogin } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/check", protectRoute, checkAuth);
router.post("/guest-login", guestLogin);

export default router;
