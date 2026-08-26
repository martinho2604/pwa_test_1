import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, getOnlineStatus } from '../src/note-utils.ts';

test('escapeHtml encodes characters that can create markup', () => {
  assert.equal(escapeHtml(`<script>alert('x')</script>`), '&lt;script&gt;alert(&#039;x&#039;)&lt;/script&gt;');
});

test('escapeHtml leaves ordinary note text unchanged', () => {
  assert.equal(escapeHtml('記得買牛奶'), '記得買牛奶');
});

test('getOnlineStatus returns the online presentation', () => {
  assert.deepEqual(getOnlineStatus(true), {
    label: '連線中',
    className: 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800'
  });
});

test('getOnlineStatus returns the offline presentation', () => {
  assert.deepEqual(getOnlineStatus(false), {
    label: '離線模式',
    className: 'px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800'
  });
});