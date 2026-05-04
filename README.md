# FL MOVE — Bunnell Family Transition Dashboard

A single-file, browser-based project management dashboard built for Justin and Anna Bunnell's Florida relocation and business-exit project.

## How to Open

1. Open `index.html` directly in Chrome, Safari, or Firefox.
2. No server, no install, no build step required.
3. All data is saved automatically in your browser's localStorage.

---

## What It Does

This dashboard helps Justin and Anna track every dimension of the Florida move across four strategic pathways:

| Pathway | Summary |
|---|---|
| Sell / Close Retro | Exit RetroMotion. Prioritize W2, client wrap-up, asset liquidation. |
| Sell / Close Venetian | Exit lounge/beverages, keep RetroMotion as portable creative platform. |
| **Keep Retro + Close Venetian** *(default)* | Exit Venetian, keep RetroMotion lean. Anna's FL role + Justin W2/freelance. |
| Sell / Close Both | Maximum simplification. Household protection, W2 pivot, debt clarity. |

The selected pathway reorders and reprioritizes tasks automatically without deleting anything.

---

## Key Features

### Pathways
- Four tabs at the top of the page
- Click any pathway to switch — tasks for that pathway float to the top
- Tasks not relevant to the active pathway appear with reduced opacity
- Click the pencil (✎) icon on any pathway tab to edit its name, subtitle, or strategic focus text

### Tasks
- Three recurring sections: **Daily**, **Weekly**, **Monthly**
- Plus a **One-time** section for pathway-specific action items
- ~75 pre-loaded seed tasks covering every dimension of the project
- Click the status circle on any card to cycle through: Not Started → In Progress → Blocked → Done
- Click anywhere on a card to expand inline details
- Click the ✎ icon to open the full task editor

### Task Editor Modal
- Edit all fields: title, description, owner, frequency, category, priority, status, due date, notes, attachments/links
- Add and check off subtasks
- Select which pathways the task applies to
- Toggle auto-rollover on/off
- View rollover history (read-only table of all past rollovers)
- Set dependencies on other tasks
- Duplicate or delete tasks

### Rollover Logic
Every time you open the app (and every minute while it's open), the app checks for overdue tasks. For any task where:
- Status is not "Done"
- Due date is in the past
- Auto-rollover is enabled

...the app will roll the due date to today, increment the rollover counter, and log the rollover. Tasks rolled 3 or more times get an orange warning badge. A "Rollover Log" button in the header shows the full history.

### Readiness Score
A 0–100 score in the top-right of the dashboard showing how ready the family is to move, calculated from progress across all task categories:
- Red (0–39): Early stages
- Orange (40–59): Building momentum
- Yellow (60–79): Strong progress
- Green (80–100): High readiness

### Dashboard View
- Today's top 5 critical/high tasks (filtered by active pathway)
- Overdue, blocked, and this-week task counts
- Open tasks by owner (Justin / Anna / Both / External Advisor)
- Readiness score
- Status breakdown chart

### Filtering & Bulk Edit
- Each task section has filter dropdowns for owner, category, status, and priority, plus a text search
- "Bulk Edit" mode lets you select multiple tasks and change their status, priority, or owner in one action
- Up/Down arrows on each card reorder tasks; use "Reset Order" to restore recommended pathway order

### Import / Export
In the dashboard's Data Tools panel:
- **Export JSON** — full backup of all tasks and pathway settings
- **Export CSV** — spreadsheet-friendly export of task titles, owners, statuses, etc.
- **Import JSON** — restore from a previous export (merges tasks and pathways)
- **Reset to Demo Data** — starts over with the original seed tasks (with confirmation)

---

## Data Storage

All data lives in your browser's `localStorage` under these keys:
- `flmove_tasks`
- `flmove_pathways`
- `flmove_activePathway`

**Important:** localStorage is browser and device specific. To move data between devices or back it up, use **Export JSON** and then **Import JSON** on the other device.

---

## Color Guide

| Person / Priority | Color |
|---|---|
| Justin | Blue |
| Anna | Pink |
| Both | Purple |
| External Advisor | Gray |
| Critical | Red |
| High | Orange |
| Medium | Yellow |
| Low | Green |

---

## Tips

- The preferred pathway ("Keep Retro + Close Venetian") is selected by default.
- Export your JSON at least weekly as a backup — browser data can be cleared.
- Use the "Notes" and "Attachments/Links" fields in the task editor to store context, links to documents, and decisions made.
- The Readiness Score updates in real time as you mark tasks Done.
- Blocked tasks are highlighted in red — clear them first each week.

---

*FL MOVE — Bunnell Family Transition Dashboard*
