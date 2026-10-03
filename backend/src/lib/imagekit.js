import ImageKit, { toFile } from "@imagekit/nodejs";

/**
 * Lazy-loaded ImageKit client singleton.
 * Prevents application startup crashes when IMAGEKIT_PRIVATE_KEY is not yet configured in .env.
 */
let imagekitInstance = null;

export function getImageKitClient() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY environment variable is not configured.");
  }

  if (!imagekitInstance) {
    imagekitInstance = new ImageKit({ privateKey });
  }

  return imagekitInstance;
}

/**
 * Checks if ImageKit credentials are configured in the environment.
 * @returns {boolean}
 */
export function hasImageKitConfig() {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

/**
 * Creates a sanitized, unique filename for uploaded files.
 */
function createFileName(originalName = "upload") {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `chat-${Date.now()}-${safeName}`;
}

/**
 * Upload image or video to ImageKit using official @imagekit/nodejs v7 SDK
 * @see https://github.com/imagekit-developer/imagekit-nodejs
 * @param {Express.Multer.File} file - Multer in-memory file object
 * @returns {Promise<string>} Uploaded file CDN URL
 */
export async function uploadChatMedia(file) {
  const client = getImageKitClient();
  const fileName = createFileName(file.originalname);

  const uploadFile = await toFile(file.buffer, fileName, { type: file.mimetype });

  const result = await client.files.upload({
    file: uploadFile,
    fileName,
    folder: "/chat",
    useUniqueFileName: true,
    tags: ["chat-media", file.mimetype.startsWith("video/") ? "video" : "image"],
  });

  if (!result?.url) {
    throw new Error("ImageKit upload succeeded but did not return a valid URL.");
  }

  return result.url;
}
