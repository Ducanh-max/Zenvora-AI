// Deliberately simple, transparent intervals for the sample course.
export function nextReview(previousStreak:number,correct:boolean,assisted:boolean,now:number){
 const streak=correct&&!assisted?Math.min(5,previousStreak+1):0;
 const days=streak===0?1:[1,3,7,14,30][streak-1];
 return {streak,due_at:new Date(now+days*86400000).toISOString()};
}
