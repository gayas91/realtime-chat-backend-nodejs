FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund; \
    else \
      npm install --omit=dev --no-audit --no-fund; \
    fi \
    && npm cache clean --force

COPY --chown=node:node . .

RUN mkdir -p /usr/src/app/uploads \
    && chown -R node:node /usr/src/app/uploads

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
