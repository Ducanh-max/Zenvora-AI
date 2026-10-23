"use client";
import {useEffect} from "react";

/** Discourage copying course material while keeping text entry and accessibility intact. */
export default function CopyProtection(){
 useEffect(()=>{
  const editable=(target:EventTarget|null)=>{
   const node=target instanceof Element?target:null;
   return !!node?.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"],[role="textbox"]');
  };
  const blockCopy=(event:ClipboardEvent)=>{
   if(editable(event.target))return;
   event.preventDefault();
  };
  const blockKeys=(event:KeyboardEvent)=>{
   if(editable(event.target))return;
   if((event.ctrlKey||event.metaKey)&&["c","x"].includes(event.key.toLowerCase()))event.preventDefault();
  };
  const blockContext=(event:MouseEvent)=>{
   if(!editable(event.target))event.preventDefault();
  };
  document.addEventListener("copy",blockCopy);
  document.addEventListener("cut",blockCopy);
  document.addEventListener("keydown",blockKeys);
  document.addEventListener("contextmenu",blockContext);
  return()=>{
   document.removeEventListener("copy",blockCopy);
   document.removeEventListener("cut",blockCopy);
   document.removeEventListener("keydown",blockKeys);
   document.removeEventListener("contextmenu",blockContext);
  };
 },[]);
 return <style>{`main,main *{ -webkit-user-select:none;user-select:none } input,textarea,select,[contenteditable],[role="textbox"]{-webkit-user-select:text!important;user-select:text!important}`}</style>;
}
