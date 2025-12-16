// Quick prototype test for parser-v2
const { parseQuestionnaire } = require('./lib/parser-v2.ts')

const text = `Q: What is your name?
TEXT`

try {
  const result = parseQuestionnaire(text)
  console.log('SUCCESS!')
  console.log(JSON.stringify(result, null, 2))
} catch (err) {
  console.error('FAILED:', err.message)
  console.error(err.stack)
}
