FROM node:21
WORKDIR /srv/sonddr
COPY --from=shared . ../shared/
RUN (cd ../shared && npm install && npm run build)
COPY package.json .
RUN npm install
COPY . .
RUN mkdir uploads
CMD npm start
