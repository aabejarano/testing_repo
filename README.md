# Playwright Google Search Tests

Automated browser test that searches Google for "4Runners" and verifies that a Toyota.com link appears in the results.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) (for containerized runs)

---

## Running Locally

**1. Install dependencies**
```bash
npm install
```

**2. Install the Chromium browser**
```bash
npx playwright install chromium
```

**3. Run the tests**
```bash
npm test
```

---

## Running with Docker

**1. Build the image**
```bash
docker build -t playwright-google-search .
```

**2. Run the tests**
```bash
docker run --rm playwright-google-search
```

**3. (Optional) Save the HTML report to your host machine**
```bash
docker run --rm \
  -v $(pwd)/playwright-report:/app/playwright-report \
  playwright-google-search \
  npx playwright test --reporter=html
```

Then open `playwright-report/index.html` in your browser.

---

## Project Structure

```
.
├── Dockerfile                  # Container definition
├── playwright.config.ts        # Playwright configuration (browser, timeouts, retries)
├── tests/
│   └── google-search.spec.ts   # Test: search Google for 4Runners, assert toyota.com appears
├── package.json
└── package-lock.json
```

---

## What the Test Does

1. Navigates to `https://www.google.com`
2. Accepts cookie consent if prompted (EU regions)
3. Types `4Runners` into the search box and submits
4. Waits for results to load
5. Asserts that at least one result links to `toyota.com`
