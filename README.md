# Notion widgets

Nineteen independent HTML/CSS/JavaScript widgets. Each numbered folder includes its own runtime and styles; the quote folder also contains the background image. No package installation, build process, subscription, or API key is required to run the files themselves. Hosting and weather services have their own usage limits.

## Widget list

- Time & date: `01-clock-date/`. Live clock, timezone, 12/24-hour format, optional seconds, and a custom caption.
- Countdown: `02-countdown/`. Target date/time or a number of days, optional progress, and days-since mode.
- Image quote: `03-quote/`. Editable quote over an image, GIF, or video background, with upload or URL, fit, blur, font, alignment, and overlay controls.
- Weather: `04-weather/`. City search, Celsius/Fahrenheit, current conditions, and a three-day forecast from Open-Meteo.
- Calendar: `05-calendar/`. Month view, event markers, day selection, and event creation/editing/deletion.
- Upcoming events: `06-upcoming-events/`. Upcoming calendar records with date horizon and category filtering.
- Current streaks: `07-current-streaks/`. Current and best daily habit streaks, plus editable seven-day check-ins.
- Today's focus: `08-todays-focus/`. Daily priority, notes, task entry, completion tracking, and date history.
- My spaces: `09-my-spaces/`. Editable, reorderable links to your Notion pages or other websites.
- Finance summary: `10-finance-summary/`. Income/expense entry, monthly budgets, category bars, balances, and transaction history.
- Habit summary: `11-habit-summary/`. Daily habit checklist, completion ring, editable history, and shared streak data.
- Skin-care routine: `12-skin-care/`. Configurable morning/evening steps, daily check-ins, notes, and saved routine history.
- Finance trend: `13-finance-trend/`. Animated line and area graph of monthly income, spending, or net.
- Spending pie / donut: `14-spending-pie/`. Interactive category breakdown with a configurable pie or donut chart.
- Income & spending bars: `15-income-expense-bars/`. Animated grouped bar chart with monthly net figures.
- Habit heatmap: `16-habit-heatmap/`. Interactive check-in grid across 13, 26, or 52 weeks.
- Habit progress bars: `17-habit-progress-bars/`. Completion rates and streaks compared across your daily habits.
- Event timeline: `18-event-timeline/`. Animated upcoming-event timeline connected to Calendar.
- 3D goal progress: `19-goal-orb/`. Configurable milestone with a 3D ring, direct controls, and optional motion.

The root index.html is only a preview and URL-copying library. Embed the individual widget addresses, not the library.

The new charts use SVG and CSS, without an external chart service or charting library. Pie segments and heatmap days can be selected; their data tables remain readable without animation. The Goal Progress widget uses CSS depth and can be switched to a flat, still view in Settings. Animations also stop when the device requests reduced motion.

## Preview locally

With a recent Node.js installed, open a terminal in this folder and run:

```
node serve.js
```

Open http://127.0.0.1:4173 in a browser. Stop the server with Ctrl+C. The server listens only on your computer. Opening index.html directly as a file can block the JavaScript modules.

## Deploy the complete set

Recommended for a simple manual upload: Netlify.

1. Keep all nineteen folders beside the root index.html. If using the ZIP, extract it first.
2. Sign in to Netlify and use its manual drag-and-drop deploy option.
3. Drop the extracted Widgets folder (the one containing index.html) into the deploy area. There is no build step.
4. Open the HTTPS site address Netlify provides.
5. In the library, choose Open widget or Copy embed URL.
6. On your existing Notion page, type /embed and paste that widget's HTTPS URL.
7. Resize the embed and move it into your existing columns. Do not replace the whole dashboard.
8. Use each widget's Settings button to configure its colors and content. Remove obsolete embeds only after the replacements work.

Keep the same site and domain when uploading updates. A new domain has a different browser storage area.

Official deployment guides:
- [Netlify manual deployment](https://docs.netlify.com/deploy/create-deploys/)
- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Vercel deployment options](https://vercel.com/docs/deployments)

Cloudflare Pages offers a Direct Upload workflow. Vercel supports Git and command-line deployment; these files can be served as a static project without a build command. This package has not been deployed to any provider. Check each provider's current plan limits before publishing.

## Settings and colors

Every widget has editable background, surface, primary, accent, text, muted text, border, and gradient colors. You can also change the font family, text size, padding density, background opacity, corner radius, and shadow. Four starting palettes are included.

Quote has separate serif/sans/monospace options, text size, alignment, italic styling, image upload or image URL, and overlay opacity. The image sits behind the quote. Default text: "Don't just exist. Live."

Copy theme link puts only appearance choices in the URL. It does not include events, money, check-ins, image uploads, or widget-specific settings. Use Export settings and Import settings to transfer a widget's configuration. Uploaded images are included in that settings backup.

A shared theme applies to widgets on the same origin and browser storage area. An explicit theme in an embed URL takes priority. If you used a theme link earlier, update that URL or remove its fragment to return to saved settings. Any color is allowed, so choose enough contrast for readable text.

## Data and privacy

- Personal data is stored locally in browser storage. It is not sent to Notion, a database, or our servers.
- Browser-local is not encrypted storage. Anyone using the same browser profile may see these records. Avoid sensitive financial or medical details on shared computers.
- Hosting publishes the source code and the bundled image. Personal entries and uploaded images are not written back into those hosted files.
- Calendar events are manually entered. There is no Google Calendar, Outlook, or Notion database connection in this version.
- Calendar and Upcoming Events share the events data group. Habit Summary and Current Streaks share the habits data group when deployed on the same origin.
- Finance Trend, Spending Pie, and Income & Spending Bars read the same transactions as Finance Summary. Habit Heatmap and Habit Progress Bars use the same check-ins as Habit Summary. Event Timeline uses Calendar events. Related charts include direct entry controls.
- Goal Progress is a standalone manual milestone. Use a distinct `?id=` value for each separate goal. Its 3D and motion effects are optional and respect reduced-motion settings.
- Browser and app iframe storage restrictions may separate or block embedded storage. A standalone browser tab and a Notion embed may not share a storage area. Test saving and reloading in the actual Notion app you use before relying on it.
- No cross-device or cross-browser sync is supplied. Clearing browser storage, changing domain, or using private browsing can lose records.
- If storage is blocked or full, a warning appears. Changes may only last in the current page; export data before closing it. Temporary fallback data does not synchronize between widgets.
- Weather city search and selected coordinates are sent to Open-Meteo. It also sees your network request. Weather refreshes on page load and approximately every 15 minutes while active. Cached weather is labeled when a request fails.
- Custom remote background images contact the image host. That host can see network requests. Use the bundled image or a local upload to avoid that external image request.
- No analytics, ads, external font downloads, authentication, or hidden API keys are included.

Weather attribution: [Open-Meteo](https://open-meteo.com/). City search uses its GeoNames-based geocoding service. Check the weather provider's terms before commercial use.

## Backups and separate collections

Each data-entry widget has Backup / restore. Export data separately from widget settings. Restore validates the file and asks before replacing the relevant data group. Export before deleting records or switching devices. Backup files contain your personal entries in readable JSON; store them privately and never include them in the hosted upload folder.

Finance backup includes transactions and per-month budgets/opening balances. The currency setting labels amounts without converting them. Balance is opening balance plus the selected month's income minus expenses; it is not a bank-connected balance.

Habits are daily habits. Current streak stays alive if yesterday was complete and today has not yet been checked. Best streak uses all recorded completions. Skin-care steps are your own routine, not treatment advice. Editing routine settings affects new sessions; saved sessions retain their original steps unless you explicitly replace them.

For a separate data collection, add ?space=work (or another short name) to every related widget URL. For multiple independent countdown/settings instances within the same collection, add ?id=holiday. Combine as ?space=personal&id=holiday. An id changes widget settings only, not shared events or habits.

## Limits and deliberate boundaries

- Events have a date, optional time, category, and notes. There is no recurring-event engine, invitation sending, or background notification service.
- Dates and event times use the device's local timezone. The Clock widget can display another timezone independently.
- Notion controls embed dimensions and surrounding page layout. These widgets cannot style Notion's native gallery or columns.
- Responsive layouts are designed for narrow columns; richer data lists will need taller embeds or scrolling.
- Uploaded quote images must be PNG, JPEG, or WebP, up to 800 KB. The bundled full-size image has no upload requirement.
- Data restore limit is 5 MB; settings restore limit is 2 MB.
- Read README.md before hosting backups or adding third-party scripts. Do not put API tokens in front-end code.

## Tests

Run `node --test tests/*.test.js` for date, streak, finance, sorting, import-validation, and package-integrity tests.

The static server in serve.js is for local preview only, not production hosting. It reads requested files under this folder and does not write records or provide authentication.
