const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const { ROOT } = require('./helpers/load-game');

const GOOD_IDS = [
  'wheat', 'salt', 'wood', 'coal', 'tea', 'coffee', 'cloth', 'copper',
  'steel', 'oil', 'chip', 'medicine', 'phone', 'car', 'gold', 'machine-tool',
  'diamond', 'antique', 'spacecraft', 'lunar-soil'
];

function runPython(args) {
  return spawnSync('python', args, {
    cwd: ROOT,
    encoding: 'utf8'
  });
}

test('art manifest defines the complete twenty-good source set', () => {
  const manifestPath = path.join(ROOT, 'assets', 'art', 'manifest.json');
  assert.equal(fs.existsSync(manifestPath), true);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.version, 1);
  assert.equal(manifest.reference, 'assets/art/reference/style-anchor-v1.png');
  assert.deepEqual(Object.keys(manifest.goods).sort(), GOOD_IDS.slice().sort());
  assert.equal(Object.keys(manifest.brand).length, 2);
  assert.equal(Object.keys(manifest.environment).length, 4);

  for (const id of GOOD_IDS) {
    const asset = manifest.goods[id];
    assert.equal(asset.source, `assets/art/source/goods/good-${id}.png`);
    assert.equal(asset.master, `assets/art/runtime/goods/good-${id}-512.png`);
    assert.equal(asset.webp128, `assets/art/runtime/goods/good-${id}-128.webp`);
    assert.equal(asset.webp256, `assets/art/runtime/goods/good-${id}-256.webp`);
  }
});

test('art processor normalizes an RGBA icon and preserves transparency', () => {
  const script = path.join(ROOT, 'scripts', 'process-art-assets.py');
  assert.equal(fs.existsSync(script), true);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trader-art-'));
  const source = path.join(tempDir, 'source.png');
  const master = path.join(tempDir, 'master.png');
  const webp128 = path.join(tempDir, 'icon-128.webp');
  const webp256 = path.join(tempDir, 'icon-256.webp');

  const create = runPython([
    '-c',
    'from PIL import Image, ImageDraw; import sys; im=Image.new("RGBA",(800,600),(0,0,0,0)); ImageDraw.Draw(im).rectangle((260,120,540,480),fill=(180,40,30,255)); im.save(sys.argv[1])',
    source
  ]);
  assert.equal(create.status, 0, create.stderr);

  const process = runPython([
    script, 'icon', source,
    '--master', master,
    '--webp-128', webp128,
    '--webp-256', webp256
  ]);
  assert.equal(process.status, 0, process.stderr);

  const inspect = runPython([
    '-c',
    'from PIL import Image; import json,sys; im=Image.open(sys.argv[1]).convert("RGBA"); print(json.dumps({"size":im.size,"bbox":im.getbbox(),"corners":[im.getpixel((0,0))[3],im.getpixel((511,511))[3]]}))',
    master
  ]);
  assert.equal(inspect.status, 0, inspect.stderr);
  const details = JSON.parse(inspect.stdout);
  assert.deepEqual(details.size, [512, 512]);
  assert.deepEqual(details.corners, [0, 0]);
  assert.ok(details.bbox[0] >= 50 && details.bbox[1] >= 50);
  assert.ok(details.bbox[2] <= 462 && details.bbox[3] <= 462);
  assert.equal(fs.existsSync(webp128), true);
  assert.equal(fs.existsSync(webp256), true);
});

test('art processor exposes all production modes', () => {
  const script = path.join(ROOT, 'scripts', 'process-art-assets.py');
  const result = runPython([script, '--help']);

  assert.equal(result.status, 0, result.stderr);
  for (const mode of ['chroma-key', 'icon', 'brand', 'texture', 'scenery', 'contact-sheet']) {
    assert.match(result.stdout, new RegExp(`\\b${mode}\\b`));
  }
});

test('art processor removes a solid chroma background without erasing the subject', () => {
  const script = path.join(ROOT, 'scripts', 'process-art-assets.py');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trader-chroma-'));
  const source = path.join(tempDir, 'source.png');
  const output = path.join(tempDir, 'cutout.png');

  const create = runPython([
    '-c',
    'from PIL import Image, ImageDraw; import sys; im=Image.new("RGB",(100,100),(255,0,255)); ImageDraw.Draw(im).ellipse((25,20,75,80),fill=(190,130,40)); im.save(sys.argv[1])',
    source
  ]);
  assert.equal(create.status, 0, create.stderr);

  const process = runPython([
    script, 'chroma-key', source,
    '--output', output,
    '--key', 'magenta'
  ]);
  assert.equal(process.status, 0, process.stderr);

  const inspect = runPython([
    '-c',
    'from PIL import Image; import json,sys; im=Image.open(sys.argv[1]).convert("RGBA"); print(json.dumps({"corner":im.getpixel((0,0)),"center":im.getpixel((50,50)),"mode":im.mode}))',
    output
  ]);
  assert.equal(inspect.status, 0, inspect.stderr);
  const details = JSON.parse(inspect.stdout);
  assert.equal(details.mode, 'RGBA');
  assert.equal(details.corner[3], 0);
  assert.equal(details.center[3], 255);
});
