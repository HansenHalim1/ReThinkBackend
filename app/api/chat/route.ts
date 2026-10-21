import { authenticated,jsonBody } from '../../../lib/auth.ts';
import { cors,preflight } from '../../../lib/cors.ts';
import { answerChat,parseChat } from '../../../lib/chat.ts';
import { chatRate } from '../../../lib/chat-rate.ts';
export const runtime='nodejs';
export const maxDuration=30;
export function POST(request:Request) {return cors(request,()=>authenticated(request,async({user})=>{const command=parseChat(await jsonBody(request,100000));chatRate(user.id,'chat');return Response.json(await answerChat(command,request.signal));}));}
export function OPTIONS(request:Request) {return preflight(request,'POST');}
