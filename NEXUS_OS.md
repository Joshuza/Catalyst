# Nexus OS operating guide

Follow [README.md](README.md) to install and start the app. Your records are local to this browser and origin; development and production addresses may have different data stores.

## Navigation and capture

The left sidebar opens dedicated pages, as requested. At 360 px it becomes a navigation drawer. Browser Back returns to the preceding page. Light, dark, and system themes are available in the sidebar. Animations respect reduced motion.

**Cmd/Ctrl+K** searches saved notes, tasks, transactions, messages, recipes, and product records. Type normally; arrow keys choose a result, Enter opens it, Tab exposes secondary actions, and Escape restores focus. Try `receipts over $100 in October` or `unread from Maria` with your own data or explicit Sample data.

**Cmd/Ctrl+J** opens the terminal. It previews the intent, amount, date, and time before confirmation. Examples:

```text
buy keyboard $150 on 11/20
reminder dentist on Friday
lunch with Sam tomorrow at noon
finish report by Wednesday
note compare camera lenses
parking ticket $45 due next Tuesday
```

Ambiguous next-weekday wording asks for a date. Commands indicating an intention create a planned purchase; `bought` or `paid` records a cleared cost. Fines remain planned costs until payment is explicitly recorded. Up recalls recent commands. Commands and stored-record changes support undo/redo; hold deletion requires 1.6 seconds and early release cancels it.

## Set up a trustworthy graph

Set liquid savings to the balance **immediately before the anchor date's entries**. Deposits and cleared transactions on that date are applied afterward. Refreshing the savings figure starts a new anchor, preventing old transactions from being counted twice. Keep income and expense records accurate: projected pay does not become verified cash automatically.

Income rises on real pay dates. The dotted cart includes planned purchases and recurring subscriptions. Actual cash flow uses cleared transactions only. Goal reservations preserve funds when finding safe purchase dates; they do not move real money. Scenarios can change future primary-income assumptions and purchase timing without modifying verified records. Different currencies are not converted or summed together. Financial planning uses integer cents and does not provide exchange rates.

Drag a cart marker, focus it and use arrow keys (Shift moves two weeks), or edit its date. Unsafe drops offer the nearest safe date over the displayed horizon and an explicit override. A due purchase opens a required survey: Bought with final cost and emotion/regret, Postponed with a new date, or Canceled. Escape and outside clicks cannot dismiss it. Postponing a purchase answers the survey; no separate snooze is added.

Subscriptions show recurring dates, annualized cost, trial countdown, and the billing link you supplied. Add a calendar reminder or log a bill you already paid. Recording a bill adds its transaction, retains its history, and advances the renewal without month-end drift. The app never cancels subscriptions or makes payments.

## Receipts and reports

PDFs with text are extracted locally. Enable English screenshot OCR only if desired; the worker and model assets are served from the app and cached locally, without sending receipt images elsewhere. Receipt input is limited to 20 MiB per file; OCR also limits image pixel count. Multiple files are processed sequentially in the background. Unclear values stay editable. High-confidence matches can reconcile automatically, while unmatched receipts require acceptance. Vendor tax corrections are remembered locally.

Expense reports filter by date and category, include currency, tax and original filename, and omit emotion/regret unless selected. Planning reports separately show estimate, actual, variance, scenario and status, leaving actual blank for unpurchased items. CSV formula-like text is escaped. JSON backups preserve original receipt files; expense spreadsheets include filenames rather than attachments.

## Plan time and context

Calendar offers 30-minute, hourly, pacing (3/6/12 hours), and working-week views. Number keys, pinch, and Cmd/Ctrl+scroll change zoom. Known travel appears beside events. Protected working shifts need confirmation for personal events. Use date/time fields as the touch and keyboard alternative to drag.

Task cards hold student or professional resources, local PDF/text/Markdown context, rubrics, notes, and conversation text. Remaining available working hours determine urgency. Copy a selected card's AI prompt, paste a JSON plan or enter steps manually. The Sample AI checkbox deliberately enables a deterministic demonstration, not a live account. Edit/reorder the proposed steps and approve; the scheduler checks working shifts, commitments, buffers, and deadlines before saving.

Research cards store local PNG/JPEG/WebP images, quotes, links, notes, pros/cons, priorities and estimates. Their tags are deterministic keywords rather than an AI semantic model. A card can be planned with a button or dragged into the cart area. Notes & records supplies a simple text scratchpad; a rich block editor is not implemented.

Itineraries group dated stops and travel/event reminders, with original ticket links and booking references. A future ticket cost creates a linked cart purchase. Record already-paid tickets in Receipts or Transactions. The app does not fabricate admission QR codes, scrape confirmations, or book travel.

## Food, routes, and life maintenance

Import recipe text or enter ingredients manually, with an optional source URL. Scaling merges units, duplicate ingredients and pantry stock before adding missing groceries. Dietary conflicts are hidden; unverified recipes are labeled neutrally. Ingredient heuristics do not certify allergy safety. Venue suggestions use manually entered dietary declarations and active transport modes.

Routes compare entered travel times, apply a hard walking ceiling, flag manual weather, and check return time against the next event. They do not calculate a live road network. Add trail data or load explicit Sample trails. Activity selection uses the playing-card interaction; choosing a feasible outing saves its calendar block, route, and gear checklist. Share by copying a message yourself. Pet heat limits, daylight and your tolerances participate in ranking.

Pet Tracker appears only when enabled. It stores vet, vaccination, food, prescription and weight entries, links food to groceries, and offers age-aware planning prompts. Care intervals are entered by you. Contacts retain check-ins, gift ideas and preferred rhythms. Health reminders support recurrence and calendar placement. Habits count actual check-in dates; screen-time data is manual or CSV and correlations need enough varied data. Listen ranks saved podcast/music links against selected context and research tags. Reading supports saved links and local RSS/Atom imports, with source mute/pause/remove.

Briefing summarizes urgent financial signals, the next three events, inbox counts and reading. Deep work saves a focus block, suppresses reading/promotions, and dims unrelated navigation. Pin, hide, and More/Less detail controls apply to briefing sections. Weekly Reset guides Inbox Triage, Financial Audit, and Schedule Alignment, including skipped onboarding questions, pet care, activity totals and an editable next-week draft. Approve before task blocks reach Calendar.

## Honest boundaries

No remote service is connected by default. Live accounts, automatic news fetching, product metadata scraping, AI-generated semantic tagging, native screen-time sync and automatic ticket ingestion are future adapter work. An emergency personal-records vault was excluded at your request. [docs/PROGRESS.md](docs/PROGRESS.md) records partial requirements, tests and remaining work; it is not a claim that the entire future service ecosystem exists.
