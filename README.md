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

## Running with Docker Compose (proxy + tests together)

A `docker-compose.yml` is provided that starts a **mitmproxy** container and
routes all Playwright browser traffic through it.

**1. Start everything**
```bash
docker compose up --build
```

**2. Inspect live traffic**

Open the mitmweb UI in your browser while the tests are running:
```
http://localhost:8081
```
Every HTTP/HTTPS request made by the browser will appear there.

**3. Trust the mitmproxy CA (for HTTPS inspection)**

On the first run mitmproxy generates a CA certificate stored in the
`mitmproxy-data` Docker volume. To trust it on your host machine:

```bash
# Copy the cert out of the volume
docker run --rm \
  -v testing_repo_mitmproxy-data:/data \
  alpine cat /data/mitmproxy-ca-cert.pem > mitmproxy-ca-cert.pem

# macOS
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain mitmproxy-ca-cert.pem

# Linux (Debian/Ubuntu)
sudo cp mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy.crt
sudo update-ca-certificates
```

**4. Run tests only (reuse a running proxy)**

If you already have the proxy running and want to run just the test container:
```bash
docker compose run --rm playwright
```

**5. Point any other tool at the proxy**

The proxy listens on `http://localhost:8080` from the host. You can direct
any HTTP client, browser, or CLI tool at it:
```bash
curl -x http://localhost:8080 https://www.google.com
HTTP_PROXY=http://localhost:8080 npm test
```

---

## Project Structure

```
.
├── Dockerfile                  # Playwright test-runner container
├── docker-compose.yml          # Proxy + test-runner orchestration
├── proxy/
│   └── Dockerfile              # mitmproxy container
├── playwright.config.ts        # Playwright configuration (browser, timeouts, retries)
├── features/
│   ├── google-search.feature   # BDD feature file
│   ├── fixtures.ts             # Playwright-BDD fixtures
│   └── steps/                  # Step definitions
├── scripts/
│   └── preprocess-features.js  # Expands external data references into Gherkin tables
├── data/                       # External data files for Scenario Outlines
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
