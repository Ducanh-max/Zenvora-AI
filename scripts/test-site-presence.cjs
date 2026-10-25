const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function loadPresence() {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/site-presence.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Date, Promise });
  return exports;
}

test('reconciled metadata counts one live session and ignores malformed payloads', () => {
  const { visitorsFromState } = loadPresence();
  const visitors = visitorsFromState({
    session: [{ online_at: '2026-10-25T01:00:00Z' }, { online_at: '2026-10-25T00:00:00Z' }],
    invalid: [{ online_at: '<script>' }], empty: [],
  });
  assert.equal(visitors.length, 1);
  assert.equal(visitors[0].connectedAt, '2026-10-25T00:00:00Z');
});

test('join, leave, reconnect and cleanup update presence without stale totals', async () => {
  const { watchSitePresence } = loadPresence();
  let status, sync, tracks = 0, removed = 0;
  let state = { a: [{ online_at: '2026-10-25T00:00:00Z' }] };
  const channel = {
    on: (_type, _filter, handler) => { sync = handler; return channel; },
    subscribe: handler => { status = handler; return channel; },
    track: async payload => { tracks++; assert.deepEqual(Object.keys(payload), ['online_at']); return 'ok'; },
    presenceState: () => state,
  };
  const snapshots = [];
  const client = { channel: () => channel, removeChannel: async () => { removed++; } };
  const stop = watchSitePresence(client, 'a', s => snapshots.push(s));
  assert.equal(tracks, 0, 'wait for subscription before tracking');
  status('SUBSCRIBED'); await new Promise(setImmediate);
  assert.equal(tracks, 1);
  assert.equal(snapshots.at(-1).visitors.length, 1);
  state.b = [{ online_at: '2026-10-25T00:01:00Z' }]; sync();
  assert.equal(snapshots.at(-1).visitors.length, 2);
  delete state.b; sync();
  assert.equal(snapshots.at(-1).visitors.length, 1);
  status('CHANNEL_ERROR');
  assert.equal(snapshots.at(-1).status, 'unavailable');
  assert.equal(snapshots.at(-1).visitors.length, 0, 'do not retain stale totals');
  status('SUBSCRIBED'); await new Promise(setImmediate);
  assert.equal(tracks, 2, 're-track after reconnect');
  stop();
  const count = snapshots.length;
  status('CLOSED'); sync();
  assert.equal(snapshots.length, count, 'ignore late events after teardown');
  assert.equal(removed, 1);
});
