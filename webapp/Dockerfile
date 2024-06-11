FROM node:20 as base
RUN npm install -g @angular/cli
WORKDIR /srv/sonddr
COPY --from=shared . ../shared
RUN (cd ../shared && npm install && npm run build)

# dev image
# -----------------------------------------------
FROM base as dev
# install here because serve mode, needs --volume
# listen on 80 to match prod
CMD npm install && ng serve --host 0.0.0.0 --port 80 --disable-host-check

# prod image
# -----------------------------------------------
FROM base as build
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM httpd:2.4 as prod
COPY httpd.conf /usr/local/apache2/conf/httpd.conf
COPY --from=build /srv/sonddr/dist/sonddr-webapp/ /usr/local/apache2/htdocs/
