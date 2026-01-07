import fs from 'fs'
import path from 'path'

function findWebRoot(startDir) {
  let dir = startDir
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir
    dir = path.dirname(dir)
  }
  throw new Error('Cannot find web root!')
}

const ROOT = findWebRoot(process.cwd())

const SRC = path.join(ROOT, 'dist', 'index.html')
const DEST_DIR = path.join(ROOT, '..', 'android', 'app', 'src', 'main', 'assets')
const DEST = path.join(DEST_DIR, 'index.html')

console.log('Deploying launcher HTML...')

if (!fs.existsSync(SRC)) {
  console.error('❌ Source index.html not found:', SRC)
  process.exit(1)
}

// ensure assets dir exists
fs.mkdirSync(DEST_DIR, { recursive: true })

// remove old file if exists
if (fs.existsSync(DEST)) {
  fs.unlinkSync(DEST)
  console.log('🗑️  Removed old index.html')
}

// copy new file
fs.copyFileSync(SRC, DEST)

console.log('✅ index.html deployed successfully')
