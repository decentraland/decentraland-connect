const fs = require('fs')

fs.writeFileSync(
  'cjs/package.json',
  JSON.stringify({
    type: 'commonjs'
  })
)

fs.writeFileSync(
  'esm/package.json',
  JSON.stringify({
    type: 'module'
  })
)
