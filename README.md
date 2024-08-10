# Obsidian Stuff 

This repository contains some JS Snippets for the use in Obsidian. 

## Time Tracker Statistics 

Based on the [Super Simple Time Tracker Plugin](https://github.com/Ellpeck/ObsidianSimpleTimeTracker) by [@Ellpeck](https://www.github.com/Ellpeck). 

### Monthly Statistics 
This assumes you have a Time Tracker for each project note (or some similar unit). 
It calcuates the total duration for each day and shows a monthly overview, 
when put into a file that includes the year and the month. 

#### Requirements 
- Dataview with enabled JS 
- Super Simple Time Tracker
  
#### Get Started 
Create a file that includes the year and the month of which you want to display the statistics. 
Put the content of the monthly-statistics.js file into a dataviewjs codeblock.

#### Example  

| Day | Total Duration | Breakdown                                                                                                                      |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 01  | 8h 20 min 0s   | **NOTE1-Entry1-Subentry1:** 2h 0 min 0s<br>**NOTE2-Entry5-Subentry8:** 4h 5 min 0s<br>**NOTE3-Entry3-Subentry3:** 2h 15 min 0s |
| 02  | 7h 40 min 0s   | **NOTE5-Entry1-Subentry5:** 3h 20 min 0s<br>**NOTE1-Entry2-Subentry8:** 1h 10 min 0s<br>**NOTE5-Entry3-Subentry3:** 3h 10 min 0s |
| ...  | ...           | ...                                                                                                                            |




