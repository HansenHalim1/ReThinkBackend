import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GET, OPTIONS } from '../app/api/visualizations/route.ts';
import { materials } from '../lib/curriculum.ts';

test('public visualizations cover all topics and serve safe versioned stage URLs for Swift',async()=>{
 const previous=process.env.ALLOWED_ORIGINS,base=process.env.VIDEO_ASSET_BASE_URL;
 process.env.ALLOWED_ORIGINS='https://learn.example.com';delete process.env.VIDEO_ASSET_BASE_URL;
 const req=(query='',origin?:string)=>new Request(`https://api.example.com/api/visualizations${query}`,{headers:origin?{Origin:origin}:{}});
 try{
  const response=await GET(req());assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.schemaVersion,1);assert.equal(data.visualizations.length,materials.length+2);
  assert.equal(new Set(data.visualizations.map((v:{topicId:string})=>v.topicId)).size,39);
  for(const v of data.visualizations){
   assert.equal(v.interaction,'stage-selector');assert.equal(v.stages.length,4);
   for(const s of v.stages){
    assert.ok(s.svgUrl.startsWith('https://api.example.com/videos/visuals/'));assert.equal('svgFile' in s,false);
    const p=new URL(s.svgUrl).pathname;assert.ok(existsSync(new URL(`../public${p}`,import.meta.url)));
    const svg=readFileSync(new URL(`../public${p}`,import.meta.url),'utf8');assert.ok(svg.startsWith('<svg'));assert.ok(!/<script|onload=|javascript:/.test(svg));
   }
  }
  assert.equal((await (await GET(req('?topicId=advanced-integrals','https://learn.example.com'))).json()).visualizations.length,1);
  assert.equal((await GET(req('?topicId=unknown'))).status,404);
  for(const q of ['?topicId=','?topicId=../secret','?topicId=inverse&topicId=distribution','?other=1'])assert.equal((await GET(req(q))).status,400);
  assert.equal((await GET(req('','https://evil.example.com'))).status,403);
  assert.equal((await OPTIONS(new Request('https://api.example.com/api/visualizations',{method:'OPTIONS',headers:{Origin:'https://learn.example.com','Access-Control-Request-Method':'GET'}}))).status,204);
  process.env.VIDEO_ASSET_BASE_URL='https://assets.example.com/concepts/';
  assert.match((await(await GET(req())).json()).visualizations[0].stages[0].svgUrl,/^https:\/\/assets.example.com\/concepts\/visuals\//);
 }finally{
  if(previous===undefined)delete process.env.ALLOWED_ORIGINS;else process.env.ALLOWED_ORIGINS=previous;
  if(base===undefined)delete process.env.VIDEO_ASSET_BASE_URL;else process.env.VIDEO_ASSET_BASE_URL=base;
 }
});
