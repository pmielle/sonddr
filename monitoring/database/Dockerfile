FROM prom/prometheus
COPY prometheus.yml /prometheus.yml
CMD ["--web.external-url=/monitoring/database", "--config.file=/prometheus.yml"]
