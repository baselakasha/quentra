# Demo recording

Automated screen recording of the app, built with [testreel](https://github.com/greentfrapp/testreel) (Playwright, MIT) and ffmpeg. Output: `docs/demo.mp4`/`.gif` (full, ~1 min) and `docs/demo-short.mp4`/`.gif` (~8 s) and `docs/demo-medium.mp4`/`.gif` (~30 s, used in the README).

```bash
# 1. Start the stack and seed the demo data (login: alexm / demo1234)
docker compose up -d
docker exec quentra-api yarn seed

# 2. Record (first time: npm install && npx playwright install chromium)
cd demo && npm install
npm run demo        # full walkthrough
npm run demo:medium # 30-second version (README)
npm run demo:short  # 8-second version
```

The flows live in `recording.json`, `recording-medium.json` and `recording-short.json`. It only reads, sorts, expands/collapses budgets and toggles Need/Want back, so it can be re-run. It expects the seeded data with no budget pinned (a pinned budget is always open and sorted first).
