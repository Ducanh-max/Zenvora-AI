export type ReviewInputMode="speech"|"typed";
export type ReviewResult={
 taskId:string;correct:boolean;assisted:boolean;mistakes:number;
 inputMode?:ReviewInputMode;typedInsteadOfSpeech?:boolean;
 previousDueAt:string;dueAt:string;streak:number;
};
export function summarizeReview(results:ReviewResult[]){
 return {
 total:results.length,
 selfCorrect:results.filter(r=>r.correct&&r.mistakes===0&&!r.assisted&&!r.typedInsteadOfSpeech&&r.inputMode!=="typed").length,
 hadErrors:results.filter(r=>!r.correct||r.mistakes>0).length,
 assisted:results.filter(r=>r.assisted||r.typedInsteadOfSpeech||r.inputMode==="typed").length,
 typed:results.filter(r=>r.typedInsteadOfSpeech||r.inputMode==="typed").length,
 wrongAttempts:results.reduce((sum,r)=>sum+Math.max(r.mistakes,r.correct?0:1),0)
 };
}
export function formatReviewDate(value:string){
 return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(value));
}
