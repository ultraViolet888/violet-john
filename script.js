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
    function fitTimelineHeight() {
        // Reset first so closing a card actually shrinks the timeline again.
        historyTimeline.style.height = "";
        if (historyTimeline.getClientRects().length === 0) return;

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
    if (focusTab) tab.focus();
    if (trackChange && window.umami?.track) {
        window.umami.track("site-section", { section: tab.id === "personal-tab" ? "personal" : "professional" });
    }
}

if (tabs.length === 2) {
    const initialTab = location.hash === "#personal" ? tabs[1] : tabs[0];
    selectSiteTab(initialTab);

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
        selectSiteTab(location.hash === "#personal" ? tabs[1] : tabs[0]);
    });
}
