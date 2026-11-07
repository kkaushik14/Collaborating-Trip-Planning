import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const template = await readFile(new URL('.env.vercel.example', root), 'utf8')
const content = template
  .replace('JWT_ACCESS_SECRET=GENERATE_WITH_npm_run_env_vercel', `JWT_ACCESS_SECRET=${randomBytes(48).toString('hex')}`)
  .replace('JWT_REFRESH_SECRET=GENERATE_WITH_npm_run_env_vercel', `JWT_REFRESH_SECRET=${randomBytes(48).toString('hex')}`)

for (const [name, value] of [
  ['.env.vercel.local', content],
  ['frontend/.env.production', await readFile(new URL('frontend/.env.production.example', root), 'utf8')],
]) {
  try {
    await writeFile(new URL(name, root), value, { flag: 'wx', mode: 0o600 })
    console.log(`Created ${name}; secret values are not printed.`)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    console.log(`Kept existing ${name}.`)
  }
}
