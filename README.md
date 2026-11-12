# Zancut 2D
Voice + story in, finished 2D film out. Made by our own code and our own trained brain: **no outside AI**.
Run: `npm start` → http://localhost:4500 (Story → Storyboard → Render). Frames 16:9 / 9:16 / 1:1 / 4:5.
The brain learns from you: fix shots in the storyboard, press Make or "Teach the brain". See docs/MODEL_EVAL.md for measured accuracy and docs/STATUS.md for what is and is not done.

Tests: `npm run test:all`. Active modules, cleanup inventory and archived Studio history: [docs/CODEBASE_AUDIT.md](docs/CODEBASE_AUDIT.md).

Teaching curriculum and measured limits: [docs/TEACHING_REPORT.md](docs/TEACHING_REPORT.md). Build the original curriculum with `npm run teach:build`, train/evaluate the deployed model with `npm run teach:train`, and select decisions for review with `npm run teach:review -- story.txt review.json`. Review suggestions are never automatically fed into training.
