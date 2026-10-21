import { authenticated,jsonBody } from '../../../lib/auth.ts';
import { cors,preflight } from '../../../lib/cors.ts';
import { parseYouTube,youtubeTranscript } from '../../../lib/youtube.ts';
import { chatRate } from '../../../lib/chat-rate.ts';
export const runtime='nodejs';
export const maxDuration=30;
export function POST(request:Request) {return cors(request,()=>authenticated(request,async({user})=>{const {id,language}=parseYouTube(await jsonBody(request));chatRate(user.id,'transcript');return Response.json(await youtubeTranscript(id,request.signal,language));}));}
export function OPTIONS(request:Request) {return preflight(request,'POST');}
