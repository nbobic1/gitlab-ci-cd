FROM node:19-alpine

EXPOSE 8080

ADD . /app
WORKDIR /app/js
RUN npm install 

ENTRYPOINT ["node", "index.js"]
