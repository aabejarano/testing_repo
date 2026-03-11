# Use the official Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.56.0-noble

WORKDIR /app

# Copy all project files including pre-installed node_modules
COPY package.json package-lock.json ./
COPY node_modules/ ./node_modules/
COPY playwright.config.ts ./
COPY features/ ./features/
COPY scripts/ ./scripts/
COPY data/ ./data/

# Pre-process BDD feature files (expands external data references into Gherkin tables)
RUN node scripts/preprocess-features.js

# Run the tests as the default command
CMD ["npx", "playwright", "test", "--reporter=list"]
