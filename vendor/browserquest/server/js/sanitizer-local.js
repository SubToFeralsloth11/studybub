// Minimal HTML sanitiser shim that replaces the unmaintained `sanitizer` npm
// package. BrowserQuest only uses it to clean player names / chat, so we just
// strip tags and escape entities.
exports.sanitize = function (s) {
    return String(s).replace(/<[^>]*>/g, "");
};

exports.escape = function (s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};
