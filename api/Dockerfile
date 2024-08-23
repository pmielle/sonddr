FROM node:21
WORKDIR /srv/sonddr
COPY --from=shared . ../shared/
RUN (cd ../shared && npm install && npm run build)
COPY . .
RUN npm install
CMD npm start
