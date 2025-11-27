FROM oven/bun:latest AS base

WORKDIR /app

FROM base AS install

COPY package.json bun.lock /tmp/dev/
RUN cd /tmp/dev && bun install --frozen-lockfile

FROM base

COPY --from=install /tmp/dev/node_modules node_modules
COPY index.ts .

USER bun
ENTRYPOINT ["bun", "run", "index.ts"]
