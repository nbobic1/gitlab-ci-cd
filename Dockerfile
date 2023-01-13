FROM node:19

WORKDIR /app
ADD . .

RUN npm install


