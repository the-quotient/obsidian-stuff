// Get the time tracker plugin API instance
let api = dv.app.plugins.plugins["simple-time-tracker"].api;

// Extract the Year, Month, and Day from the file name 
let date = extractDate(dv.current().file.name);
if (!date) {
    dv.paragraph("Error: Could not extract date from the file name.");
} else {
    printWorkingTimeOfDay(date);
}

// Generates MarkDown with the totalDuration and a breakdown for the specific day
async function printWorkingTimeOfDay(date) {
    try {
        // Get the working time of the specific day 
        let workingTime = await getWorkingTimeOfDay(date);

        // Process results to build rows
        let totalDuration = api.formatDuration(workingTime.totalDuration);
        let breakdownTable = printBreakdown(workingTime);

        // Display the results
        dv.el("strong", `Total Duration: ${totalDuration}`);
        dv.el("p", ""); 
        dv.paragraph(breakdownTable);

    } catch (error) {
        console.error("Error generating working time statistics:", error);
        dv.paragraph("An error occurred while generating the working time statistics.");
    }
}

// Returns total time and for each entry pageName, entryName, entryDurations
async function getWorkingTimeOfDay(date) {
    try {
        let filteredEntries = [];
        let pageNames = [];
        let entryNames = [];
        let entryDurations = [];

        // Get all trackers of all pages in the vault and process their entries 
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

        // Recursively process the (nested) entries 
        // and filter for those of the given day 
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

// Format the breakdown as a Markdown table
function printBreakdown(workingTime) {
    let { pageNames, entryNames, entryDurations } = workingTime;
    
    // Create the table header
    let table = `| Entry | Duration |\n| --- | --- |\n`;
    
    // Populate the table with entries and their durations
    pageNames.forEach((pageName, i) => {
        table += `| **${pageName}-${entryNames[i]}** | ${api.formatDuration(entryDurations[i])} |\n`;
    });

    return table;
}

// Use a regular expression to match the date portion (YYYY-MM-DD)
function extractDate(inputString) {
    if (!inputString) {
        return null;
    }
    const dateMatch = inputString.match(/^\d{4}-\d{2}-\d{2}/);
    return dateMatch ? dateMatch[0] : null;
}

