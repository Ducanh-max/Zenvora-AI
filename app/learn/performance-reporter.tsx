"use client";
import {useCallback} from "react";
import {useReportWebVitals} from "next/web-vitals";
import {poorMetric,safeLearnPath} from "@/lib/service-validation";
const sent=new Set<string>();
export default function PerformanceReporter(){const report=useCallback((metric:{name:string;value:number})=>{if(!poorMetric(metric.name,metric.value))return;const path=safeLearnPath(window.location.pathname),key=path+':'+metric.name;if(sent.has(key)||sent.size>=20)return;sent.add(key);const payload=JSON.stringify({name:metric.name,value:metric.value,path});if(navigator.sendBeacon)navigator.sendBeacon('/api/performance-report',new Blob([payload],{type:'application/json'}));else void fetch('/api/performance-report',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(()=>{});},[]);useReportWebVitals(report);return null;}
