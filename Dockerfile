FROM node:19-alpine

EXPOSE 8080

#WORKDIR /app
ADD . /app

#RUN npm install ./js

WORKDIR /app/js

ENTRYPOINT ["node", "index.js"]
