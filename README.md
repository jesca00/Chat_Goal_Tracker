# Your Goals

A personal monthly goal and daily consistency tracker built with vanilla HTML, CSS, and JavaScript.

## Run it
https://jesca00.github.io/Chat_Goal_Tracker/
Because the JavaScript uses ES modules, open the project through a local server rather than directly as a `file://` page.

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

If Python's server is not installed, use the VS Code Live Server extension.

## Included

- Your Today checklist with date navigation and a custom date picker
- Create, edit, pause, resume, and delete goals
- Individual contribution calendars
- Weekly progress and streak summaries
- Seven-day and target-completion celebrations
- Monthly goal overview
- Light and dark pink themes
- Local browser storage
- JSON backup export and import
- Responsive layout and reduced-motion support

## Data

Goals and completion history are stored in this browser's `localStorage`. They do not sync between browsers or computers. Export a JSON backup before clearing browser data or moving to another device.

## Notes

This is a first complete working version. The optional description field is used as supporting text on the daily checklist; the daily action is the item that gets checked off. The optional target amount is a simple milestone based on completed daily check-ins. It works best when one completed daily action represents one unit toward the target.
