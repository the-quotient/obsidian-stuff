# Obsidian Stuff

This repository contains some scripts and templates from my Obsidian vault.
I moved the Time Tracker Statistics into its own plugin. See [Obsidian Time Tracker Statistics](https://github.com/the-quotient/obsidian-time-tracker-statistics).

## Prerequisites 

* [Meta Bind Plugin](https://github.com/mProjectsCode/obsidian-meta-bind-plugin)
* [Task Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks)
* [Task Archiver Plugin](https://github.com/ivan-lednev/obsidian-task-archiver)
* [Super Simple Time Tracker](https://github.com/Ellpeck/ObsidianSimpleTimeTracker)
* [Obsidian Time Tracker Statistics](https://github.com/the-quotient/obsidian-time-tracker-statistics)
* [Zotero Integration](https://github.com/obsidian-community/obsidian-zotero-integration/)

## Scripts

* sortTasks: Sorts finished tasks to the top and the rest alphabetically (for a tasks scratch space)
* updateTasks: Moves unfinished tasks from the tasks scratch space of a daily note to the next day
* toggleWorkPrivateTask: toggles between `group by priority filter by function task.file.tags.includes("#work")` and `group by priority filter by function !task.file.tags.includes("#work")` in the TQ_extra_instructions field. See [docs](https://publish.obsidian.md/tasks/How+To/Make+a+query+user+interface)
* zoteroBatchImport: imports or updates your whole Zotero library representation in Obsidian. May come as a native Feature to the Zotero integration soon, see [Issue 418](https://github.com/obsidian-community/obsidian-zotero-integration/issues/418)


## Templates

* A Daily Note Template
* A Project Note Template with Task Scratch Space and Task Archiver Button
