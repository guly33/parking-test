FROM oven/bun:1

WORKDIR /app

COPY package.json .
RUN bun install --production

COPY . .

CMD ["bun", "index.ts"]
