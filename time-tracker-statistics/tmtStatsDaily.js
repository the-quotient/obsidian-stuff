
(async () => {
    const app = window.app;
    const Notice = window.Notice;
    const activeFile = app.workspace.getActiveFile();

    function extractDate(input) {
        if (!input) return null;
        const m = input.match(/^\d{4}-\d{2}-\d{2}/);
        return m ? m[0] : null;
    }

    function printBreakdown(api, workingTime) {
        const { fileTags, pageNames, entryNames, entryDurations } = workingTime;
        let table = `| Type  | Entry                         | Duration |\n` +
                    `| ----- | ----------------------------- | -------- |\n`;
        fileTags.forEach((tag, i) => {
            const type = tag === "#work" ? "Work" : "Other";
            const entryKey = `${pageNames[i]}-${entryNames[i]}`;
            const durStr = api.formatDuration(entryDurations[i]);
            table += `| ${type} | **${entryKey}** | ${durStr} |\n`;
        });
        return table;
    }

    async function getWorkingTimeOfDay(dv, api, date) {
        let fileTags = [], pageNames = [], entryNames = [], entryDurations = [], filteredEntries = [];

        function processEntries(entries, page, isWork, parentName = '') {
            entries.forEach(entry => {
                if (extractDate(entry.startTime) === date) {
                    pushEntry(page, entry, isWork, parentName);
                }
                if (entry.subEntries) {
                    processEntries(entry.subEntries, page, isWork, parentName ? `${parentName}-${entry.name}` : entry.name);
                }
            });
        }

        function pushEntry(page, entry, isWork, parentName) {
            filteredEntries.push(entry);
            fileTags.push(isWork ? "#work" : "other");
            pageNames.push(page.file.name.toUpperCase());
            entryNames.push(parentName ? `${parentName}-${entry.name}` : entry.name);
            entryDurations.push(api.getDuration(entry));
        }

        for (let page of dv.pages()) {
            if (!page.file?.path) continue;
            const trackers = await api.loadAllTrackers(page.file.path);
            const isWork = page.file.tags?.includes("#work");
            for (let { tracker } of trackers) {
                processEntries(tracker.entries, page, isWork);
            }
        }
        return { totalDuration: api.getTotalDuration(filteredEntries), fileTags, pageNames, entryNames, entryDurations };
    }

    async function getRunningTrackerMarkdown(dv, api) {
        try {
            for (let page of dv.pages()) {
                if (!page.file?.path) continue;
                let trackers = await api.loadAllTrackers(page.file.path);
                for (let { tracker } of trackers) {
                    if (api.isRunning(tracker)) {
                        return `**Currently Tracker running in:** [[${page.file.path}|${page.file.name}]]`;
                    }
                }
            }
            return "_No tracker is currently running._";
        } catch (error) {
            console.error("Error displaying the running tracker:", error);
            return "> [!ERROR] An error occurred while displaying the running tracker.";
        }
    }

    async function getReportMarkdown(app, dv, currentFilePath) {
        const api = app.plugins.plugins["simple-time-tracker"]?.api;
        if (!api) {
            console.error("Simple Time Tracker plugin not found.");
            return "> [!ERROR] Simple Time Tracker plugin not found.";
        }

        const runningTrackerMd = await getRunningTrackerMarkdown(dv, api);

        const fileName = currentFilePath.split('/').pop();
        const date = extractDate(fileName);
        if (!date) {
            return `> [!ERROR] Could not extract date from file name: ${fileName}`;
        }

        try {
            const workingTime = await getWorkingTimeOfDay(dv, api, date);
            let dailyReportMd;

            if (workingTime.totalDuration === 0) {
                dailyReportMd = "_No tracked time found for this day._";
            } else {
                let workMs = 0;
                workingTime.entryDurations.forEach((dur, i) => {
                    if (workingTime.fileTags[i] === "#work") workMs += dur;
                });
                const otherMs = workingTime.totalDuration - workMs;
                const workStr = api.formatDuration(workMs);
                const otherStr = api.formatDuration(otherMs);
                const totalStr = api.formatDuration(workingTime.totalDuration);

                const totalsTable = `| Category | Duration |
| -------- | -------- |
| Work     | ${workStr} |
| Other    | ${otherStr} |
| Total    | ${totalStr} |`;

                const breakdownTable = printBreakdown(api, workingTime);
                dailyReportMd = `#### Totals\n\n${totalsTable}\n\n\n#### Entries Breakdown\n\n${breakdownTable}`;
            }

            return `${runningTrackerMd}\n${dailyReportMd}`;

        } catch (error) {
            console.error("Error generating report:", error);
            return "> [!ERROR] An error occurred while generating the report.";
        }
    }

    const dv = app.plugins.plugins.dataview?.api;
    const timeTrackerApi = app.plugins.plugins["simple-time-tracker"]?.api;
    const reportMarkdown = await getReportMarkdown(app, dv, activeFile.path);
    if (reportMarkdown === null) {
        new Notice("Failed to generate report. See console for details.", 5000);
        return;
    }

    const fileContent = await app.vault.read(activeFile);
    const blockRegex = /(```dataviewjs\s*\n\/\/ daily overview block\s*[\s\S]*?const myMarkdown = `)[\s\S]*?(`\s*;?\s*dv\.paragraph\(myMarkdown\);\s*```)/;
    if (!blockRegex.test(fileContent)) {
        new Notice("Target dataviewjs block not found in note.", 7000);
        return;
    }

    const escapedReport = reportMarkdown.replace(/`/g, '\\`');
    const finalContent = fileContent.replace(
        blockRegex,
        `$1\n${escapedReport}\n$2`
    );

    await app.vault.modify(activeFile, finalContent);

})();


