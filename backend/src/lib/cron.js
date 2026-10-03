import { CronJob } from "cron";
import http from "node:http";
import https from "node:https";

// Every 14 minutes send a GET request to the health endpoint to prevent free hosting instances from sleeping
const job = new CronJob("*/14 * * * *", function () {
  try {
    const base = process.env.API_URL || process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL;
    if (!base) return;

    const url = new URL("/health", base).href;
    const client = url.startsWith("https:") ? https : http;

    client
      .get(url, (res) => {
        if (res.statusCode === 200) {
          console.log("💓 Keep-alive health ping successful");
        } else {
          console.log("⚠️ Keep-alive health ping responded with status:", res.statusCode);
        }
      })
      .on("error", (e) => console.error("⚠️ Keep-alive health ping error:", e.message));
  } catch (error) {
    console.error("⚠️ Keep-alive cron execution error:", error.message);
  }
});

export default job;
