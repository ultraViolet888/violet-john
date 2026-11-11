/* Privacy-conscious visitor analytics. No tracking until a site ID is configured.
 * Umami stores visitor analytics; never put an API key into browser code.
 * The tracker is enabled only on the published GitHub Pages site.
 */
(() => {
    const websiteId = document.querySelector('meta[name="umami-website-id"]')?.content.trim();
    const isValidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteId || "");
    const isPublishedSite =
        location.hostname.toLowerCase() === "ultraviolet888.github.io" &&
        (location.pathname === "/violet-john" || location.pathname.startsWith("/violet-john/"));

    // Local previews and unconfigured sites send no analytics requests.
    if (!isValidId || !isPublishedSite) return;

    const tracker = document.createElement("script");
    tracker.defer = true;
    tracker.src = "https://cloud.umami.is/script.js";
    tracker.dataset.websiteId = websiteId;
    tracker.dataset.domains = "ultraviolet888.github.io";
    document.head.appendChild(tracker);
})();
