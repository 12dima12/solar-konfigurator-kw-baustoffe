/**
 * After a selection the user should land at the top of the new step.
 *
 * In the iframe embed the iframe reports its full height to the parent and
 * never scrolls itself — the user's scroll position lives in the parent
 * window. We scroll both sides: the iframe (harmless no-op if the iframe
 * is already at y=0) and, via postMessage, the parent (which scrolls the
 * iframe back into view).
 *
 * No origin-whitelist on the postMessage target: the payload is a fixed
 * string literal with no secrets; worst case an unexpected parent receives
 * a "please scroll to me" hint it will ignore.
 */
export function scrollToTop(): void {
  if (typeof window === "undefined") return;

  // Fallback so a non-iframe direct hit also ends at the top.
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: "kw-configurator-scroll-to-top" }, "*");
    } catch {
      // cross-origin without access — swallow
    }
  }
}
