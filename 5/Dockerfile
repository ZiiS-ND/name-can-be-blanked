FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV DB_FILE=/data/tasks.db
EXPOSE 3000
CMD ["node", "dist/index.js"]
