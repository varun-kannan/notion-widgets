# Weight Realm

An animated, read-only visual for the existing Notion Weight Tracker. It reads the Weekly Tracker and Daily Tracker through `../netlify/functions/notion-weight.mjs`, using the same Netlify `NOTION_TOKEN` and `WIDGET_VIEW_KEY` as Notion finance. No token is placed in this public widget folder. Embed this folder's hosted URL after the private function is deployed and tested.

The scene uses original generated 3D-anime character artwork, CSS depth, pointer parallax, energy rings, and an animated line chart. Reduced-motion settings stop the effects. Appearance lets you change the background, surface, text, border, violet, and blue colors.

The visible rank and XP reward daily entries only. They do not reward rapid weight change. The weekly row's blank/zero end weight is treated as missing, not as a 76 kg reduction. A weight trend needs dated Daily Tracker rows with a positive Weight value. The Date title can be `YYYY-MM-DD`, `DD/MM/YYYY`, or an English month date such as `May 15, 2025`.

This widget reads data; add or correct entries in Notion. The current Daily Tracker has no rows, so its chart and nutrition panel will show honest empty states until entries are added. The Notion API connection for these two databases has not been live-tested yet.
