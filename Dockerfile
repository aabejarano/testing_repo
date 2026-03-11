# Use the official Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.56.0-noble

WORKDIR /app

# Copy dependency files first for better layer caching
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm ci

# Copy the rest of the project
COPY playwright.config.ts ./
COPY tests/ ./tests/

# Run the tests as the default command
CMD ["npx", "playwright", "test", "--reporter=list"]
