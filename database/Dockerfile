FROM mongo:6
# these are referenced by init.sh
COPY goals.json /my_data/
COPY init.js /my_data/
# mongo executes what's in this folder
COPY init.sh /docker-entrypoint-initdb.d/
CMD ["--replSet", "sonddr"]
