const themeSelect = document.querySelector("#theme-select");
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

function resolveTheme(preference) {
    if (preference === "system") {
        return systemThemeQuery.matches ? "night" : "violet";
    }

    return preference;
}

function applyTheme(preference) {
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


/* Expand details without disturbing the shared chronological grid rows. */
const historyTimeline = document.querySelector(".history-timeline");
if (historyTimeline) {
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
    });
}
