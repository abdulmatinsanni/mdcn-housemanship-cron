FROM node:16-alpine

RUN apk update && \
    apk add --no-cache yarn libpng-dev && \
    apk upgrade

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

CMD ["yarn", "start"]
