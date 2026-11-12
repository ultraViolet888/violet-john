const themeSelect = document.querySelector("#theme-select");
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const supportedThemes = new Set(["system", "violet", "night", "cyberpunk"]);

function resolveTheme(preference) {
    if (preference === "system") {
        return systemThemeQuery.matches ? "night" : "violet";
    }

    return preference;
}

function applyTheme(preference) {
    // Migrate a previously saved Paper or Terminal selection to System.
    if (!supportedThemes.has(preference)) preference = "system";
    const resolvedTheme = resolveTheme(preference);

    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = resolvedTheme;

    if (themeSelect) {
        themeSelect.value = preference;
    }
}

function saveTheme(preference) {
    try {
        localStorage.setItem("violet-theme", preference);
    } catch (error) {
        // If storage is unavailable, the current session still keeps the selected theme.
    }
}

const initialPreference =
    document.documentElement.dataset.themePreference || "system";

applyTheme(initialPreference);

if (themeSelect) {
    themeSelect.addEventListener("change", (event) => {
        const preference = event.target.value;
        saveTheme(preference);
        applyTheme(preference);
        // Anonymous interaction data only; no visitor identifiers.
        if (window.umami?.track) {
            window.umami.track("theme-change", { theme: preference });
        }
    });
}

systemThemeQuery.addEventListener("change", () => {
    const preference =
        document.documentElement.dataset.themePreference || "system";

    if (preference === "system") {
        applyTheme("system");
    }
});

fetch("https://api.github.com/repos/ultraviolet888/violet-john/commits/main")
    .then((response) => {
        if (!response.ok) {
            throw new Error("Could not load repository update time.");
        }

        return response.json();
    })
    .then((data) => {
        const commitDate = new Date(data.commit.committer.date);

        document.getElementById("last-updated").textContent =
            commitDate.toLocaleDateString();
    })
    .catch(() => {
        document.getElementById("last-updated").textContent =
            "available on GitHub";
    });


/* The timeline is absolute-positioned to keep dates aligned. Measure only visible
   content and expand its height when a selected detail card needs more space. */
const historyTimeline = document.querySelector(".history-timeline");
if (historyTimeline) {
    // Render the phone's three-track map directly from the desktop entries.
    const mobileMap = document.querySelector(".timeline-mobile-map");
    const mobileDetails = document.querySelector(".timeline-mobile-details");
    if (mobileMap && mobileDetails) {
        const detailsBody = mobileDetails.querySelector(".timeline-mobile-details-body");
        const closeButton = mobileDetails.querySelector(".timeline-mobile-close");
        const closeMobileDetails = () => {
            mobileDetails.hidden = true;
            mobileMap.querySelectorAll(".timeline-mobile-event").forEach(node =>
                node.setAttribute("aria-pressed", "false"));
        };
        closeButton.addEventListener("click", closeMobileDetails);
        mobileMap.addEventListener("keydown", event => {
            if (event.key === "Escape") closeMobileDetails();
        });
        const tracks = ["education", "career", "growth"];
        for (let year = 2010; year <= 2026; year++) {
            const label = document.createElement("span");
            label.className = "timeline-mobile-year";
            label.style.top = (52 + (2026 - year) * 44) + "px";
            label.textContent = String(year);
            mobileMap.append(label);
        }
        tracks.forEach((track, index) => {
            const rail = document.createElement("span");
            rail.className = "timeline-mobile-rail";
            const fraction = (index + 0.5) / 3;
            rail.style.left = "calc(" + (44 * (1 - fraction)).toFixed(2) +
                "px + " + (fraction * 100).toFixed(4) + "%)";
            rail.style.setProperty("--track-color", "var(--timeline-" + track + ")");
            rail.setAttribute("aria-hidden", "true");
            mobileMap.append(rail);
        });
        [...historyTimeline.querySelectorAll(".timeline-event")]
            .sort((a, b) => parseFloat(b.style.getPropertyValue("--event-position")) -
                parseFloat(a.style.getPropertyValue("--event-position")))
            .forEach(entry => {
                const trigger = entry.querySelector(".timeline-trigger");
                const detail = entry.querySelector(".timeline-detail");
                if (!trigger || !detail) return;
                const track = tracks.find(t => entry.classList.contains("timeline-event-" + t));
                const name = trigger.querySelector("strong")?.textContent.trim() || "Timeline event";
                const dates = [...detail.querySelectorAll(".timeline-detail-date")].map(el => el.textContent.trim());
                const marker = document.createElement("button");
                marker.type = "button";
                marker.className = "timeline-mobile-event " +
                    (entry.classList.contains("timeline-interval") ? "is-interval" : "is-milestone");
                const position = parseFloat(entry.style.getPropertyValue("--event-position"));
                const duration = parseFloat(entry.style.getPropertyValue("--event-duration")) || 0;
                const fraction = (tracks.indexOf(track) + 0.5) / 3;
                const interval = entry.classList.contains("timeline-interval");
                marker.style.top = (52 + (16 - position - (interval ? duration : 0)) * 44) + "px";
                if (interval) marker.style.height = Math.max(12, duration * 44) + "px";
                marker.style.left = "calc(" + (44 * (1 - fraction)).toFixed(2) +
                    "px + " + (fraction * 100).toFixed(4) + "%)";
                marker.style.setProperty("--track-color", "var(--timeline-" + track + ")");
                marker.setAttribute("aria-label", name + ", " + (dates.length > 1 ? "2024" : dates[0] || "") + ". Show details");
                marker.setAttribute("aria-pressed", "false");
                marker.addEventListener("click", () => {
                    if (marker.getAttribute("aria-pressed") === "true") {
                        closeMobileDetails();
                        return;
                    }
                    mobileMap.querySelectorAll(".timeline-mobile-event").forEach(node =>
                        node.setAttribute("aria-pressed", String(node === marker)));
                    mobileDetails.style.setProperty("--mobile-selected-color",
                        "var(--timeline-" + track + ")");
                    detailsBody.replaceChildren();
                    const heading = document.createElement("h3");
                    heading.textContent = name;
                    detailsBody.append(heading);
                    const copy = detail.cloneNode(true);
                    copy.removeAttribute("id");
                    copy.removeAttribute("hidden");
                    copy.classList.remove("timeline-detail");
                    detailsBody.append(...copy.childNodes);
                    mobileDetails.scrollTop = 0;
                    mobileDetails.hidden = false;
                    if (window.umami?.track) window.umami.track("timeline-expand", { item: name });
                });
                mobileMap.append(marker);
            });
    }

    function spaceTimelineLabels() {
        const entries = [...historyTimeline.querySelectorAll(".timeline-event")];
        entries.forEach(entry => entry.style.removeProperty("--label-offset"));

        // Each track has its own labels; keep dates and duration bars untouched.
        for (const track of ["education", "career", "growth"]) {
            const trackEntries = entries
                .filter(entry => entry.classList.contains("timeline-event-" + track))
                .sort((a, b) => a.offsetTop - b.offsetTop);
            let previousBottom = -Infinity;

            for (const entry of trackEntries) {
                const label = entry.querySelector(".timeline-trigger");
                if (!label) continue;
                const labelTop = label.getBoundingClientRect().top;
                const labelHeight = label.getBoundingClientRect().height;
                const extraSpace = Math.max(0, Math.ceil(previousBottom + 12 - labelTop));
                entry.style.setProperty("--label-offset", extraSpace + "px");
                previousBottom = labelTop + extraSpace + labelHeight;
            }
        }
    }

    function fitTimelineHeight() {
        // Reset first so closing a card actually shrinks the timeline again.
        historyTimeline.style.height = "";
        if (historyTimeline.getClientRects().length === 0) return;
        // The mobile version flows naturally; absolute-positioned height
        // calculations and label offsets only apply to the desktop timeline.
        if (window.matchMedia("(max-width: 760px)").matches) {
            historyTimeline.querySelectorAll(".timeline-event").forEach(entry =>
                entry.style.removeProperty("--label-offset"));
            return;
        }
        spaceTimelineLabels();

        const yearHeight = parseFloat(
            getComputedStyle(historyTimeline).getPropertyValue("--timeline-year-height")
        ) || 80;
        let needed = 17 * yearHeight;
        const timelineTop = historyTimeline.getBoundingClientRect().top;

        historyTimeline.querySelectorAll(
            ".timeline-trigger, .timeline-duration-bar, .timeline-milestone-dot, .timeline-detail:not([hidden])"
        ).forEach((item) => {
            if (item.getClientRects().length === 0) return;
            needed = Math.max(needed, item.getBoundingClientRect().bottom - timelineTop + 12);
        });
        historyTimeline.style.height = Math.ceil(needed) + "px";
    }

    fitTimelineHeight();
    window.addEventListener("resize", fitTimelineHeight);

    historyTimeline.addEventListener("click", (event) => {
        const entry = event.target.closest(".timeline-event");
        if (!entry || !historyTimeline.contains(entry)) return;
        const trigger = entry.querySelector(".timeline-trigger");
        if (!trigger) return;
        const details = document.getElementById(trigger.getAttribute("aria-controls"));
        if (!details) return;

        const expand = trigger.getAttribute("aria-expanded") !== "true";
        historyTimeline.querySelectorAll(".timeline-trigger[aria-expanded='true']").forEach((openTrigger) => {
            openTrigger.setAttribute("aria-expanded", "false");
            const openDetails = document.getElementById(openTrigger.getAttribute("aria-controls"));
            if (openDetails) openDetails.hidden = true;
        });
        trigger.setAttribute("aria-expanded", String(expand));
        details.hidden = !expand;
        fitTimelineHeight();
        if (expand && window.umami?.track) {
            window.umami.track("timeline-expand", {
                item: trigger.querySelector("strong")?.textContent?.trim() || "Unknown"
            });
        }
    });
}

/* Graceful cover fallbacks for unavailable images. */
document.querySelectorAll(".book-cover").forEach((cover) => {
    cover.addEventListener("error", () => { cover.classList.add("book-cover-unavailable"); });
    if (cover.complete && cover.naturalWidth === 0) cover.classList.add("book-cover-unavailable");
});

/* Bookshelves reuse the existing book grid as the source on every screen. */
document.querySelectorAll(".book-grid").forEach(grid => {
    const cards = [...grid.querySelectorAll(".book-card")];
    if (!cards.length) return;
    const shelf = document.createElement("div");
    shelf.className = "desktop-bookshelf";
    shelf.setAttribute("aria-label", grid.getAttribute("aria-label") || "Bookshelf");

    const hint = document.createElement("p");
    hint.className = "bookshelf-hint";
    hint.textContent = "Select a book spine to see its cover and notes.";
    shelf.append(hint);

    const preview = document.createElement("div");
    preview.className = "bookshelf-detail";
    preview.hidden = true;
    let selectedSpine = null;
    function closePreview() {
        if (selectedSpine) selectedSpine.setAttribute("aria-pressed", "false");
        selectedSpine = null;
        preview.hidden = true;
    }

    // Keep rows comfortably inside the desktop content column.
    for (let offset = 0; offset < cards.length; offset += 16) {
        const row = document.createElement("div");
        row.className = "bookshelf-row";
        for (const [index, card] of cards.slice(offset, offset + 16).entries()) {
            const source = card.querySelector(".book-card-link");
            if (!source) continue;
            const title = source.dataset.umamiEventBook ||
                source.querySelector(".book-cover")?.alt.replace(/^Cover of /, "") || "Book";
            const sourceLabel = source.getAttribute("aria-label") || "";
            const author = sourceLabel.includes(" — ") ?
                sourceLabel.split(" — ")[1].split(". Open book details")[0] : "";
            const notes = source.querySelector(".book-tooltip")?.textContent.trim() || "";
            const cover = source.querySelector(".book-cover");
            const spine = document.createElement("button");
            spine.type = "button";
            spine.className = "book-spine";
            spine.setAttribute("aria-label", "View " + title);
            spine.setAttribute("aria-pressed", "false");
            // Fit real spine text rather than clipping long titles. Vertical text
            // wraps into additional columns; each extra column widens the spine.
            const spineHeight = 185 + ((offset + index) % 4) * 14;
            const measure = document.createElement("canvas").getContext("2d");
            measure.font = "650 13px system-ui";
            const textLength = measure.measureText(title).width;
            const columns = Math.max(1, Math.ceil(textLength / (spineHeight - 25)));
            spine.style.setProperty("--spine-height", spineHeight + "px");
            spine.style.setProperty("--spine-width", Math.min(104, Math.max(40, columns * 18 + 14)) + "px");
            const spineTitle = document.createElement("span");
            spineTitle.textContent = title;
            spine.append(spineTitle);
            // Sample cover artwork locally, then blend it into the current theme.
            // Missing/unreadable covers keep the existing theme-based spine tint.
            if (cover) {
                const applyCoverTint = () => {
                    if (!cover.naturalWidth) return;
                    try {
                        const canvas = document.createElement("canvas");
                        canvas.width = canvas.height = 16;
                        const context = canvas.getContext("2d", { willReadFrequently: true });
                        context.drawImage(cover, 0, 0, 16, 16);
                        const data = context.getImageData(0, 0, 16, 16).data;
                        let red = 0, green = 0, blue = 0, weightSum = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            const [r, g, b, a] = data.slice(i, i + 4);
                            const chroma = Math.max(r, g, b) - Math.min(r, g, b);
                            const weight = (a / 255) * (0.25 + chroma / 255);
                            red += r * weight;
                            green += g * weight;
                            blue += b * weight;
                            weightSum += weight;
                        }
                        if (weightSum > 0) {
                            const tint = [red, green, blue].map(v => Math.round(v / weightSum));
                            spine.style.background = "color-mix(in srgb, rgb(" + tint.join(",") +
                                ") 38%, var(--color-primary-soft))";
                        }
                    } catch (error) {
                        // Theme fallback is intentional for unavailable or opaque artwork.
                    }
                };
                if (cover.complete) applyCoverTint();
                else cover.addEventListener("load", applyCoverTint, { once: true });
            }
            spine.addEventListener("click", () => {
                if (selectedSpine === spine) {
                    closePreview();
                    return;
                }
                if (selectedSpine) selectedSpine.setAttribute("aria-pressed", "false");
                selectedSpine = spine;
                spine.setAttribute("aria-pressed", "true");
                preview.replaceChildren();
                const image = document.createElement("img");
                image.className = "bookshelf-cover";
                image.alt = cover?.alt || "Cover of " + title;
                image.loading = "lazy";
                if (cover?.getAttribute("src")) image.src = cover.getAttribute("src");
                else image.hidden = true;
                image.addEventListener("error", () => { image.hidden = true; });
                const body = document.createElement("div");
                const headingRow = document.createElement("div");
                headingRow.className = "bookshelf-detail-head";
                const heading = document.createElement("h3");
                heading.textContent = title;
                const dismiss = document.createElement("button");
                dismiss.type = "button";
                dismiss.className = "bookshelf-dismiss";
                dismiss.textContent = "Close";
                dismiss.addEventListener("click", () => {
                    closePreview();
                    spine.focus();
                });
                headingRow.append(heading, dismiss);
                body.append(headingRow);
                if (author) {
                    const byline = document.createElement("p");
                    byline.className = "bookshelf-author";
                    byline.textContent = author;
                    body.append(byline);
                }
                if (notes) {
                    const description = document.createElement("p");
                    description.textContent = notes;
                    body.append(description);
                }
                const link = document.createElement("a");
                link.href = source.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "View book details";
                link.dataset.umamiEvent = "book-click";
                link.dataset.umamiEventBook = title;
                body.append(link);
                preview.append(image, body);
                row.after(preview);
                preview.hidden = false;
            });
            row.append(spine);
        }
        shelf.append(row);
    }
    grid.before(shelf);
    grid.classList.add("shelf-enhanced");
});

/* Two accessible views; all professional and personal content stays in one page. */
const tabs = Array.from(document.querySelectorAll('.tabs [role="tab"]'));
function selectSiteTab(tab, focusTab = false, trackChange = false) {
    if (!tabs.includes(tab)) return;
    for (const item of tabs) {
        const selected = item === tab;
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
    }
    document.querySelector(".tabs")?.setAttribute("data-active-index", String(tabs.indexOf(tab)));
    if (focusTab) tab.focus();
    if (trackChange && window.umami?.track) {
        window.umami.track("site-section", { section: tab.id === "personal-tab" ? "personal" : "professional" });
    }
}

if (tabs.length === 2) {
    const personalHashes = new Set(["#personal", "#interests", "#personal-reading"]);
    const professionalHashes = new Set(["#professional", "#work", "#open-threads", "#professional-reading"]);
    selectSiteTab(personalHashes.has(location.hash) ? tabs[1] : tabs[0]);


    tabs.forEach(tab => tab.addEventListener("click", () => {
        selectSiteTab(tab, false, true);
        const hash = tab.id === "personal-tab" ? "#personal" : "#professional";
        if (location.hash !== hash) history.replaceState(null, "", hash);
    }));

    document.querySelector(".tabs").addEventListener("keydown", event => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const selected = tabs.findIndex(tab => tab.getAttribute("aria-selected") === "true");
        const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
            (selected + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        selectSiteTab(tabs[next], true, true);
        history.replaceState(null, "", next === 1 ? "#personal" : "#professional");
    });

    window.addEventListener("hashchange", () => {
        if (personalHashes.has(location.hash)) selectSiteTab(tabs[1]);
        else if (professionalHashes.has(location.hash)) selectSiteTab(tabs[0]);
    });
}
