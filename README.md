# vitess-explain

This is a simple wrapper around the vitess/vtexplain docker image to make running explain queries easier.

### Setup

You'll need:

First, you'll need a directory somewhere (in this example `./data`) with three files:
  - `./data/vschema.json` with your vschema
  - `./data/schema.sql` with your SQL schema
  - `./data/queries.sql` with a list of sql queries, 1 per line


### Running it

#### Demo

The image comes bundled with some demo data, so you can just do:

```
docker run latentflip/vitess-explain`
```

to see some output


#### Add your data

Mount your directory (from [#setup](#setup)) into the image with `-v`. The first part is the full path to your directory, the second must always be `/data`:

```
docker run -v "$PWD/data:/data" latentflip/vitess-explain
```

This will output in a summary mode:

```
GOOD (only 1 shard query)
===================================================
SELECT * FROM users WHERE name="Philip";

BAD (more than one shard query)
===================================================
SELECT * FROM users;

Truncated ERRORS
===================================================


ERRORS
===================================================
ERROR: vtexplain execute error in 'SELECT * FROM users WHERE name="as': syntax error at position 35 near 'as'

NO PLAN
===================================================
```

#### Change modes

You can specify an output mode with `-e "OUTPUT=..."`

##### Human Mode

```
docker run -e "OUTPUT=human" latentflip/vitess-explain
```

This will output in `vtexplain`'s text output, one per query in `query.sql`

```
----------------------------------------------------------------------
SELECT * FROM users

1 mainkeyspace/-20: select * from users limit 10001
1 mainkeyspace/20-40: select * from users limit 10001
1 mainkeyspace/40-60: select * from users limit 10001
1 mainkeyspace/60-80: select * from users limit 10001
1 mainkeyspace/80-a0: select * from users limit 10001
1 mainkeyspace/a0-c0: select * from users limit 10001
1 mainkeyspace/c0-e0: select * from users limit 10001
1 mainkeyspace/e0-: select * from users limit 10001

----------------------------------------------------------------------

----------------------------------------------------------------------
SELECT * FROM users WHERE name="Philip"

1 mainkeyspace/20-40: select user_id from users_name_idx where name = 'Philip' limit 10001
2 mainkeyspace/-20: select * from users where name = 'Philip' limit 10001

----------------------------------------------------------------------

ERROR: vtexplain execute error in 'SELECT * FROM users WHERE name="as': syntax error at position 35 near 'as'
```

#### JSON mode

```
docker run -e "OUTPUT=json" latentflip/vitess-explain
```

This will output json:

```
[
  {
    "query": "SELECT * FROM users;",
    "cleaned_query": "SELECT * FROM users;",
    "result": [
      {
        "SQL": "SELECT * FROM users",
        "Plans": [
          {
            "QueryType": "SELECT",
            "Original": "SELECT * FROM users",
            "Instructions": {
              "OperatorType": "Route",
              "Variant": "SelectScatter",
              "Keyspace": {
                "Name": "mainkeyspace",
                "Sharded": true
              },
              "FieldQuery": "select * from users where 1 != 1",
              "Query": "select * from users",
              "Table": "users"
            },
            "ExecCount": 1,
            "ShardQueries": 8,
            "Rows": 8
          }
        ],
        "TabletActions": {
          "mainkeyspace/-20": {
            "TabletQueries": [
              {
                "Time": 1,
                "SQL": "select * from users",
                "BindVars": {
  ...
```
