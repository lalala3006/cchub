FROM node:20-alpine

WORKDIR /app

# Install Python and build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/main.js"]
