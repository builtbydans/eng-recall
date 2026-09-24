# eng-recall

A small, mobile-first flashcard app built from the [Engineering Recall Bank](https://app.notion.com/p/5bb8d2d8610d4a6c9276089122764048) in Notion. It contains a static snapshot of 86 cards, with no backend, account, or tracking. Progress (the current card and category) is saved in the browser.

## Run locally

Serve this directory with any static web server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A static server is needed because the app fetches `cards.json`.

## Deploy

Deploy the repository as a static site. Vercel can use **Other** as the framework preset with no build command and `.` as the output directory. GitHub Pages can publish the repository root from `main`.

The questions and answers are a snapshot of the Notion bank. Edits in Notion do not automatically update the site; refresh `cards.json` and redeploy to publish changes.
