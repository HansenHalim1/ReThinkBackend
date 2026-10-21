import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { GET, OPTIONS } from '../app/api/videos/route.ts';
import { materials } from '../lib/curriculum.ts';
import { videoCatalog } from '../lib/videos.ts';

test('public video catalog supports Swift, browser CORS, filtering and empty topics', async () => {
  const original = process.env.ALLOWED_ORIGINS;
  const assetBase = process.env.VIDEO_ASSET_BASE_URL;
  delete process.env.VIDEO_ASSET_BASE_URL;
  process.env.ALLOWED_ORIGINS = 'https://learn.example.com';
  const request = (query = '', origin?: string) => new Request(`https://api.example.com/api/videos${query}`, { headers: origin ? { Origin: origin } : {} });
  try {
    const all = await GET(request());
    assert.equal(all.status, 200);
    assert.equal(all.headers.get('Cache-Control'), 'no-store');
    const catalog = await all.json();
    assert.equal(catalog.schemaVersion, 1);
    assert.equal(catalog.videos.length, 39);
    assert.equal(catalog.videos[0].videoUrl, 'https://api.example.com/videos/distribution-v1.mp4');
    for (const topic of ['distribution', 'inverse', ...materials.map(m => m.id)]) {
      const response = await GET(request(`?topicId=${topic}`, 'https://learn.example.com'));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://learn.example.com');
      const data = await response.json();
      assert.equal(data.videos.length, 1);
      assert.equal(data.videos[0].topicId, topic);
      assert.equal(data.videos[0].hasAudio, false);
      assert.equal('videoFile' in data.videos[0], false);
      assert.equal('answer' in data.videos[0], false);
    }
    const empty = await GET(request('?topicId=inverse'));
    assert.equal(empty.status, 200);
    assert.equal((await empty.json()).videos.length, 1);
    assert.equal((await GET(request('?topicId=unknown'))).status, 404);
    for (const query of ['?topicId=', '?topicId=../secret', '?topicId=distribution&topicId=inverse', '?other=1']) assert.equal((await GET(request(query))).status, 400);
    assert.equal((await GET(request('', 'https://evil.example'))).status, 403);
    const preflight = await OPTIONS(new Request('https://api.example.com/api/videos', { method: 'OPTIONS', headers: { Origin: 'https://learn.example.com', 'Access-Control-Request-Method': 'GET' } }));
    assert.equal(preflight.status, 204);
    assert.equal((await OPTIONS(new Request('https://api.example.com/api/videos', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST' } }))).status, 403);
    process.env.VIDEO_ASSET_BASE_URL = 'https://assets.example.com/public/concepts';
    assert.equal(videoCatalog(request().url).videos[0].videoUrl, 'https://assets.example.com/public/concepts/distribution-v1.mp4');
    for (const invalid of ['javascript:alert(1)', 'http://remote.example/videos', 'https://user:password@assets.example.com/videos', 'https://assets.example.com/videos?token=secret']) {
      process.env.VIDEO_ASSET_BASE_URL = invalid;
      assert.equal((await GET(request())).status, 503);
    }
  } finally {
    if (original === undefined) delete process.env.ALLOWED_ORIGINS; else process.env.ALLOWED_ORIGINS = original;
    if (assetBase === undefined) delete process.env.VIDEO_ASSET_BASE_URL; else process.env.VIDEO_ASSET_BASE_URL = assetBase;
  }
});

test('each pilot has packaged media, aligned captions and nonoverlapping transcripts', () => {
  const bank = JSON.parse(readFileSync(new URL('../lib/data/video-catalog.v1.json', import.meta.url), 'utf8'));
  for (const v of bank.videos) {
    for (const file of [v.videoFile, v.posterFile, v.captionsFile]) assert.ok(existsSync(new URL(`../public/videos/${file}`, import.meta.url)), `Missing ${file}`);
    const captions = readFileSync(new URL(`../public/videos/${v.captionsFile}`, import.meta.url), 'utf8');
    assert.ok(captions.startsWith('WEBVTT\n'));
    let end = 0;
    for (const cue of v.transcript) {
      assert.ok(cue.startSeconds >= end && cue.endSeconds > cue.startSeconds && cue.endSeconds <= v.durationSeconds);
      assert.ok(captions.includes(cue.text));
      end = cue.endSeconds;
    }
    assert.equal(end, v.durationSeconds);
  }
});
