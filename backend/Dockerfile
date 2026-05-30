FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json ./

# Install dependencies using bun
RUN bun install --production

# Copy the rest of the application
COPY . .

# Expose the default port
EXPOSE 3001

# Run the backend
CMD ["bun", "run", "start"]
