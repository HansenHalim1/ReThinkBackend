import catalog from './data/visualization-catalog.v1.json' with { type: 'json' };
import { mediaBase, videoTopicExists } from './videos.ts';
export const visualTopicExists = videoTopicExists;
export function visualizationCatalog(requestUrl:string,topicId?:string){
 const base=mediaBase(requestUrl);
 return{schemaVersion:1,catalogVersion:catalog.catalogVersion,visualizations:catalog.visualizations.filter(v=>!topicId||v.topicId===topicId).map(v=>({...v,stages:v.stages.map(({svgFile,...stage})=>({...stage,svgUrl:new URL(svgFile,base).href}))}))};
}
