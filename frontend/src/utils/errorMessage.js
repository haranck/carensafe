// Turns any API / network error into text that's safe to show people. Only messages the API writes for users
// get through ("Invalid email or password", "Product is already in your wishlist."). Anything technical
// (no connection, 5xx, validation internals, database or JavaScript errors) becomes friendly text instead.
// `error.message` itself ("Network Error", "Request failed with status code 500") is never shown.

export const ERROR_TEXT = {
    GENERIC: "Something went wrong. Please try again.",
    NETWORK: "Can't reach Care N Safe right now. Check your internet connection and try again.",
    TIMEOUT: "That took too long. Please try again.",
    SERVER: "Something went wrong on our side. Please try again in a moment.",
    TOO_MANY: "Too many attempts. Please wait a moment and try again.",
    SESSION: "Your session has expired. Please log in again.",
    UPLOAD: "Couldn't upload that image. Use a JPG, PNG or WEBP file up to 5 MB.",
};

// User-facing API messages are short sentences; anything longer is almost certainly a dump
const MAX_MESSAGE_LENGTH = 160;

// Auth middleware / refresh messages ("Invalid or expired access token.", "Refresh token not found…")
const SESSION_PATTERN = /token|access denied/i;

// Multer errors from the upload middleware ("Upload Error: File too large")
const UPLOAD_PATTERN = /^upload error/i;

// Technical text that can still arrive in a 4xx body
const TECHNICAL_PATTERNS = [
    /^"[^"]+"\s/, // Joi default messages: "userId" is not allowed
    /cast to|objectid|e11000|duplicate key|validation failed|mongo|bson/i, // Mongoose / MongoDB
    /cannot read|undefined|is not a function|is not defined|unexpected token|json/i, // JavaScript
    /status code \d{3}|network error|econn|etimedout/i, // axios / Node
];

const TIMEOUT_CODES = ["ECONNABORTED", "ETIMEDOUT"];

/**
 * error: whatever a mutation / query rejected with. fallback: what to say when the API's own message
 * isn't safe to show, written for the action ("Couldn't update this user. Please try again.").
 */
export const getErrorMessage = (error, fallback = ERROR_TEXT.GENERIC) => {
    // Not an HTTP error (e.g. a bug in our own code): never show its text
    if (!error?.isAxiosError) return fallback;

    const { response, code } = error;
    if (!response) return TIMEOUT_CODES.includes(code) ? ERROR_TEXT.TIMEOUT : ERROR_TEXT.NETWORK;

    const { status, data } = response;
    if (status >= 500) return ERROR_TEXT.SERVER;
    if (status === 429) return ERROR_TEXT.TOO_MANY;

    // HTML error pages and empty bodies have no usable message
    const message = typeof data?.message === "string" ? data.message.trim() : "";
    if (!message || message.length > MAX_MESSAGE_LENGTH) return status === 401 ? ERROR_TEXT.SESSION : fallback;

    if (UPLOAD_PATTERN.test(message)) return ERROR_TEXT.UPLOAD;
    if (SESSION_PATTERN.test(message)) return ERROR_TEXT.SESSION;
    if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(message))) return fallback;

    return message;
};
