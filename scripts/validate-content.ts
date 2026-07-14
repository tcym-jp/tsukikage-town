import { catalog, validateCatalog } from '../src/content'

const result = validateCatalog(catalog)

console.log(`Content catalog: ${catalog.metadata.title}`)
console.log(`Schema ${catalog.metadata.schemaVersion} / ${catalog.metadata.locale}`)
for (const [label, count] of Object.entries(result.counts)) {
  console.log(`  ${label}: ${count}`)
}

if (result.warnings.length > 0) {
  console.warn(`Warnings (${result.warnings.length}):`)
  for (const warning of result.warnings) console.warn(`  - ${warning}`)
}

if (!result.valid) {
  console.error(`Errors (${result.errors.length}):`)
  for (const error of result.errors) console.error(`  - ${error}`)
  process.exitCode = 1
} else {
  console.log('Content validation: OK')
}
