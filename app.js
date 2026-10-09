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
$("swapBtn").addEventListener("click",()=>{const oldSrc=src.value,oldDst=dst.value,srcCode=src.selectedOptions[0].dataset.code;const reverseSrc=[...src.options].find(o=>(o.dataset.code||o.value)===oldDst);const reverseDst=[...dst.options].find(o=>o.value===srcCode);if(reverseSrc&&reverseDst){src.value=reverseSrc.value;dst.value=reverseDst.value;}output.value="";error.textContent="";});
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
function speakTranslatedText() {
 error.textContent = "";
 const text = output.value.trim();
 if (!text) {
   error.textContent = "먼저 문장을 번역해 주세요.";
   return;
 }
 if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
   error.textContent = "이 브라우저는 음성 읽기를 지원하지 않아요. 삼성 갤럭시에서는 Chrome으로 열어 주세요.";
   return;
 }

 const targetLocale = dst.selectedOptions[0].dataset.speech || "en-US";
 const targetBase = targetLocale.split("-")[0].toLowerCase();
 const synth = window.speechSynthesis;

 function startSpeaking() {
   const voices = synth.getVoices ? synth.getVoices() : [];
   // Prefer a voice in the selected language. A language-specific Android TTS voice
   // may need to be installed in the phone's text-to-speech settings.
   const voice = voices.find(v => (v.lang || "").toLowerCase() === targetLocale.toLowerCase())
     || voices.find(v => (v.lang || "").toLowerCase().split("-")[0] === targetBase);

   synth.cancel();
   const utterance = new SpeechSynthesisUtterance(text);
   utterance.lang = targetLocale;
   utterance.rate = 0.9;
   if (voice) utterance.voice = voice;

   utterance.onstart = () => {
     error.textContent = "";
   };
   utterance.onend = () => {
     error.textContent = "";
   };
   utterance.onerror = (event) => {
     const reason = event && event.error ? event.error : "";
     if (!voice && targetBase !== "en") {
       error.textContent = `${languageLabel(targetBase)} 음성 데이터가 휴대전화에 없거나 읽기 서비스에서 지원하지 않을 수 있어요. 아래의 '음성 데이터 설치' 안내를 따라 설정해 주세요.`;
     } else {
       error.textContent = "음성 읽기를 시작하지 못했어요. 휴대전화 음량과 텍스트 음성 변환(TTS) 설정을 확인해 주세요.";
     }
   };
   synth.speak(utterance);

   // Some mobile browsers expose voices asynchronously; report the likely cause
   // instead of failing silently when no voice is installed for the selected language.
   if (!voice && targetBase !== "en") {
     error.textContent = `${languageLabel(targetBase)} 음성이 바로 선택되지 않았어요. 읽기가 안 되면 휴대전화에 해당 언어의 음성 데이터를 설치해 주세요.`;
   }
 }

 // Android Chrome can populate its voice list asynchronously.
 if (synth.getVoices().length === 0) {
   let completed = false;
   const onVoices = () => {
     if (completed) return;
     completed = true;
     synth.removeEventListener("voiceschanged", onVoices);
     startSpeaking();
   };
   synth.addEventListener("voiceschanged", onVoices);
   // Avoid waiting indefinitely if this browser does not fire voiceschanged.
   window.setTimeout(() => {
     if (completed) return;
     completed = true;
     synth.removeEventListener("voiceschanged", onVoices);
     startSpeaking();
   }, 700);
 } else {
   startSpeaking();
 }
}
function languageLabel(code) {
 const names = {"ko":"한국어","en":"영어","ja":"일본어","zh-CN":"중국어(간체)","zh-TW":"중국어(번체)","ru":"러시아어","es":"스페인어","fr":"프랑스어","de":"독일어","th":"태국어","vi":"베트남어","id":"인도네시아어","ms":"말레이어","tl":"필리핀어(타갈로그어)","hi":"힌디어","bn":"벵골어","ur":"우르두어","ar":"아랍어","fa":"페르시아어","he":"히브리어","tr":"터키어","it":"이탈리아어","pt":"포르투갈어","pt-BR":"브라질 포르투갈어","nl":"네덜란드어","sv":"스웨덴어","no":"노르웨이어","da":"덴마크어","fi":"핀란드어","pl":"폴란드어","cs":"체코어","sk":"슬로바키아어","hu":"헝가리어","ro":"루마니아어","bg":"불가리아어","el":"그리스어","uk":"우크라이나어","be":"벨라루스어","sr":"세르비아어","hr":"크로아티아어","sl":"슬로베니아어","bs":"보스니아어","sq":"알바니아어","mk":"마케도니아어","lt":"리투아니아어","lv":"라트비아어","et":"에스토니아어","is":"아이슬란드어","ga":"아일랜드어","cy":"웨일스어","ca":"카탈루냐어","eu":"바스크어","gl":"갈리시아어","af":"아프리칸스어","sw":"스와힐리어","am":"암하라어","ha":"하우사어","yo":"요루바어","ig":"이그보어","zu":"줄루어","so":"소말리어","rw":"키냐르완다어","sn":"쇼나어","mg":"말라가시어","ne":"네팔어","mr":"마라티어","gu":"구자라트어","pa":"펀자브어","ta":"타밀어","te":"텔루구어","kn":"칸나다어","ml":"말라얄람어","or":"오디아어","as":"아삼어","si":"싱할라어","my":"버마어","km":"크메르어","lo":"라오어","mn":"몽골어","kk":"카자흐어","uz":"우즈베크어","ky":"키르기스어","tg":"타지크어","az":"아제르바이잔어","hy":"아르메니아어","ka":"조지아어","ps":"파슈토어","ku":"쿠르드어","ug":"위구르어","la":"라틴어","eo":"에스페란토어","ht":"아이티 크레올어","ceb":"세부아노어","jw":"자바어","su":"순다어","mi":"마오리어","haw":"하와이어","fj":"피지어","sm":"사모아어","lb":"룩셈부르크어","mt":"몰타어","fy":"프리지아어","zh":"보통화(중국어)"};
 return names[code] || "선택한 언어";
}
$("readBtn").addEventListener("click", speakTranslatedText);
function addHistory(a,b){const list=$("history");if(list.querySelector(".empty"))list.innerHTML="";const li=document.createElement("li"),one=document.createElement("div"),two=document.createElement("strong");one.textContent=a;two.textContent=b;li.append(one,document.createElement("br"),two);list.prepend(li);while(list.children.length>12)list.lastElementChild.remove();}
$("clearHistoryBtn").addEventListener("click",()=>{$("history").innerHTML='<li class="empty">번역한 내용이 여기에 쌓입니다.</li>';});
if(!window.isSecureContext)help.textContent="설치 기능은 HTTPS 주소에서 사용해 주세요.";
