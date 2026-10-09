const $=id=>document.getElementById(id);
const src=$("sourceLang"),dst=$("targetLang"),input=$("recognized"),output=$("translated");
let installPrompt=null;
const installBtn=$("installBtn"),help=$("installHelp"),error=$("error"),status=$("status");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;help.textContent="설치할 수 있어요. 버튼을 눌러 홈 화면에 추가하세요.";});
window.addEventListener("appinstalled",()=>{installPrompt=null;help.textContent="설치 완료! 홈 화면에서 번역기를 실행하세요.";installBtn.textContent="✓ 설치 완료";installBtn.disabled=true;});
installBtn.addEventListener("click",async()=>{
 error.textContent="";
 if(installPrompt){installPrompt.prompt();const choice=await installPrompt.userChoice;help.textContent=choice.outcome==="accepted"?"설치를 진행했어요. 홈 화면에서 아이콘을 확인해 주세요.":"설치가 취소됐어요. 원할 때 다시 눌러 주세요.";installPrompt=null;return;}
 if(/; wv\)|\bwv\b|NAVER\(inapp|Naver.*InApp/i.test(navigator.userAgent)){help.textContent="네이버 카페 안에서는 설치가 제한될 수 있어요. 메뉴(⋮)에서 'Chrome에서 열기'를 선택한 뒤 다시 눌러 주세요.";return;}
 help.textContent="브라우저 메뉴(⋮)에서 '홈 화면에 추가' 또는 '앱 설치'를 선택해 주세요. 브라우저가 아이콘 추가를 직접 승인해야 해요.";
});
$("swapBtn").addEventListener("click",()=>{const oldSrc=src.value,oldDst=dst.value,srcCode=src.selectedOptions[0].dataset.code;const reverseSrc=[...src.options].find(o=>o.dataset.code===oldDst);const reverseDst=[...dst.options].find(o=>o.value===srcCode);if(reverseSrc&&reverseDst){src.value=reverseSrc.value;dst.value=reverseDst.value;}output.value="";error.textContent="";});
$("speakBtn").addEventListener("click",()=>{
 error.textContent="";const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){error.textContent="이 브라우저는 음성 인식을 지원하지 않아요. Android에서는 Chrome을 사용해 주세요.";return;}
 const rec=new SR();rec.lang=src.value;rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=1;
 rec.onstart=()=>{status.textContent="듣고 있어요. 문장을 말해 주세요."; $("speakBtn").textContent="🎙️ 듣는 중…";};
 rec.onresult=e=>{input.value=e.results[0][0].transcript;status.textContent="음성을 인식했어요. 번역 중입니다.";translateText();};
 rec.onerror=e=>{error.textContent=e.error==="not-allowed"?"마이크 권한을 허용해 주세요.":e.error==="no-speech"?"음성이 들리지 않았어요. 다시 말해 주세요.":"음성 인식 오류가 발생했어요. 인터넷과 마이크 권한을 확인해 주세요.";};
 rec.onend=()=>{$("speakBtn").textContent="🎙️ 말하기 시작";};try{rec.start();}catch(e){error.textContent="음성 인식이 이미 실행 중입니다. 잠시 후 다시 시도해 주세요.";}
});
function decodeEntities(s){const t=document.createElement("textarea");t.innerHTML=s;return t.value;}
async function translateText(){
 error.textContent="";const text=input.value.trim();if(!text){error.textContent="먼저 문장을 말하거나 입력해 주세요.";return;}
 const from=src.selectedOptions[0].dataset.code,to=dst.value;if(from===to){output.value=text;addHistory(text,text);status.textContent="완료";return;}
 status.textContent="번역 중이에요…";$("translateBtn").disabled=true;
 try{const url=new URL("https://api.mymemory.translated.net/get");url.searchParams.set("q",text);url.searchParams.set("langpair",from+"|"+to);const r=await fetch(url);if(!r.ok)throw Error("번역 서비스에 연결하지 못했어요.");const data=await r.json();if(!data.responseData?.translatedText)throw Error("번역 결과가 없어요. 잠시 후 다시 시도해 주세요.");output.value=decodeEntities(data.responseData.translatedText);status.textContent="번역이 완료됐어요.";addHistory(text,output.value);}
 catch(e){error.textContent=e.message||"번역에 실패했어요. 인터넷 연결을 확인해 주세요.";status.textContent="번역 실패";}
 finally{$("translateBtn").disabled=false;}
}
$("translateBtn").addEventListener("click",translateText);
$("readBtn").addEventListener("click",()=>{
 error.textContent="";if(!output.value.trim()){error.textContent="먼저 번역해 주세요.";return;}
 if(!("speechSynthesis"in window)||typeof SpeechSynthesisUtterance==="undefined"){error.textContent="이 브라우저에서는 음성 읽기를 지원하지 않아요. 삼성 갤럭시에서는 Chrome으로 열어 주세요.";return;}
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(output.value);u.lang=dst.selectedOptions[0].dataset.speech||"en-US";u.rate=.92;u.onerror=()=>{error.textContent="음성 읽기에 실패했어요. 휴대전화의 음량과 음성 서비스 설정을 확인해 주세요.";};speechSynthesis.speak(u);}catch(e){error.textContent="음성 읽기에 실패했어요. Chrome에서 다시 시도해 주세요.";}
});
function addHistory(a,b){const list=$("history");if(list.querySelector(".empty"))list.innerHTML="";const li=document.createElement("li"),one=document.createElement("div"),two=document.createElement("strong");one.textContent=a;two.textContent=b;li.append(one,document.createElement("br"),two);list.prepend(li);while(list.children.length>12)list.lastElementChild.remove();}
$("clearHistoryBtn").addEventListener("click",()=>{$("history").innerHTML='<li class="empty">번역한 내용이 여기에 쌓입니다.</li>';});
if(!window.isSecureContext)help.textContent="설치 기능은 HTTPS 주소에서 사용해 주세요.";
