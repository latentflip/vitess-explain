#!/bin/bash

#rm -rf /tmp/explain-it-data
#mkdir -p /tmp/explain-it-data
#
docker build -t vitess-explain . 1>&2 > /dev/null
#
#cp $1 /tmp/explain-it-data/schema.sql
#cp $2 /tmp/explain-it-data/vschema.json
#cp $3 /tmp/explain-it-data/sql.sql

docker run -it \
  $@ \
  vitess-explain
  # -v "/$PWD/data:/data" \
  #-e "KEYSPACE=notifications_entries" \
  #-e "OUTPUT=json" \
