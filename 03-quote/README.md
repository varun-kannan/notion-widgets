# Image quote

Editable quote over an image, GIF, or video background, with upload or URL, fit, blur, font, alignment, and overlay controls.

Background options in Settings:
- Paste an HTTPS or HTTP URL to an image, GIF, or video (MP4, WebM). Use this for anything large. The host must allow embedding the file.
- Or upload a PNG, JPEG, WebP, GIF, AVIF, MP4, or WebM file up to 3 MB. Uploads are saved in browser storage, so keep them small.
- Background type is detected from the file; set it by hand if a URL has no file extension.
- Videos play muted and loop. They stay paused when the device asks for reduced motion.
- Fit (fill and crop, show whole media, stretch), a color behind the media, blur, and overlay darkness are adjustable.
- With no URL or upload, the bundled image is used.

This folder is self-contained. Upload it to a static HTTPS host, or deploy all twelve folders together and embed this folder's URL in Notion.

Start with a 370px-tall embed, then drag its bottom edge in Notion to fit your content. No fixed height is guaranteed after entering data.

Use Settings for colors and widget options. Personal records stay in browser storage, not in a Notion database. If your Notion app blocks embedded storage, changes may be temporary. Open the hosted widget in a browser and export a backup before changing apps, browsers, devices, or hosts.

When deployed together on one origin, Calendar and Upcoming Events share events; Habit Summary and Current Streaks share habits, subject to browser storage partitioning. Separate deployments cannot share data automatically.

See the parent README.md for privacy, deployment, and backup instructions. No build step or dependencies are required.

