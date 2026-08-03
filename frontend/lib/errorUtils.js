/**
 * Safely formats any API error response (string, Pydantic 422 array of objects, or object)
 * into a plain string suitable for rendering in React JSX / Toasts.
 */
export function formatErrorMessage(msg) {
    if (!msg) return "";
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) {
        return msg
            .map((item) => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object") {
                    if (item.msg) {
                        const field = item.loc ? item.loc[item.loc.length - 1] : "";
                        return field && field !== "body" ? `${field}: ${item.msg}` : item.msg;
                    }
                    return JSON.stringify(item);
                }
                return String(item);
            })
            .join("; ");
    }
    if (typeof msg === "object") {
        if (msg.msg) return msg.msg;
        if (msg.detail) return formatErrorMessage(msg.detail);
        return JSON.stringify(msg);
    }
    return String(msg);
}
