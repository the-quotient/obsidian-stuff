const monthLookupTable = [
    { name: "January", days: 31 },
    { name: "February", days: 28 },
    { name: "March", days: 31 },
    { name: "April", days: 30 },
    { name: "May", days: 31 },
    { name: "June", days: 30 },
    { name: "July", days: 31 },
    { name: "August", days: 31 },
    { name: "September", days: 30 },
    { name: "October", days: 31 },
    { name: "November", days: 30 },
    { name: "December", days: 31 }
];

const HOURS_PER_DAY_OFF = 8 * 60 * 60 * 1000; // 8 hours in milliseconds for a day off
let previousMonthDeviation = 0; // Set this to the deviation from the previous month in milliseconds
let regularDaysOff = 8; 
let daysOff = new Set([]); // Specify days off by their day part (e.g., "05" for the 5th)

let api = dv.app.plugins.plugins["simple-time-tracker"].api;
let year = extractYear(dv.current().file.name);
let monthIndex = extractMonth(dv.current().file.name);
let startDayOfWeek = 1; //1 for Mo, ... 

printWorkingTimeOfMonth(year, monthIndex, startDayOfWeek);

async function printWorkingTimeOfMonth(year, monthIndex, startDayOfWeek) {
    try {
        let monthDetails = getMonthDetails(year, monthIndex);
        if (!monthDetails) throw new Error("Invalid month index");

        dv.el("h4", monthDetails.name);
        dv.el("p", "");

        let promises = [];
        for (let i = 1; i <= monthDetails.days; i++) {
            let day = i < 10 ? "0" + i : i;
            let month = monthIndex < 10 ? "0" + monthIndex : monthIndex;
            let date = `${year}-${month}-${day}`;
            promises.push(getWorkingTimeOfDay(date, day));
        }
        let results = await Promise.all(promises);

        let weekRows = [];
        let weeklyWorkTotal = 0;
        let weeklyOtherTotal = 0;
        let accumulatedDeviation = previousMonthDeviation; // Start with last month’s deviation
        let weekDay = startDayOfWeek - 1;
        let weekStartDay = 1; // Track the starting day of the current week

        results.forEach((workingTime, i) => {
            let day = i + 1;
            let dayOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"][weekDay];
            let workDuration = 0, otherDuration = 0;

            workingTime.fileTags.forEach((tag, index) => {
                if (tag === "#work") {
                    workDuration += workingTime.entryDurations[index];
                } else {
                    otherDuration += workingTime.entryDurations[index];
                }
            });

            weeklyWorkTotal += workDuration;
            weeklyOtherTotal += otherDuration;

            // Mark day off in the day column if it’s in the daysOff set
            const dayLabel = daysOff.has(day < 10 ? "0" + day : day.toString()) ? `*${day} (${dayOfWeek}) - Day Off*` : `${day} (${dayOfWeek})`;

            weekRows.push([
                dayLabel,
                api.formatDuration(workDuration),
                api.formatDuration(otherDuration),
                printBreakdown(workingTime)
            ]);

            weekDay = (weekDay + 1) % 7;

            // Check if the week is complete or if it's the last day of the month
            if (weekDay === 0 || day === monthDetails.days) {
                const targetTimeForWeek = calculateTargetTime(weekStartDay, day);
                accumulatedDeviation = renderWeekTable(weekRows, weeklyWorkTotal, weeklyOtherTotal, targetTimeForWeek, accumulatedDeviation);
                weeklyWorkTotal = 0;
                weeklyOtherTotal = 0;
                weekRows = [];
                weekStartDay = day + 1; // Set the starting day for the next week
            }
        });
    dv.el(`h4`, `End of Month Summary`);
		renderEndOfMonthSummary(accumulatedDeviation);
        
    } catch (error) {
        console.error("Error generating working time statistics:", error.message);
        dv.paragraph("An error occurred while generating the working time statistics. See console for details.");
    }
}

// End of the month summary with total deviation in Markdown table format
function renderEndOfMonthSummary(accumulatedDeviation) {
    let headers = ["Metric", "Value"];
    let table = `| ${headers[0]} | ${headers[1]} |\n| --- | --- |\n`;
    
    // Total accumulated deviation, formatted with a positive/negative sign
    let accumulatedDeviationFormatted = `${(accumulatedDeviation >= 0 ? "+" : "-")}${api.formatDuration(Math.abs(accumulatedDeviation))}`;
    
    // Add each metric row to the table
    table += `| **Total Accumulated Deviation** | **${accumulatedDeviationFormatted}** |\n`;
    table += `| **Total Accumulated Deviation (ms)** | **${accumulatedDeviation}** |\n`;
    table += `| **Number of Days Off (Total)** | **${daysOff.size}** |\n`;
    table += `| **Number of Days Off (Vacation Days)** | **${daysOff.size - regularDaysOff}** |\n`;
    

    // Render the table as a paragraph in DataviewJS
    dv.paragraph(table);
}

// Calculates target time based on the range of days in the week, subtracting 8 hours for each day off within the range
function calculateTargetTime(weekStartDay, weekEndDay) {
    let daysInWeek = weekEndDay - weekStartDay + 1;
    let totalTarget = daysInWeek * 8 * 60 * 60 * 1000; // 8 hours per day in milliseconds
    daysOff.forEach(day => {
        const dayNum = parseInt(day);
        if (dayNum >= weekStartDay && dayNum <= weekEndDay) {
            totalTarget -= HOURS_PER_DAY_OFF;
        }
    });
    return totalTarget;
}

// Renders a table with weekly totals and calculates weekly and accumulated deviations
function renderWeekTable(rows, weeklyWorkTotal, weeklyOtherTotal, targetTimeForWeek, accumulatedDeviation) {
    let headers = ["Day", "Work Duration", "Other Duration", "Entries"];
    let table = `| ${headers[0]} | ${headers[1]} | ${headers[2]} | ${headers[3]} |\n| --- | --- | --- | --- |\n`;
    rows.forEach(row => { table += `| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} |\n`; });

    // Weekly totals and deviation from target
    let workTotalFormatted = api.formatDuration(weeklyWorkTotal);
    let otherTotalFormatted = api.formatDuration(weeklyOtherTotal);

    // Calculate weekly deviation and update accumulated deviation
    let weeklyDeviation = weeklyWorkTotal - targetTimeForWeek;
    accumulatedDeviation += weeklyDeviation;

    let weeklyDeviationFormatted = api.formatDuration(Math.abs(weeklyDeviation));
    weeklyDeviationFormatted = (weeklyDeviation >= 0 ? "+" : "-") + weeklyDeviationFormatted;

    let accumulatedDeviationFormatted = api.formatDuration(Math.abs(accumulatedDeviation));
    accumulatedDeviationFormatted = (accumulatedDeviation >= 0 ? "+" : "-") + accumulatedDeviationFormatted;

    table += `| **Total** | **${workTotalFormatted}** | **${otherTotalFormatted}** |  |\n`;
    table += `| **Weekly Deviation** | **${weeklyDeviationFormatted}** |  |  |\n`;
    table += `| **Accumulated Deviation** | **${accumulatedDeviationFormatted}** |  |  |\n`;

    dv.paragraph(table);
    return accumulatedDeviation; // Return the updated accumulated deviation
}

// Function to format the breakdown of individual entries
function printBreakdown(workingTime) {
    let { pageNames, entryNames, entryDurations } = workingTime;
    return pageNames.map((pageName, i) =>
        `${pageName}-${entryNames[i]}: ${api.formatDuration(entryDurations[i])}`
    ).join('<br>');
}

// Processes each day’s working time by calculating the duration directly from entry timestamps
async function getWorkingTimeOfDay(date, day) {
    try {
        let filteredEntries = [];
        let fileTags = [];
        let entryDurations = [];
        let pageNames = [];
        let entryNames = [];

        for (let page of dv.pages()) {
            let trackers = await api.loadAllTrackers(page.file.path);
            let isWorkFile = page.file.tags && page.file.tags.includes("#work");

            for (let { tracker } of trackers) {
                processEntries(tracker.entries, page, isWorkFile);
            }
        }

        let totalDuration = api.getTotalDuration(filteredEntries);
        return {
            totalDuration: totalDuration,
            fileTags: fileTags,
            entryDurations: entryDurations,
            pageNames: pageNames,
            entryNames: entryNames
        };

        function processEntries(entries, page, isWorkFile, parentEntryName = '') {
            entries.forEach(entry => {
                const entryDate = extractDate(entry.startTime);
                if (entryDate === date) {
                    const duration = api.getDuration(entry); // Get duration directly from tracker
                    fileTags.push(isWorkFile ? "#work" : "other");
                    entryDurations.push(duration);
                    pageNames.push(page.file.name.toUpperCase());
                    entryNames.push(parentEntryName ? `${parentEntryName}-${entry.name}` : entry.name);
                }
                if (entry.subEntries) {
                    processEntries(entry.subEntries, page, isWorkFile, parentEntryName ? `${parentEntryName}-${entry.name}` : entry.name);
                }
            });
        }
    } catch (error) {
        console.error(`Error processing date ${date}:`, error.message);
        return {
            totalDuration: 0,
            fileTags: [],
            entryDurations: [],
            pageNames: [],
            entryNames: []
        };
    }
}

// Extracts date from a timestamp in the format YYYY-MM-DD
function extractDate(dateTimeString) {
    if (!dateTimeString) {
        return null;
    }
    const dateMatch = dateTimeString.match(/^\d{4}-\d{2}-\d{2}/);
    return dateMatch ? dateMatch[0] : null;
}

// Helper functions for extracting year and month from filename
function extractYear(inputString) {
    const yearMatch = String(inputString).match(/\b\d{4}\b/);
    return yearMatch ? Number(yearMatch[0]) : null;
}

function extractMonth(inputString) {
    const monthMatch = String(inputString).match(/\b-\d{2}\b/);
    return monthMatch ? Number(monthMatch[0].replace("-", "")) : null;
}

function getMonthDetails(year, monthIndex) {
    if (monthIndex < 1 || monthIndex > 12) {
        return null;
    }
    let monthDetails = monthLookupTable[monthIndex - 1];
    if (monthIndex === 2 && isLeapYear(year)) {
        monthDetails = { ...monthDetails, days: 29 };
    }
    return monthDetails;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

