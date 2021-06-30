ARG TAG=latest
FROM vitess/base:${TAG} as base

FROM node:14.5.0-stretch-slim as node

# Set up Vitess environment (just enough to run pre-built Go binaries)
ENV VTROOT /vt

# Prepare directory structure.
RUN mkdir -p /vt/bin && mkdir -p /vtdataroot

# Copy binaries
COPY --from=base /vt/bin/vtexplain /vt/bin/

# add vitess user/group and add permissions
RUN groupadd -r --gid 2000 vitess && \
   useradd -r -g vitess --uid 3000 vitess && \
   chown -R vitess:vitess /vt && \
   chown -R vitess:vitess /vtdataroot

RUN mkdir -p /data
RUN mkdir -p /vtexplaindata

RUN mkdir -p /app
COPY ./app/index.js /app/index.js
COPY ./data /data

CMD ["node", "app/index.js"]
