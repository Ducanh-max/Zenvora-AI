import type {Task} from "@/app/learn/library/sample-intro-content";
export type Grade={correct:boolean;explanation:string};
export type TutorFeedback={reply:string;status:"correct"|"grammar"|"incomplete"};
export type AttemptEvidence={firstTryCorrect:boolean;mistakes:number;skipped?:boolean;inputMode?:"speech"|"typed";typedInsteadOfSpeech?:boolean;pronunciationAssessed?:false};
export function normalizeAnswer(value:string){
 return value.normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'")
 .replace(/\bi'm\b/g,"i am").replace(/\bit's\b/g,"it is").replace(/\bwhat's\b/g,"what is").replace(/\bname's\b/g,"name is")
 .replace(/[.,!?;:“”"']/g,"").replace(/\s+/g," ").trim();
}
function equivalent(value:string){
 return normalizeAnswer(value).replace(/\bsoccer\b/g,"football").replace(/\bha noi\b/g,"hanoi").replace(/\bpupil\b/g,"student")
 .replace(/^i (?:enjoy|like to play) football$/,"i like playing football")
 .replace(/^i (?:enjoy reading|like to read)(?: books)?$/,"i like reading")
 .replace(/^i like reading books$/,"i like reading")
 .replace(/^(?:it is (?:very )?(?:nice|great|a pleasure)|(?:i am )?(?:pleased|glad|happy)) to meet you$/,"nice to meet you")
 .replace(/^i (?:live in hanoi (?:and )?i am a student|am a student (?:and )?i live in hanoi|am a student living in hanoi)$/,"i live in hanoi and i am a student");
}
export function ageCorrection(value:string):string|null{
 const text=normalizeAnswer(value);
 if(/\byears (?:of |experience\b)/.test(text))return null;
 const match=text.match(/\bi have (\d{1,3}|[a-z]+(?:[ -][a-z]+)?) years(?: old)?\b/);
 if(!match)return null;
 return "Trong tiếng Anh, dùng động từ be để nói tuổi: I am + số tuổi + (years old), không dùng have. Với câu của bạn, hãy viết: I am "+match[1]+" years old. Hãy sửa lại và thử lần nữa.";
}
export function gradeParagraph(value:string):Grade{
 const sentences=value.trim().split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
 if(sentences.length<3||sentences.length>5)return {correct:false,explanation:"Hãy viết từ 3 đến 5 câu. Dùng dấu chấm, chấm hỏi hoặc chấm than để kết thúc mỗi câu."};
 const correction=ageCorrection(value);if(correction)return {correct:false,explanation:correction};
 const text=normalizeAnswer(value);
 const named=/\bmy name is [\p{L}]+/u.test(text)||sentences.some(sentence=>{
 const match=normalizeAnswer(sentence).match(/^(?:hello |hi )?i am ([\p{L}]+)/u);
 return match&&!/^(a|an|from|in|at|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|happy|glad|pleased|nice|years|old|student|interested|not|very|really|also|here|going|learning|studying)$/.test(match[1]);
 });
 const age=sentences.some(sentence=>/^i am (?:\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty(?: [a-z]+)?)(?: years old)?$/.test(normalizeAnswer(sentence)));
 const details=[/\bi (?:am|come) from [\p{L}]+/u,/\bi live (?:in|near|with) [\p{L}]+/u,/\bi (?:like|enjoy|love) [\p{L}]+/u,/\bi am (?:a|an) (?:student|pupil)\b/].filter(rule=>rule.test(text)).length+(age?1:0);
 if(!named||details<2)return {correct:false,explanation:"Đoạn giới thiệu cần có tên và ít nhất 2 thông tin khác, chẳng hạn tuổi, quê quán, nơi sống, việc học hoặc sở thích. Bạn có thể dùng thông tin tưởng tượng."};
 return {correct:true,explanation:"Đã đủ 3–5 câu, có tên và ít nhất 2 thông tin giới thiệu. Đây là đánh giá bố cục và ý; chưa phải chấm toàn bộ ngữ pháp."};
}
export function gradeTask(task:Task,response:string):Grade{
 if(task.kind==="introWrite")return gradeParagraph(response);
 const correction=ageCorrection(response);if(correction)return {correct:false,explanation:correction};
 const candidates=[task.answer,...(task.accepted||[])];
 const normalize=task.kind==="write"?equivalent:normalizeAnswer;
 const correct=candidates.some(candidate=>normalize(candidate)===normalize(response));
 if(!correct&&(task.kind==="write"||task.kind==="dialogue")){
  const negation=response.match(/\b(?:don['’]?t|doesn['’]?t|didn['’]?t|isn['’]?t|aren['’]?t|not|never)\b/i);
  const affirmative=normalizeAnswer(response)
   .replace(/\b(?:dont|doesnt|didnt|do not|does not|did not)\b/g,"")
   .replace(/\bisnt\b/g,"is").replace(/\barent\b/g,"are")
   .replace(/\b(?:not|never)\b/g,"");
  if(negation&&candidates.some(candidate=>normalize(candidate)===normalize(affirmative))){
   return {correct:false,explanation:"Bạn dùng “"+negation[0]+"” để phủ định, làm ngược ý khẳng định của đề. Hãy bỏ phần phủ định để diễn đạt đúng yêu cầu. "+task.note};
  }
 }
 return {correct,explanation:correct&&normalizeAnswer(response)!==normalizeAnswer(task.answer)?"Cách diễn đạt của bạn cũng đúng. "+task.note:task.note};
}
export function firstTryPassed(correct:boolean,assisted:boolean,evidence?:AttemptEvidence){return correct&&!assisted&&!evidence?.typedInsteadOfSpeech&&evidence?.inputMode!=="typed"&&(evidence?.firstTryCorrect??correct);}

// Recognize unambiguous preferred-name replies only for the name question.
// Other wording and tasks still go to the tutor for a full assessment.
export function gradePreferredNameAnswer(question:string,response:string):TutorFeedback|null{
 if(!/^(?:(?:hello|hi) )?what is your name$/.test(normalizeAnswer(question)))return null;
 const text=response.normalize("NFKC").replace(/[’‘]/g,"'").replace(/\s+/g," ").trim();
 const match=text.match(/^(?:(?:hi|hello|hey)[,!]?\s+)?(?:you can call me|please call me|call me|i go by|my friends call me)\s+(.+?)[.!]?$/i);
 if(!match)return null;
 const name=match[1];
 // Be conservative here; lower-case names, longer replies, and ambiguous
 // phrases remain eligible for AI grading, rather than being rejected.
 if(name.length>80||!/^\p{Lu}[\p{L}\p{M}]*(?:[-'][\p{L}\p{M}]+)*(?: \p{Lu}[\p{L}\p{M}]*(?:[-'][\p{L}\p{M}]+)*){0,3}$/u.test(name))return null;
 return {status:"correct",reply:"Đúng và tự nhiên! Bạn đã cho biết mình muốn được gọi là "+name+"."};
}

export function parseTutorFeedback(raw:string):TutorFeedback|null{
 try{const parsed=JSON.parse(raw.replace(/^\`\`\`(?:json)?\s*/i,"").replace(/\s*\`\`\`$/,""));if(!["correct","grammar","incomplete"].includes(parsed.status)||typeof parsed.reply!=="string"||!parsed.reply.trim()||parsed.reply.length>1800)return null;return {status:parsed.status,reply:parsed.reply.trim()};}catch{return null;}
}
