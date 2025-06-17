#node js 18 with apline linux
FROM node:18-apline

WORKDIR /use/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD [ "node","src/server.js" ]