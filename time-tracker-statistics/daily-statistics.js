let api = dv.app.plugins.plugins["simple-time-tracker"].api;

let date = extractDate(dv.current().file.name);
if (!date) {
    dv.paragraph("Error: Could not extract date from the file name.");
} else {
    printWorkingTimeOfDay(date);
}

async function printWorkingTimeOfDay(date) {
    try {
        let workingTime = await getWorkingTimeOfDay(date);

        let totalDuration = api.formatDuration(workingTime.totalDuration);
        let breakdownTable = printBreakdown(workingTime);

        dv.el("strong", `Total Duration: ${totalDuration}`);
        dv.el("p", ""); 
        dv.paragraph(breakdownTable);

    } catch (error) {
        console.error("Error generating working time statistics:", error);
        dv.paragraph("An error occurred while generating the working time statistics.");
    }
}

async function getWorkingTimeOfDay(date) {
    try {
        let filteredEntries = [];
        let pageNames = [];
        let entryNames = [];
        let entryDurations = [];

        for (let page of dv.pages()) {
            let trackers = await api.loadAllTrackers(page.file.path);
            for (let { tracker } of trackers) {
                processEntries(tracker.entries, page);
            }
        }
        let totalDuration = api.getTotalDuration(filteredEntries);
        return {
            totalDuration: totalDuration,
            pageNames: pageNames,
            entryNames: entryNames,
            entryDurations: entryDurations
        };

        function processEntries(entries, page, parentEntryName = '') {
            entries.forEach(entry => {
                let entryLevelCondition = 
                    extractDate(entry.startTime) === date && 
                    extractDate(entry.endTime) === date;
                if (entryLevelCondition) {
                    pushEntry(page, entry, parentEntryName);
                }
                if (entry.subEntries && !entryLevelCondition) {
                    processEntries(entry.subEntries, 
                        page, 
                        parentEntryName ? 
                            `${parentEntryName}-${entry.name}` : entry.name);
                }
            });
        }

        function pushEntry(page, entry, parentEntryName) {
            filteredEntries.push(entry);
            pageNames.push(page.file.name.toUpperCase());
            entryNames.push(parentEntryName ? 
                `${parentEntryName}-${entry.name}` : entry.name);
            entryDurations.push(api.getDuration(entry));
        }
    } catch (error) {
        console.error(`Error processing date ${date}:`, error);
        return {
            totalDuration: 0,
            pageNames: [],
            entryNames: [],
            entryDurations: []
        };
    }
}

function printBreakdown(workingTime) {
    let { pageNames, entryNames, entryDurations } = workingTime;
    
    let table = `| Entry | Duration |\n| --- | --- |\n`;
    
    pageNames.forEach((pageName, i) => {
        table += `| **${pageName}-${entryNames[i]}** | ${api.formatDuration(entryDurations[i])} |\n`;
    });

    return table;
}

function extractDate(inputString) {
    if (!inputString) {
        return null;
    }
    const dateMatch = inputString.match(/^\d{4}-\d{2}-\d{2}/);
    return dateMatch ? dateMatch[0] : null;
}

