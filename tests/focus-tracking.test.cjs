const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, globals = {}) {
  const source = fs.readFileSync(require('node:path').join(__dirname, '..', file), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
  const context = { exports: {}, URL, URLSearchParams, Date, ...globals }
  vm.runInNewContext(outputText, context)
  return context.exports
}
const { createFocusTracker } = load('lib/focus-tracking.ts')
function storage() {
  const data = new Map()
  return { getItem: k => data.get(k) || null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) }
}

test('resume does not duplicate starts; rerenders do not duplicate milestones', () => {
  const events = []
  const tracker = createFocusTracker((name) => events.push(name))
  tracker.start(1500)
  tracker.progress(299, 1500)
  tracker.start(1500)
  tracker.progress(300, 1500)
  tracker.progress(300, 1500)
  tracker.progress(1500, 1500)
  tracker.progress(1501, 1500)
  tracker.progress(1502, 1500)
  tracker.end(1510, 1500, 'stop')
  assert.deepEqual(events, ['focus_start', 'focus_qualified', 'focus_goal_reached', 'focus_overtime', 'focus_complete'])
})
test('early stop and switching are abandonment; a new attempt can complete', () => {
  const events = []
  const tracker = createFocusTracker(name => events.push(name))
  tracker.start(60); tracker.end(10, 60, 'stop')
  tracker.start(60); tracker.end(70, 60, 'switch')
  tracker.start(60); tracker.end(60, 60, 'stop')
  assert.equal(events.filter(x => x === 'focus_abandon').length, 2)
  assert.equal(events.filter(x => x === 'focus_complete').length, 1)
  assert.equal(events.includes('focus_qualified'), false)
})
test('return requires qualified use on another UTC day, once per day across reloads', () => {
  const saved = storage(), events = []
  const run = (day, elapsed) => {
    const tracker = createFocusTracker((name, params) => events.push({ name, params }), saved, () => new Date(day))
    tracker.start(1500); tracker.progress(elapsed, 1500)
  }
  run('2026-09-05T12:00:00Z', 300)
  run('2026-09-05T14:00:00Z', 300)
  run('2026-09-06T12:00:00Z', 299)
  assert.equal(events.filter(x => x.name === 'focus_return').length, 0)
  run('2026-09-06T13:00:00Z', 300)
  run('2026-09-06T15:00:00Z', 300)
  const returns = events.filter(x => x.name === 'focus_return')
  assert.equal(returns.length, 1)
  assert.equal(returns[0].params.days_since_first_focus, 1)
})
test('storage and analytics failures cannot break timer operations', () => {
  const fail = () => { throw Error('blocked') }
  const tracker = createFocusTracker(fail, { getItem: fail, setItem: fail })
  assert.doesNotThrow(() => { tracker.start(60); tracker.progress(300, 60); tracker.end(300, 60, 'stop') })
})
test('GA sends a static title and only allowlisted attribution, initialized once', () => {
  const saved = storage()
  const window = { location: new URL('https://flowfocus.ivopfaffen.com/?utm_source=reddit&private=secret&analytics_debug=1') }
  const analytics = load('lib/analytics.ts', { window, localStorage: saved, document: { title: 'PRIVATE TASK', referrer: 'https://example.com/private?secret=1' } })
  analytics.initializeAnalytics(); analytics.initializeAnalytics()
  analytics.trackFocus('focus_start', { goal_seconds: 1500 })
  const entries = window.dataLayer.map(x => Array.from(x))
  assert.equal(entries.filter(x => x[0] === 'config').length, 1)
  const config = entries.find(x => x[0] === 'config')[2]
  assert.equal(config.page_title, 'FlowFocus')
  assert.equal(config.page_location, 'https://flowfocus.ivopfaffen.com/?utm_source=reddit')
  assert.equal(config.page_referrer, 'https://example.com')
  assert.equal(config.debug_mode, true)
  assert.equal(JSON.stringify(entries).includes('PRIVATE TASK'), false)
})
test('preview and opted-out browsers never initialize GA', () => {
  for (const href of ['http://localhost:3000/', 'https://preview.vercel.app/', 'https://flowfocus.ivopfaffen.com/?analytics=off']) {
    const window = { location: new URL(href) }
    const analytics = load('lib/analytics.ts', { window, localStorage: storage(), document: {} })
    assert.equal(analytics.initializeAnalytics(), false)
    assert.equal(window.dataLayer, undefined)
  }
})
