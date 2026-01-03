FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN apk add --no-cache postgresql-client

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 5000

CMD ["sh", "entrypoint.sh"]
