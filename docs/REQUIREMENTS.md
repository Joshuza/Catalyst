# Nexus OS Requirements

Place this file at `docs/REQUIREMENTS.md`. It is a structured digest of the Nexus OS UX specification (`Nexus_OS_UX_Specification_Visual.pdf`). Keep a copy of the PDF at `docs/spec/Nexus_OS_UX_Specification_Visual.pdf` for reference. This file is the authoritative list you build and test against.

Conventions:
- **MUST** is required. **SHOULD** is expected unless there is a recorded reason. **MAY** is optional.
- Each requirement has an ID. Tests and reports refer to these IDs.
- Example sentences in quotes are test cases. Use them verbatim.
- Numbers in examples (amounts, distances, durations) are illustrations, never constants.

---

## UX: Global behavior

| ID | Requirement |
|---|---|
| UX-01 | MUST present a single-page tiled canvas. No multi-page navigation or sprawling tabs. Modules expand in place or as overlays and return to the canvas. |
| UX-02 | MUST apply progressive disclosure. Information, widgets, and controls appear only when relevant to the user's current state. In a declared deep-work block, promotional feeds are suppressed, the inbox collapses to a single count, and modules unrelated to the active task are dimmed. |
| UX-03 | MUST pair high-density data with generous whitespace in every module. |
| UX-04 | MUST provide Cmd/Ctrl+K for global search and Cmd/Ctrl+J for the command bar, from anywhere in the app. |
| UX-05 | MUST make every mutation undoable, including drags, tags, and quick commands. |
| UX-06 | MUST be quiet by default. Notifications are batched into the Morning Command Briefing and the Sunday Reset. Interruptions are reserved for events with a real deadline, such as a trial ending within 48 hours. |
| UX-07 | MUST be local first: functions offline, keeps data on the device, and sends nothing to a server unless the user connects an adapter. |
| UX-08 | MUST respect reduced motion and provide light and dark themes. |
| UX-09 | MUST be keyboard operable and meet WCAG 2.2 AA. |

Acceptance: from a fresh profile, a user can reach every module without leaving the canvas, and the app is fully usable offline after first load.

---

## ONB: First-boot onboarding

Structure: three phases, one question per screen, a thin progress line, instant inline validation. Implausible values (for example an income with an extra zero) get a gentle inline prompt, never a blocking dialog.

| ID | Requirement |
|---|---|
| ONB-01 | MUST present single-focus input screens with a progress line and inline validation. |
| ONB-02 | MUST allow any question to be skipped. Skipped questions MUST be collected into a checklist that is shown during the first Sunday Reset. |
| ONB-03 | MUST support completing all three phases in under five minutes of typical use. |
| ONB-04 | MUST allow every answer to be edited later from settings, with edits propagating to projections without repeating onboarding. |

### Phase I: Financial baseline and pay periods

| ID | Requirement |
|---|---|
| ONB-I-01 | MUST ask for pay frequency as a radio selection: Weekly, Bi-Weekly, Semi-Monthly, Monthly, Irregular Freelance Schedule. |
| ONB-I-02 | MUST ask for baseline expected net income per pay period after taxes, using a currency field with locale formatting. It MUST accept shorthand such as `4.5k` and expand it in place. |
| ONB-I-03 | MUST support secondary recurring income streams through a dynamic adder (side-hustle, rental income, quarterly dividends), each with an amount, cadence, and next deposit date. |
| ONB-I-04 | MUST ask for current liquid savings, which anchors the start of the cash flow graph. Retirement and illiquid assets are excluded and the helper text says so. |
| ONB-I-05 | MUST, for Irregular Freelance Schedule, ask for typical invoice size, typical payment delay in days, and a conservative low-month estimate. |
| ONB-I-06 | MUST show a split-screen live preview. As values change, the preview of the 3-line income curve updates in real time. Animation is about 250 ms and becomes instant under reduced motion. |
| ONB-I-07 | MUST validate: income is positive, deposit dates fall in a sensible window, savings are not negative unless the user enables an overdraft option. |

Acceptance example: "$4,500 bi-weekly" produces a 12-month baseline with 26 deposit points and flags months that contain three paychecks.

### Phase II: Working week and mobility profile

| ID | Requirement |
|---|---|
| ONB-II-01 | MUST capture working days and core hours with an interactive day grid and time range sliders. Different hours may be painted on different days (four-day weeks, split shifts, part time). |
| ONB-II-02 | MUST capture transit assets as combinable checkboxes: Personal Car, Bicycle, Walking Only. |
| ONB-II-03 | MUST capture a maximum comfortable walking distance by slider from 0.5 to 5.0 miles, or "Prefer Not to Walk". The slider shows an approximate walking time. Support both miles and kilometers by locale. |
| ONB-II-04 | MUST capture preferred public transit modes as multi-select: Commuter Trains, Subway, City Buses, Ferries, None. |
| ONB-II-05 | MUST use visual toggle cards with icons instead of drop-down menus, with arrow-key navigation and space to toggle. |
| ONB-II-06 | MUST allow temporary overrides (for example a week of remote work or a borrowed car) without changing the permanent configuration. |

### Phase III: Dietary intelligence, media feed, and outdoors

| ID | Requirement |
|---|---|
| ONB-III-01 | MUST capture dietary restrictions and severe allergies as multi-select tags: Gluten-Free, Vegan, Vegetarian, Nut Allergy, Halal, Keto, Dairy-Free, None. Custom tags MAY be added. |
| ONB-III-02 | MUST capture followed publications, newsletters, and creators. Input accepts a name or pasted link and resolves it to a feed through an adapter. A tag cloud of about twenty common sources is shown as clickable chips. Examples: Substack publishers, NYT, F1.com, The Verge, Vox. |
| ONB-III-03 | MUST capture preferred outdoor activities as multi-select: Hiking, Cycling, Running, Paddling, Climbing. These seed the Hikes and Activity Planner. |
| ONB-III-04 | MUST offer an optional Pet Tracker toggle. When on, it expands fields for pet name, species, and birthdate. When off, the module does not appear anywhere in the interface. It can be enabled later. |

---

## SRCH: Global search

| ID | Requirement |
|---|---|
| SRCH-01 | MUST open the Spotlight on Cmd/Ctrl+K from anywhere. |
| SRCH-02 | MUST search every transaction, note, task, message, and recipe using a local-first in-memory index. Works offline. |
| SRCH-03 | MUST show results as the user types, grouped by type, with the most likely match highlighted. Enter opens the top match. Tab reveals secondary actions such as copying a transaction amount. |
| SRCH-04 | MUST interpret plain-language filters without special syntax, such as "receipts over $100 in October" and "unread from Maria". |
| SRCH-05 | SHOULD offer quick actions as verbs, such as "new task" and "export October". |
| SRCH-06 | MUST never persist the index in plaintext and MUST send nothing to a server. |

Acceptance example: searching "receipt" jumps to an invoice. Promotional messages stay out of the way.

---

## INB: Tri-Fold Inbox

| ID | Requirement |
|---|---|
| INB-01 | MUST sort incoming messages automatically into three streams: Work, Personal, Promotional. |
| INB-02 | MUST show segmented pills with unread counts. Keys 1, 2, 3 switch streams. |
| INB-03 | Work stream MUST aggregate client deliverables, chat threads, repository updates, and assignment rubrics. Items with a deadline MUST link to task cards automatically and show a countdown. |
| INB-04 | Personal stream MUST handle direct messages and sync with Relationship CRM check-in reminders. A contact long out of touch is gently highlighted. |
| INB-05 | Promotional stream MUST capture marketing newsletters and shopping drops, allow 1-click saving to a research vault, never trigger alerts, and be bulk-archivable. |
| INB-06 | MUST let the user correct a sorting decision with a single gesture. Corrections MUST be learned locally. A sender moved twice from Promo to Personal stays in Personal. |

---

## FIN: 3-Line Financial Simulator and Subscription Sentinel

| ID | Requirement |
|---|---|
| FIN-01 | MUST draw Line 1, Baseline Income, from the configured pay periods and secondary streams, rising on each pay date. |
| FIN-02 | MUST draw Line 2, the Cart Dotted Line. Each cart item has a purchase date. The line subtracts its cost from that date onward. Zones near zero are shaded with a warning color. |
| FIN-03 | MUST draw Line 3, Actual Cash Flow, from verified income and expenses cleared through receipt parsing and logged transactions. |
| FIN-04 | MUST let the user drag cart items along the timeline, with Line 2 recalculating continuously. A tooltip follows the pointer and shows the projected balance on the date under it. |
| FIN-05 | MUST, when an item is dropped on a date with a projected shortfall, settle it to the nearest safe date and explain why, with an option to override. |
| FIN-06 | MUST provide a keyboard and touch alternative to dragging, such as selecting an item and moving its date with arrow keys. |
| FIN-07 | MUST support named scenarios (for example Conservative, Holiday) as layers over the baseline that never modify real records. |
| FIN-08 | MUST flag months containing three paychecks for bi-weekly schedules. |
| FIN-09 | MUST draw irregular income as a band between conservative and typical estimates. |
| FIN-10 | Financial Velocity Strip MUST show today's position against baseline with a plain-language sentence. |
| FIN-11 | Subscription Sentinel MUST list recurring charges sorted by next charge date, with annualized cost beside monthly cost, and a separate trials section with a countdown that shifts from neutral to urgent as the end date nears. |
| FIN-12 | Sentinel MUST provide a direct outbound link to the billing page and a one-tap calendar reminder. It MUST NEVER cancel anything on the user's behalf. |
| FIN-13 | MUST raise a high-priority banner when a free trial ends within 48 hours or a bill is due today. |

Acceptance example: a $300 item dragged to next Tuesday keeps Line 2 above zero. Dragging it three days earlier crosses zero and the explanation states that the next paycheck lands too late.

---

## SUR: Post-purchase survey

| ID | Requirement |
|---|---|
| SUR-01 | MUST open a mandatory, non-skippable modal on the scheduled purchase date. It cannot be dismissed until required answers are saved. |
| SUR-02 | Question 1: "Did you purchase the scheduled item?" with Bought, Postponed, Canceled. |
| SUR-03 | Question 2: final exact cost including taxes and shipping, a numeric input pre-filled with the estimate. |
| SUR-04 | Question 3: Regret Index and emotional tagging, a 1 to 5 rating or category tags: Essential, Joyful, Impulsive, Regretted. |
| SUR-05 | Postponed MUST ask for a new date and move the cart marker. Canceled MUST remove the dip from Line 2 and record the savings as a small positive note on the graph. |
| SUR-06 | Completing the survey MUST update Line 3. |
| SUR-07 | The whole survey MUST be completable by keyboard alone. |

---

## RCP: Receipt parsing and export

| ID | Requirement |
|---|---|
| RCP-01 | MUST provide a drop zone that accepts receipt PDFs and email screenshots, multiple files at once, processed in the background while the user keeps working. |
| RCP-02 | MUST extract vendor, date, line items, tax, and total, and match the receipt to a pending purchase or a recorded transaction. |
| RCP-03 | High-confidence matches MUST apply silently. Low-confidence results MUST show a short confirmation card with editable values. |
| RCP-04 | Corrections MUST be remembered per vendor and used to improve later parsing. |
| RCP-05 | MUST update Actual Cash Flow when a receipt is accepted. |
| RCP-06 | MUST generate Excel and CSV expense reports with 1 click for any date range or tag. Columns: date, vendor, category, amount, tax, original receipt file name. |
| RCP-07 | Regret and emotional tags MUST be excluded from exports unless the user chooses to include them. |
| RCP-08 | A monthly summary export MAY be scheduled to appear in the Sunday Reset. |

---

## TERM: Natural language command terminal

| ID | Requirement |
|---|---|
| TERM-01 | MUST open a floating minimalist command bar on Cmd/Ctrl+J without replacing the current view, and close it after a successful command. |
| TERM-02 | MUST parse intent (purchase, reminder or event, task, note), amounts, dates, and times, and show a short preview of what it understood before Enter confirms. |
| TERM-03 | MUST ask exactly one targeted clarifying question when unsure, never guess. Example: whether "next Thursday" means this week or the following one. |
| TERM-04 | MUST use the working-week configuration to resolve phrases such as "after work". |
| TERM-05 | MUST recall recent commands with the up arrow and show an undo toast after each action. |

Required test sentences (verbatim):
- "buy keyboard $150 on 11/20" creates a wishlist item, places it in the cart, and plots the dotted-line dip on that date.
- "reminder client call next Thursday at 3pm" creates a calendar event.
- "reminder dentist on Friday" creates an event and the calendar shifts to the week containing Friday.
- "lunch with Sam tomorrow at noon" creates an event.
- "finish report by Wednesday" creates a task card with a deadline countdown and offers Small Steps.

---

## CAL: Morphing calendar

| ID | Requirement |
|---|---|
| CAL-01 | MUST provide a 30-minute and hourly view for deep work, study, and time blocking. Task cards can be dragged into slots. The view shows how much of the working day is unassigned. |
| CAL-02 | MUST provide a 3-hour to 12-hour pacing view showing morning, afternoon, and evening segments. |
| CAL-03 | MUST provide a 1-day and working-week view aligned to the configured working week. Days outside the working week are visually quieter. |
| CAL-04 | MUST zoom with a pinch gesture, Cmd/Ctrl plus scroll, and number keys. Transitions preserve orientation and respect reduced motion. |
| CAL-05 | MUST draw travel time between events as thin connecting bars when a route is known. |
| CAL-06 | Core hours are protected. The system MUST NOT auto-schedule personal errands inside them without confirmation. |
| CAL-07 | Every drag has a keyboard alternative. |

---

## TASK: Task cards and the AI Task Decomposer

| ID | Requirement |
|---|---|
| TASK-01 | MUST provide task cards as small workspaces. Students: reference websites, Google or Word docs, assignment files, grading rubrics. Professionals: chat channels and code repositories. |
| TASK-02 | MUST embed direct links for reference URLs and cloud documents, with titles. |
| TASK-03 | MUST show an automated deadline countdown with an urgency indicator that moves calm to amber to strong red, accounting for remaining available working hours and not only the calendar date. |
| TASK-04 | MUST use collapsible context drawers: Resources, Rubric or Requirements, Conversation, Notes. Collapsed, a card shows only title, countdown, and progress. The last-used drawer reopens first. |
| TASK-05 | MUST show progress as a percentage rolled up from completed micro-tasks. |
| TASK-06 | Every card MUST have a "Small Steps" button. It sends only that card's content to the connected `AiProvider`, shows a summary of what was sent, and receives a proposed set of micro-tasks. |
| TASK-07 | The proposed plan MUST respect the working week, existing commitments, and the deadline, with buffers, and MUST be shown for edit, reorder, or rejection. Nothing reaches the calendar without confirmation. |
| TASK-08 | MUST provide one-click AI prompt generation, assembled from the card's rubric, notes, and links, that can be copied even when no provider is connected. |
| TASK-09 | All task features MUST still work manually when no AI account is connected or it is disconnected. |

Acceptance example: a history essay with a rubric yields a 4-day schedule (sources, outline, first draft, revision) fitted around existing events.

---

## FOOD: Recipes and grocery sync

| ID | Requirement |
|---|---|
| FOOD-01 | MUST import recipes from a link, pasted text, or manual entry, and standardize units. |
| FOOD-02 | MUST scale ingredient quantities when servings change and round to practical purchasing units. |
| FOOD-03 | MUST merge duplicate ingredients across recipes and compare against a pantry list so the grocery list shows only what is missing. |
| FOOD-04 | MUST push missing items to a smart grocery list grouped by store section, with one-click "Add to Grocery List". The list can be linked to a planned shopping trip. |
| FOOD-05 | MUST apply dietary tags as hard filters. A conflicting recipe is hidden entirely. See AGENTS.md section 9, item 11, for the unverified case. |
| FOOD-06 | Local Discovery Engine MUST, when free time appears on the calendar, suggest cafes and restaurants matching dietary needs and reach. |

---

## TRN: Smart Transit Router

| ID | Requirement |
|---|---|
| TRN-01 | MUST compute routes from the mobility profile (driving, biking, walking within limits, trains, buses, ferries) and compare travel time across all active modes side by side. |
| TRN-02 | MUST treat the maximum walking distance as a hard threshold. A route needing a longer walk MUST NOT be offered as a primary option. |
| TRN-03 | MUST exclude any transit mode the user excluded from all comparisons. |
| TRN-04 | MUST flag weather-dependent options when rain or extreme temperatures are forecast, and MAY downgrade a long walk in heat or suggest an earlier departure. |
| TRN-05 | MUST check the next calendar event so a suggestion never makes the user late. |
| TRN-06 | Recipe or venue details MUST appear beside route options in a split view. |

Acceptance example: a vegan bakery for Sunday lunch yields a train option that fits the walking limit, and a rain forecast moves departure earlier.

---

## OUT: Hikes and Activity Planner

| ID | Requirement |
|---|---|
| OUT-01 | MUST, when the calendar shows a free block, rank hikes and other activities against the mobility profile, onboarding activity picks, and the forecast. Activity types: Hike, Bike ride, Run, Paddle, Climb, Park day. |
| OUT-02 | Ranking inputs MUST include distance and elevation tolerance, trail length, difficulty, daylight remaining, forecast, and travel time from the Smart Transit Router. A car-free user sees trailheads reachable by train, ferry, or bus first. |
| OUT-03 | A hike card MUST show distance, elevation gain, estimated moving time, travel time to the trailhead, difficulty, a loop or out-and-back flag, and an elevation profile. |
| OUT-04 | MUST show an hourly weather window with the best window highlighted, plus sunset time and a back-by time. |
| OUT-05 | A dog-friendly filter MUST appear only when the Pet Tracker is on. |
| OUT-06 | MUST offer to share the plan with a trusted contact from the Relationship CRM. Sharing is an explicit user action using a copyable message, with no automatic sending. |
| OUT-07 | MUST auto-plan on selection: a calendar block, a route, and a gear checklist. Missing gear items can be dragged into the cart so the 3-line graph shows affordability. |
| OUT-08 | MUST provide an activity log with miles, elevation gain, and outings, and a weekly miles chart. The weekly summary appears in the Sunday Reset. |
| OUT-09 | Trail data comes from adapters. v1 includes a clearly labeled sample set and a manual entry form. |

Acceptance example: with a free Saturday morning, the planner proposes a loop that fits, warns about afternoon heat, blocks the calendar, and adds a water and sunscreen checklist.

---

## PET, CRM, SCR: Life maintenance modules

| ID | Requirement |
|---|---|
| PET-01 | Pet Tracker MUST manage vet schedules, vaccinations, and food restocks, generating reminders from species and birthdate. Food restock links to the grocery list. |
| CRM-01 | Relationship CRM MUST maintain contact logs, a gift idea pad, and check-in nudges. A preferred contact rhythm is set per person. Gift ideas resurface before birthdays and holidays. |
| SCR-01 | Screen Time MUST accept imported or manual samples and correlate digital use with focus and spending. Patterns are shown as plain observations without judgment. |

---

## RST: The Sunday Reset

| ID | Requirement |
|---|---|
| RST-01 | MUST offer a guided weekly loop of about five minutes, as a step-by-step wizard with one screen per step, a progress indicator, and a completion summary. |
| RST-02 | Step 1, Inbox Triage: process unread messages and bulk-archive promotional clutter. Flag only messages that seem to need a reply. |
| RST-03 | Step 2, Financial Audit: review projected vs actual spending, accept or correct low-confidence receipt matches, complete pending surveys. |
| RST-04 | Step 3, Schedule Alignment: drag prioritized tasks onto next week's calendar. The system proposes a draft arrangement. A weekend outing from the Hikes and Activity Planner can be dropped in. |
| RST-05 | MUST allow any step to be skipped, and the ritual to be moved to another day. |
| RST-06 | MUST surface onboarding questions that were skipped (ONB-02), review pet vaccination dates, and show the weekly activity summary. |

---

## BRF: Morning Command Briefing

| ID | Requirement |
|---|---|
| BRF-01 | MUST be the landing screen each morning, designed to be reviewed in about 30 seconds on a normal day. |
| BRF-02 | MUST include the Financial Velocity Strip, the Subscription Sentinel banner, the Tri-Fold Inbox summary (Work and Personal emphasized, Promo muted), the top 3 unread curated news cards with estimated reading time, and a compact micro-schedule of the next three items with travel time already calculated. |
| BRF-03 | MUST use an asymmetric grid where the most urgent item takes the wide primary tile. Tile size follows urgency rather than fixed placement. |
| BRF-04 | Tiles MUST expand in place and collapse again. Each tile has controls to pin, resize, or hide. |
| BRF-05 | Tiles the user consistently skips MAY shrink over time, and the user MUST be told whenever this happens. Pinned tiles never shrink. |
| BRF-06 | On weekends the briefing MUST swap work tasks for household items, a Hikes and Activity outlook, and the coming Sunday Reset. |
| BRF-07 | After several days away, MUST open with a catch-up summary ordered by importance. |
| BRF-08 | News is ranked by recency and the user's own reading history, never by engagement metrics. Sources can be muted, paused for a week, or removed in one tap. |

---

## Explicitly out of scope for v1

Native mobile and desktop apps, real bank account connections, real mail and chat integrations, live trail and transit APIs, OS-level screen time sync, multi-user accounts, cloud sync, payment processing, and any automatic cancellation of subscriptions. All of these may exist later as adapters. None may be started in v1 without explicit instruction.
