# eng-recall

A small, mobile-first flashcard app built from the [Engineering Recall Bank](https://app.notion.com/p/5bb8d2d8610d4a6c9276089122764048) in Notion. Open-ended mode contains a static snapshot of 86 Notion cards plus 16 extra interview fundamentals. MCQ mode contains 100 questions, including code-reading and fill-in-the-blank examples. There is no backend, account, or tracking. Mode, category, current cards, scores, and the current shuffle are saved in the browser.

For MCQs, choosing an option grades it once and reveals the correct answer and explanation. Open-ended cards can be self-scored after revealing the answer. Scores show correct answers out of attempted cards within the selected mode and category. MCQ order and each card's options are shuffled independently when a fresh session begins; they remain stable across reloads. Reset confirms before clearing both modes' progress and scores, then starts a new MCQ shuffle. The shuffle implementation and tests are in `shuffle.mjs` and `shuffle.test.mjs`.

## Run locally

Serve this directory with any static web server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A static server is needed because the app fetches `cards.json`.

## Deploy

Deploy the repository as a static site. Vercel can use **Other** as the framework preset with no build command and `.` as the output directory. GitHub Pages can publish the repository root from `main`.

The questions and answers in `cards.json` are a snapshot of the Notion bank. `extra-open.json`, `mcq.json`, and `mcq-extra.json` are app-only additions, not Notion entries. Edits in Notion do not automatically update the site; refresh `cards.json` and redeploy to publish changes.
