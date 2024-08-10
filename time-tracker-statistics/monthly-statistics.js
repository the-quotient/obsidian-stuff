
const monthLookupTable = [
    { name: "January",   days: 31 },
    { name: "February",  days: 28 }, // Consider leap years separately
    { name: "March",     days: 31 },
    { name: "April",     days: 30 },
    { name: "May",       days: 31 },
    { name: "June",      days: 30 },
    { name: "July",      days: 31 },
    { name: "August",    days: 31 },
    { name: "September", days: 30 },
    { name: "October",   days: 31 },
    { name: "November",  days: 30 },
    { name: "December",  days: 31 }
];

// Get the time tracker plugin API instance
let api = dv.app.plugins.plugins["simple-time-tracker"].api;

// Extract the Year and the Month from the file name 
let year = extractYear(dv.current().file.name);
let monthIndex = extractMonth(dv.current().file.name);

printWorkingTimeOfMonth(year, monthIndex);

// Generates MarkDown table with day, totalDuration of that day, and a breakdown
async function printWorkingTimeOfMonth(year, monthIndex) {
    try {

        // Get the full name of the month and the number of days in it 
        let monthDetails = getMonthDetails(year, monthIndex);
        if (!monthDetails) throw new Error("Invalid month index");

        // Print the name of the month 
        dv.el("strong", monthDetails.name);
        dv.el("p", "");

        // Get the working time of each day 
        let promises = [];
        for (let i = 1; i <= monthDetails.days; i++) {
            let day = i < 10 ? "0" + i : i;
            let month = monthIndex < 10 ? "0" + monthIndex : monthIndex;
            let date = `${year}-${month}-${day}`;
            promises.push(getWorkingTimeOfDay(date));
        }
        let results = await Promise.all(promises);

        // Process results to build rows
        let rows = [];
        results.forEach((workingTime, i) => {
            let day = (i + 1) < 10 ? "0" + (i + 1) : (i + 1).toString();
            rows.push([day, api.formatDuration(workingTime.totalDuration), 
                printBreakdown(workingTime)]);
        });

        // Build and render the table
        let headers = ["Day", "Total Duration", "Breakdown"];
        let table = 
            `| ${headers[0]} | ${headers[1]} | ${headers[2]} |\n| --- | --- | --- |\n`;
        rows.forEach(row => {table += `| ${row[0]} | ${row[1]} | ${row[2]} |\n`;});
        dv.paragraph(table);

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
        //and filter for those those of the given day 
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

// Format the breakdown 
function printBreakdown(workingTime) {
    let { pageNames, entryNames, entryDurations } = workingTime;
    return pageNames.map((pageName, i) =>
        `**${pageName}-${entryNames[i]}:** ${api.formatDuration(entryDurations[i])}`
    ).join('<br>');
}

// Use a regular expression to match the date portion (YYYY-MM-DD)
function extractDate(dateTimeString) {
    if (!dateTimeString) {
        return null;
    }
    const dateMatch = dateTimeString.match(/^\d{4}-\d{2}-\d{2}/);
    return dateMatch ? dateMatch[0] : null;
}

// Use a regular expression to match a four-digit year in the string
function extractYear(inputString) {
    const yearMatch = String(inputString).match(/\b\d{4}\b/);
    return yearMatch ? Number(yearMatch[0]) : null;
}

// Use a regular expression to match a dash followed by atwo-digit month in the string
function extractMonth(inputString) {
    const monthMatch = String(inputString).match(/\b-\d{2}\b/);
    return monthMatch ? Number(monthMatch[0].replace("-", "")) : null;
}

// Function to get month details by index (1-12)
function getMonthDetails(year, monthIndex) {
    if (monthIndex < 1 || monthIndex > 12) {
        return null;
    }
    let monthDetails = monthLookupTable[monthIndex - 1];
    // Adjust for leap year in February
    if (monthIndex === 2 && isLeapYear(year)) {
        monthDetails = { ...monthDetails, days: 29 };
    }
    return monthDetails;
}

// Determine if a year is a leap year
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
