FROM node:20-alpine

WORKDIR /var/www/freshcart/backend

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
