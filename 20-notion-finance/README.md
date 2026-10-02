# Notion finance widget

This read-only widget shows day, month, and year finance summaries from the existing Notion databases. It includes cash-flow bars, a category donut, monthly budget progress, recent entries, and separate credit-card totals. It does not save finance entries in browser storage or write to Notion.

It requires the private Netlify Function in `../netlify/functions/notion-finance.mjs`. The function reads Notion with a server-side integration token and requires a separate access key from the viewer. Both keys must be configured as Netlify environment variables, never in the public files. See the root README for setup and deployment instructions.

The background, surface, accent, text, muted text, border, and spending colors are editable in Appearance. This widget defaults to a charcoal palette that blends with Notion Dark. Motion stops when reduced motion is requested.
