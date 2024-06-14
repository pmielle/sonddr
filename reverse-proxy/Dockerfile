# dev image
# -----------------------------------------------
FROM nginx as dev
COPY nginx-dev.conf /etc/nginx/nginx.conf

# prod image
# -----------------------------------------------
FROM nginx as prod
COPY nginx-prod.conf /etc/nginx/nginx.conf
