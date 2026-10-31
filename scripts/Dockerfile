FROM node:25-alpine
WORKDIR /app
# ogr2ogr converts the Natural Earth shapefiles to GeoJSON.
RUN apk add --no-cache gdal-tools
COPY scripts/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY scripts/*.ts ./
# Make the scripts readable by the unprivileged user whatever their mode on the host.
RUN chmod 644 *.ts
# Never run as root. Compose sets the uid/gid so output files belong to the host user.
USER node
ENTRYPOINT ["node", "process-countries.ts"]
CMD ["/output"]
