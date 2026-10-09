FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app/API

COPY API/package.json API/package-lock.json ./
RUN npm ci --omit=dev

COPY API/index.js ./index.js
COPY API/src ./src
COPY frontend-project /app/frontend-project

EXPOSE 3001

USER node

CMD ["npm", "start"]
