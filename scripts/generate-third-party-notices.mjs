import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const packageDirectories = execFileSync(npmCommand, ['ls', '--omit=dev', '--all', '--parseable'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
  .split(/\r?\n/u)
  .map((entry) => entry.trim())
  .filter((entry) => entry && resolve(entry) !== root)

const packages = new Map()

for (const directory of packageDirectories) {
  const manifestPath = join(directory, 'package.json')
  let manifest

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    continue
  }

  const key = `${manifest.name}@${manifest.version}`
  if (packages.has(key)) continue

  const licenseFiles = readdirSync(directory)
    .filter((name) => /^(licen[cs]e|copying|notice)(\.|$)/iu.test(name))
    .filter((name) => statSync(join(directory, name)).isFile())
    .sort((left, right) => left.localeCompare(right, 'en'))

  packages.set(key, {
    key,
    license: manifest.license ?? 'not declared',
    repository:
      typeof manifest.repository === 'string'
        ? manifest.repository
        : (manifest.repository?.url ?? manifest.homepage ?? 'not declared'),
    notices: licenseFiles.map((name) => ({
      name,
      text: readFileSync(join(directory, name), 'utf8').trim(),
    })),
  })
}

const sections = [...packages.values()]
  .sort((left, right) => left.key.localeCompare(right.key, 'en'))
  .map((entry) => {
    const header = [
      '='.repeat(78),
      entry.key,
      `Declared license: ${entry.license}`,
      `Source: ${entry.repository}`,
      '='.repeat(78),
    ].join('\n')

    if (entry.notices.length === 0) {
      return `${header}\nNo standalone LICENSE/COPYING/NOTICE file was included in the package.\n`
    }

    const notices = entry.notices.map(({ name, text }) => `--- ${name} ---\n${text}`).join('\n\n')
    return `${header}\n${notices}\n`
  })

const output = [
  'TSUKIKAGE TOWN - THIRD-PARTY LICENSES AND NOTICES',
  '',
  'Generated from the production dependency tree fixed by package-lock.json.',
  'This file is included in the static site so copyright and license notices',
  'remain available with the distributed browser bundle.',
  '',
  ...sections,
].join('\n')

writeFileSync(join(root, 'public', 'THIRD_PARTY_LICENSES.txt'), output, 'utf8')
console.log(`Wrote notices for ${packages.size} production packages.`)
