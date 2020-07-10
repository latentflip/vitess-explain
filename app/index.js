const fs = require('fs')
const execFileSync = require('child_process').execFileSync;

let vschema = JSON.parse(fs.readFileSync('/data/vschema.json'))

if (vschema.vindexes) {
  vschema = { [process.env.KEYSPACE || "mainkeyspace"]: vschema }
}


const output = process.env.OUTPUT || "summary" // or text or json
const outputMode = (output === "human") ? "text" : "json"

const keyspace = Object.keys(vschema)[0]

for (const table of Object.keys(vschema[keyspace].tables)) {
  delete vschema[keyspace].tables[table].autoIncrement
  delete vschema[keyspace].tables[table].auto_increment
}

fs.writeFileSync('/tmp/vschema.json', JSON.stringify(vschema, null, 2))

const queries = fs.readFileSync('/data/queries.sql').toString().split("\n")

const results = queries.filter(query => query.length > 0).map(query => {
  let result = { query: query }
  result.cleaned_query = query.replace("limit 500001", '')
  try {
    const stdout = execFileSync('/vt/bin/vtexplain', ['-shards', '8', '-vschema-file', '/tmp/vschema.json', '-schema-file', '/data/schema.sql', '--output-mode', outputMode, '-sql', result.cleaned_query], { stdio: [] }).toString()

    if (outputMode === "text") {
      console.log(stdout)
    } else {
      result.result = JSON.parse(stdout)
    }
  } catch (e) {
    if (outputMode === "text") {
      console.log(e.stdout.toString())
    } else {
      result.error = e.stdout.toString()
    }
  }

  return result
})

if (output === "human") return

if (output === "summary") {
  const errors = results.filter(result => !!result.error)
  const truncated = errors.filter(result => result.error.includes("syntax error at position 409"))
  const errorReal = errors.filter(result => !result.error.includes("syntax error at position 409"))

  const notErrors = results.filter(result => !!result.result)
  const hasPlan = notErrors.filter(result => result.result[0] && result.result[0].Plans && result.result[0].Plans[0] && result.result[0].Plans[0].ShardQueries)
  const noPlan = notErrors.filter(result => !(result.result[0] && result.result[0].Plans && result.result[0].Plans[0] && result.result[0].Plans[0].ShardQueries))
  const good = hasPlan.filter(result => result.result[0].Plans[0].ShardQueries === 1)
  const bad = hasPlan.filter(result => result.result[0].Plans[0].ShardQueries > 1)

  console.log("GOOD (only 1 shard query)")
  console.log("===================================================")
  console.log(good.map(r => r.cleaned_query).join("\n"))

  console.log("\nBAD (more than one shard query)")
  console.log("===================================================")
  console.log(bad.map(r => r.cleaned_query).join("\n"))

  console.log("\nTruncated ERRORS")
  console.log("===================================================")
  console.log(truncated.map(r => r.cleaned_query).join("\n"))

  console.log("\nERRORS")
  console.log("===================================================")
  console.log(errorReal.map(r => r.error.trim()).join("\n"))

  console.log("\nNO PLAN")
  console.log("===================================================")
  console.log(noPlan.map(r => JSON.stringify(r)).join("\n"))
} else {
  console.log(JSON.stringify(results, null, 2))
}
