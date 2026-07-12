FROM node:22-alpine as builder

WORKDIR /app

COPY package*.json ./

# Server prod deps only (native sqlite3 build needs the toolchain)
RUN apk --no-cache --virtual build-dependencies add python3 make g++ \
    && npm install --production \
    && apk del build-dependencies

COPY . .

# Client build needs its devDeps (vite, typescript) — this whole stage is
# discarded, so installing them here doesn't bloat the runtime image.
RUN mkdir -p ./public ./data \
    && cd ./client \
    && npm install \
    && npm run build \
    && cd .. \
    && mv ./client/build/* ./public \
    && rm -rf ./client

FROM node:22-alpine

COPY --from=builder /app /app

WORKDIR /app

# Run as the built-in non-root `node` user. It must own /app because the app
# writes runtime files into both data/ (db, uploads, config) and
# public/flame.css (the custom-CSS feature).
RUN chown -R node:node /app

USER node

EXPOSE 5005

ENV NODE_ENV=production
# No default PASSWORD: the server refuses to authenticate with an unset or
# known-default password. Set PASSWORD (or PASSWORD_FILE) at run time.

CMD ["node", "server.js"]
