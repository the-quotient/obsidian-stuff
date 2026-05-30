---
date: {{date:YYYY-MM-DD}}
tags:
  - type/daily-note
TQ_extra_instructions: |-
  group by backlink
  group by priority
  filter by function task.file.tags.includes("#work")
---

`BUTTON[pin, prev, today, next, update]`

```meta-bind-button
label: Pin
icon: ""
hidden: true
class: ""
tooltip: ""
id: "pin"
style: primary
actions:
  - type: command
    command: workspace:toggle-pin
```
```meta-bind-button
label: Today
icon: ""
hidden: true
class: ""
tooltip: ""
id: "today"
style: primary
actions:
  - type: command
    command: daily-notes
```
```meta-bind-button
label: Previous
icon: ""
hidden: true
class: ""
tooltip: ""
id: "prev"
style: primary
actions:
  - type: command
    command: daily-notes:goto-prev
```
```meta-bind-button
label: Next
icon: ""
hidden: true
class: ""
tooltip: ""
id: "next"
style: primary
actions:
  - type: command
    command: daily-notes:goto-next
```
```meta-bind-button
label: "Update"
style: primary
hidden: true
id: "update"
actions:
  - type: js
    file: "scripts/updateTasks.js"
```
```simple-time-tracker-statistics-day
```


![[quick-capture]]

```meta-bind-button
label: "Work/Private"
id: "work"
hidden: true
style: primary
actions:
  - type: js
    file: "scripts/toggleWorkPrivateTasks.js"
```

```meta-bind-button
label: "Priority"
id: "prio"
hidden: true
style: primary
actions:
  - type: js
    file: "scripts/togglePriority.js"
```

`BUTTON[work, prio]`

```tasks
not done
(has due date) OR (has scheduled date)
(due on or before today) OR (scheduled on or before today)
short mode
show tree
hide toolbar
```

```meta-bind-button
label: "Sort Tasks"
style: primary
tooltip: "Normals first, then TODOs (with debug)"
actions:
  - type: js
    file: "scripts/sortTasks.js"
    args:
      debug: true
```


