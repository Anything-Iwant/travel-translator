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
let conversationMode = false;
let activeDirection = "outbound";

const conversationModeBtn = $("conversationModeBtn");
const partnerSpeakBtn = $("partnerSpeakBtn");
const conversationHelp = $("conversationHelp");

conversationModeBtn.addEventListener("click", () => {
  conversationMode = !conversationMode;
  conversationModeBtn.setAttribute("aria-pressed", String(conversationMode));
  conversationModeBtn.textContent = conversationMode
    ? "🗣️ 양방향 대화 모드: 켜짐"
    : "🗣️ 양방향 대화 모드: 꺼짐";
  partnerSpeakBtn.hidden = !conversationMode;
  conversationHelp.textContent = conversationMode
    ? "내가 말하기는 내 언어 → 상대방 언어, 상대방 말하기는 상대방 언어 → 내 언어로 번역합니다."
    : "켜면 상대방이 외국어로 말할 때도 내 언어로 번역할 수 있어요.";
  status.textContent = conversationMode
    ? "아래에서 말하는 사람에 맞는 버튼을 선택해 주세요."
    : "내가 말하기를 누르고 문장을 말해 주세요.";
  activeDirection = "outbound";
});

$("speakBtn").addEventListener("click", () => startListening("outbound"));
partnerSpeakBtn.addEventListener("click", () => startListening("inbound"));

function startListening(direction) {
  error.textContent = "";
  activeDirection = direction;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    error.textContent = "이 브라우저는 음성 인식을 지원하지 않아요. Android에서는 Chrome을 사용해 주세요.";
    return;
  }

  const rec = new SR();
  rec.lang = direction === "inbound"
    ? (dst.selectedOptions[0].dataset.speech || dst.value)
    : src.value;
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  const activeButton = direction === "inbound" ? partnerSpeakBtn : $("speakBtn");
  const defaultText = direction === "inbound" ? "🎙️ 상대방 말하기" : "🎙️ 내가 말하기";
  rec.onstart = () => {
    status.textContent = direction === "inbound"
      ? "상대방의 말을 듣고 있어요. 상대방이 말하면 잠시 기다려 주세요."
      : "듣고 있어요. 문장을 말해 주세요.";
    activeButton.textContent = "🎙️ 듣는 중…";
  };
  rec.onresult = e => {
    input.value = e.results[0][0].transcript;
    status.textContent = "음성을 인식했어요. 번역 중입니다.";
    translateText(direction);
  };
  rec.onerror = e => {
    error.textContent = e.error === "not-allowed"
      ? "마이크 권한을 허용해 주세요."
      : e.error === "no-speech"
        ? "음성이 들리지 않았어요. 다시 말해 주세요."
        : "음성 인식 오류가 발생했어요. 인터넷과 마이크 권한을 확인해 주세요.";
  };
  rec.onend = () => {
    activeButton.textContent = defaultText;
  };
  try {
    rec.start();
  } catch (e) {
    error.textContent = "음성 인식이 이미 실행 중입니다. 잠시 후 다시 시도해 주세요.";
  }
}
function decodeEntities(s){const t=document.createElement("textarea");t.innerHTML=s;return t.value;}
async function translateText(direction = activeDirection) {
  error.textContent = "";
  const text = input.value.trim();
  if (!text) {
    error.textContent = "먼저 문장을 말하거나 입력해 주세요.";
    return;
  }

  activeDirection = direction;
  const myCode = src.selectedOptions[0].dataset.code;
  const partnerCode = dst.value;
  const from = direction === "inbound" ? partnerCode : myCode;
  const to = direction === "inbound" ? myCode : partnerCode;

  if (from === to) {
    output.value = text;
    addHistory(text, text);
    status.textContent = "두 언어가 같아서 원문을 표시했어요.";
    return;
  }

  status.textContent = direction === "inbound"
    ? "상대방 말을 내 언어로 번역 중이에요…"
    : "내 말을 상대방 언어로 번역 중이에요…";
  $("translateBtn").disabled = true;
  try {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", from + "|" + to);
    const r = await fetch(url);
    if (!r.ok) throw Error("번역 서비스에 연결하지 못했어요.");
    const data = await r.json();
    if (!data.responseData?.translatedText) throw Error("번역 결과가 없어요. 잠시 후 다시 시도해 주세요.");
    output.value = decodeEntities(data.responseData.translatedText);
    status.textContent = direction === "inbound"
      ? "상대방의 말을 내 언어로 번역했어요."
      : "내 말을 상대방 언어로 번역했어요.";
    addHistory(text, output.value);
    if (autoReadEnabled) setTimeout(() => speakTranslatedText(), 0);
  } catch (e) {
    error.textContent = e.message || "번역에 실패했어요. 인터넷 연결을 확인해 주세요.";
    status.textContent = "번역 실패";
  } finally {
    $("translateBtn").disabled = false;
  }
}
$("translateBtn").addEventListener("click",translateText);

// 여행 필수 회화: 한국어 문장을 선택해 현재 상대방 언어로 번역합니다.
const travelPhrases = {
  hotel: [
    ["예약했습니다.", "I have a reservation."],
    ["체크인하고 싶습니다.", "I'd like to check in."],
    ["체크아웃은 몇 시인가요?", "What time is check-out?"],
    ["와이파이 비밀번호가 무엇인가요?", "What is the Wi-Fi password?"],
    ["수건을 더 받을 수 있을까요?", "Could I get some more towels?"],
    ["짐을 맡길 수 있을까요?", "Can I leave my luggage here?"]
  ],
  taxi: [
    ["이 주소로 가 주세요.", "Please take me to this address."],
    ["여기서 세워 주세요.", "Please stop here."],
    ["요금은 얼마인가요?", "How much is the fare?"],
    ["카드로 결제할 수 있나요?", "Can I pay by card?"],
    ["공항까지 얼마나 걸리나요?", "How long does it take to get to the airport?"],
    ["미터기를 켜 주세요.", "Please turn on the meter."]
  ],
  restaurant: [
    ["두 명 자리 있나요?", "Do you have a table for two?"],
    ["메뉴판을 주세요.", "Could I see the menu, please?"],
    ["이 음식에 무엇이 들어가나요?", "What is in this dish?"],
    ["맵지 않게 해 주세요.", "Please make it not spicy."],
    ["물 좀 주세요.", "Could I have some water, please?"],
    ["계산서 주세요.", "Could I have the bill, please?"]
  ],
  directions: [
    ["화장실이 어디에 있나요?", "Where is the restroom?"],
    ["이곳에 어떻게 가나요?", "How do I get there?"],
    ["가장 가까운 지하철역이 어디인가요?", "Where is the nearest subway station?"],
    ["걸어서 갈 수 있나요?", "Can I walk there?"],
    ["여기서 얼마나 먼가요?", "How far is it from here?"],
    ["길을 잃었어요. 도와주세요.", "I'm lost. Could you help me?"]
  ],
  shopping: [
    ["이거 얼마인가요?", "How much is this?"],
    ["다른 색상도 있나요?", "Do you have this in another color?"],
    ["입어 봐도 되나요?", "Can I try this on?"],
    ["조금 깎아 주실 수 있나요?", "Could you give me a discount?"],
    ["이걸로 살게요.", "I'll take this one."],
    ["면세가 가능한가요?", "Is this eligible for a tax refund?"]
  ],
  airport: [
    ["체크인 카운터가 어디인가요?", "Where is the check-in counter?"],
    ["탑승구가 어디인가요?", "Where is the boarding gate?"],
    ["비행기가 지연됐나요?", "Is the flight delayed?"],
    ["수하물이 나오지 않았어요.", "My luggage hasn't arrived."],
    ["환승은 어디에서 하나요?", "Where do I transfer?"],
    ["탑승권을 보여 드릴게요.", "I'll show you my boarding pass."]
  ],
  emergency: [
    ["도와주세요!", "Please help me!"],
    ["경찰을 불러 주세요.", "Please call the police."],
    ["의사가 필요합니다.", "I need a doctor."],
    ["가장 가까운 병원이 어디인가요?", "Where is the nearest hospital?"],
    ["여권을 잃어버렸어요.", "I've lost my passport."],
    ["한국 대사관에 연락하고 싶습니다.", "I'd like to contact the Korean embassy."]
  ]
};
const phraseList = $("phraseList");
const phraseCategoryButtons = [...document.querySelectorAll(".phrase-category")];
const phraseCategoryNames = {
  hotel: "호텔", taxi: "택시", restaurant: "식당", directions: "길 찾기",
  shopping: "쇼핑", airport: "공항", emergency: "긴급 상황"
};
let currentPhraseCategory = "hotel";
function renderPhrases(category) {
  currentPhraseCategory = category;
  phraseList.innerHTML = "";
  (travelPhrases[category] || []).forEach(([phrase]) => {
    const row = document.createElement("div");
    row.className = "phrase-row";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phrase-item phrase-use";
    button.textContent = phrase;
    button.addEventListener("click", () => {
      if (typeof usePhrase === "function") usePhrase(phrase);
      else {
        const koreanOption = [...src.options].find(option => option.dataset.code === "ko");
        if (koreanOption) src.value = koreanOption.value;
        input.value = phrase;
        output.value = "";
        activeDirection = "outbound";
        error.textContent = "";
        status.textContent = `여행 회화 선택: ${phrase} — 번역 중입니다.`;
        translateText("outbound");
      }
    });
    const star = document.createElement("button");
    star.type = "button";
    star.className = "favorite-toggle";
    star.textContent = isFavoritePhrase(phrase) ? "★" : "☆";
    star.title = isFavoritePhrase(phrase) ? "즐겨찾기 해제" : "즐겨찾기에 저장";
    star.setAttribute("aria-label", `${phrase} ${isFavoritePhrase(phrase) ? "즐겨찾기 해제" : "즐겨찾기에 저장"}`);
    star.setAttribute("aria-pressed", String(isFavoritePhrase(phrase)));
    star.addEventListener("click", () => toggleFavoritePhrase(phrase, category));
    row.append(button, star);
    phraseList.appendChild(row);
  });
  phraseCategoryButtons.forEach(button => {
    const selected = button.dataset.category === category;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
phraseCategoryButtons.forEach(button => {
  button.addEventListener("click", () => renderPhrases(button.dataset.category));
});

let autoReadEnabled = false;
const autoReadBtn = $("autoReadBtn");
autoReadBtn.addEventListener("click", () => {
  autoReadEnabled = !autoReadEnabled;
  autoReadBtn.setAttribute("aria-pressed", String(autoReadEnabled));
  autoReadBtn.textContent = autoReadEnabled
    ? "🔊 자동 음성 읽기: 켜짐"
    : "🔊 자동 음성 읽기: 꺼짐";
  status.textContent = autoReadEnabled
    ? "번역이 완료되면 자동으로 읽습니다. 기기의 음성 지원이 필요해요."
    : "자동 음성 읽기를 껐어요.";
});

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

 const targetLocale = activeDirection === "inbound" ? src.value : (dst.selectedOptions[0].dataset.speech || "en-US");
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

// 상대방에게 번역문을 전체 화면에 가깝게 확대해 보여주는 모드
const showPartnerOverlay = $("showPartnerOverlay");
const showPartnerText = $("showPartnerText");
const showPartnerOriginal = $("showPartnerOriginal");
let showPartnerFontSize = 0;
let showPartnerPreviousFocus = null;
function openShowPartner(text = output.value, original = input.value, locale = null) {
  const phrase = String(text || "").trim();
  if (!phrase) {
    error.textContent = "먼저 문장을 번역하거나 긴급 문장을 선택해 주세요.";
    return;
  }
  showPartnerPreviousFocus = document.activeElement;
  showPartnerText.textContent = phrase;
  showPartnerOriginal.textContent = String(original || "").trim();
  showPartnerOverlay.dataset.speechLocale = locale || (activeDirection === "inbound" ? src.value : (dst.selectedOptions[0]?.dataset.speech || "en-US"));
  showPartnerOriginal.hidden = !showPartnerOriginal.textContent;
  showPartnerFontSize = 0;
  showPartnerText.style.fontSize = "";
  showPartnerOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  $("closeShowPartnerBtn").focus();
}
function closeShowPartner() {
  showPartnerOverlay.hidden = true;
  document.body.style.overflow = "";
  if (showPartnerPreviousFocus && typeof showPartnerPreviousFocus.focus === "function") showPartnerPreviousFocus.focus();
}
$("showPartnerBtn").addEventListener("click", () => openShowPartner());
$("emergencyShowBtn").addEventListener("click", () => openShowPartner($("emergencyPhraseTranslated").textContent, $("emergencyPhraseKorean").textContent, currentEmergencyTranslation ? currentEmergencyLocale : "en-US"));
$("closeShowPartnerBtn").addEventListener("click", closeShowPartner);
$("closeShowPartnerBottomBtn").addEventListener("click", closeShowPartner);
showPartnerOverlay.addEventListener("click", event => { if (event.target === showPartnerOverlay) closeShowPartner(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !showPartnerOverlay.hidden) closeShowPartner(); });
$("smallerTextBtn").addEventListener("click", () => {
  showPartnerFontSize = Math.max(-18, showPartnerFontSize - 6);
  const base = Math.min(58, Math.max(34, window.innerWidth * 0.09));
  showPartnerText.style.fontSize = `${Math.max(22, base + showPartnerFontSize)}px`;
});
$("largerTextBtn").addEventListener("click", () => {
  showPartnerFontSize = Math.min(42, showPartnerFontSize + 6);
  const base = Math.min(58, Math.max(34, window.innerWidth * 0.09));
  showPartnerText.style.fontSize = `${Math.min(100, base + showPartnerFontSize)}px`;
});
$("showPartnerReadBtn").addEventListener("click", () => {
  const phrase = showPartnerText.textContent.trim();
  if (!phrase) return;
  const locale = showPartnerOverlay.dataset.speechLocale || (activeDirection === "inbound" ? src.value : (dst.selectedOptions[0]?.dataset.speech || "en-US"));
  speakOfflinePhrase(phrase, locale);
});
const HISTORY_STORAGE_KEY = "travelTranslatorHistoryV1";
const HISTORY_LIMIT = 30;

function readTranslationHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(item =>
      item && typeof item.original === "string" &&
      typeof item.translated === "string"
    ).slice(0, HISTORY_LIMIT) : [];
  } catch (e) {
    return [];
  }
}
let translationHistory = readTranslationHistory();

function persistTranslationHistory() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(translationHistory));
    return true;
  } catch (e) {
    status.textContent = "브라우저 저장이 제한되어 번역 기록을 저장하지 못했습니다.";
    return false;
  }
}
function addHistory(original, translated) {
  const entry = {
    original,
    translated,
    from: activeDirection === "inbound" ? dst.value : src.selectedOptions[0]?.dataset.code || src.value,
    to: activeDirection === "inbound" ? src.selectedOptions[0]?.dataset.code || src.value : dst.value,
    direction: activeDirection,
    createdAt: new Date().toISOString()
  };
  translationHistory.unshift(entry);
  translationHistory = translationHistory.slice(0, HISTORY_LIMIT);
  persistTranslationHistory();
  renderTranslationHistory();
}
function renderTranslationHistory() {
  const list = $("history");
  list.innerHTML = "";
  if (!translationHistory.length) {
    list.innerHTML = '<li class="empty">번역한 내용이 여기에 쌓입니다.</li>';
    return;
  }
  translationHistory.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "history-entry";
    const original = document.createElement("div");
    original.className = "history-original";
    original.textContent = entry.original;
    const translated = document.createElement("div");
    translated.className = "history-translated";
    translated.textContent = entry.translated;
    const meta = document.createElement("div");
    meta.className = "history-meta";
    const date = new Date(entry.createdAt);
    meta.textContent = Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
    const actions = document.createElement("div");
    actions.className = "history-actions";
    const reuse = document.createElement("button");
    reuse.type = "button";
    reuse.className = "small-action";
    reuse.textContent = "다시 사용";
    reuse.addEventListener("click", () => {
      input.value = entry.original;
      output.value = entry.translated;
      activeDirection = entry.direction === "inbound" ? "inbound" : "outbound";
      if (entry.direction === "inbound") {
        const partnerOption = [...dst.options].find(option => option.value === entry.from);
        const myOption = [...src.options].find(option => option.dataset.code === entry.to);
        if (partnerOption) dst.value = partnerOption.value;
        if (myOption) src.value = myOption.value;
      } else {
        const myOption = [...src.options].find(option => option.dataset.code === entry.from);
        if (myOption) src.value = myOption.value;
        if ([...dst.options].some(option => option.value === entry.to)) dst.value = entry.to;
      }
      status.textContent = "이전 번역을 불러왔습니다. 번역읽기 버튼으로 다시 들을 수 있어요.";
      error.textContent = "";
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "small-action";
    remove.textContent = "삭제";
    remove.addEventListener("click", () => {
      translationHistory.splice(index, 1);
      persistTranslationHistory();
      renderTranslationHistory();
    });
    actions.append(reuse, remove);
    li.append(original, translated, meta, actions);
    list.appendChild(li);
  });
}
$("clearHistoryBtn").addEventListener("click", () => {
  if (!translationHistory.length) return;
  if (typeof window.confirm === "function" && !window.confirm("번역 기록을 모두 삭제할까요?")) return;
  translationHistory = [];
  persistTranslationHistory();
  renderTranslationHistory();
});
if(!window.isSecureContext)help.textContent="설치 기능은 HTTPS 주소에서 사용해 주세요.";


// 즐겨찾기 회화는 현재 기기의 브라우저에 저장합니다.
const FAVORITES_STORAGE_KEY = "travelTranslatorFavoritePhrasesV1";
const favoritePhraseList = $("favoritePhraseList");
const emptyFavorites = $("emptyFavorites");
const clearFavoritesBtn = $("clearFavoritesBtn");

function readFavoritePhrases() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(item =>
      item && typeof item.text === "string" &&
      typeof item.category === "string"
    ) : [];
  } catch (e) {
    return [];
  }
}
let favoritePhrases = readFavoritePhrases();

function saveFavoritePhrases() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritePhrases));
    return true;
  } catch (e) {
    status.textContent = "브라우저 저장이 제한되어 즐겨찾기를 저장하지 못했습니다.";
    return false;
  }
}
function isFavoritePhrase(text) {
  return favoritePhrases.some(item => item.text === text);
}
function toggleFavoritePhrase(text, category) {
  if (isFavoritePhrase(text)) {
    favoritePhrases = favoritePhrases.filter(item => item.text !== text);
  } else {
    favoritePhrases.push({ text, category });
  }
  saveFavoritePhrases();
  renderPhrases(currentPhraseCategory);
  renderFavoritePhrases();
}
function usePhrase(text) {
  const koreanOption = [...src.options].find(option => option.dataset.code === "ko");
  if (koreanOption) src.value = koreanOption.value;
  input.value = text;
  output.value = "";
  activeDirection = "outbound";
  error.textContent = "";
  status.textContent = `여행 회화 선택: ${text} — 번역 중입니다.`;
  translateText("outbound");
}
function renderFavoritePhrases() {
  favoritePhraseList.innerHTML = "";
  emptyFavorites.hidden = favoritePhrases.length > 0;
  clearFavoritesBtn.hidden = favoritePhrases.length === 0;
  favoritePhrases.forEach(item => {
    const row = document.createElement("div");
    row.className = "favorite-row";
    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.className = "phrase-item favorite-use";
    useButton.textContent = item.text;
    useButton.addEventListener("click", () => usePhrase(item.text));
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "favorite-remove";
    removeButton.textContent = "★";
    removeButton.setAttribute("aria-label", `${item.text} 즐겨찾기 해제`);
    removeButton.title = "즐겨찾기 해제";
    removeButton.addEventListener("click", () => {
      favoritePhrases = favoritePhrases.filter(saved => saved.text !== item.text);
      saveFavoritePhrases();
      renderPhrases(currentPhraseCategory);
      renderFavoritePhrases();
    });
    row.append(useButton, removeButton);
    favoritePhraseList.appendChild(row);
  });
}
if (clearFavoritesBtn) {
  clearFavoritesBtn.addEventListener("click", () => {
    if (!favoritePhrases.length) return;
    if (typeof window.confirm === "function" && !window.confirm("저장한 즐겨찾기 회화를 모두 삭제할까요?")) return;
    favoritePhrases = [];
    saveFavoritePhrases();
    renderPhrases(currentPhraseCategory);
    renderFavoritePhrases();
  });
}

renderPhrases("hotel");
renderFavoritePhrases();
renderTranslationHistory();


// 오프라인 필수 회화: 아래 문장은 앱에 미리 포함되어 있어 번역 API 없이 표시할 수 있습니다.
const offlinePhraseList = $("offlinePhraseList");
const offlinePhraseNote = $("offlinePhraseNote");
const offlinePhrases = [
  {
    ko: "안녕하세요.",
    translations: {
      en: "Hello.", ja: "こんにちは。", "zh-CN": "你好。", "zh-TW": "你好。",
      th: "สวัสดี", es: "Hola.", fr: "Bonjour.", de: "Hallo.", ru: "Здравствуйте.",
      vi: "Xin chào.", id: "Halo.", it: "Buongiorno.", pt: "Olá.", "pt-BR": "Olá."
    }
  },
  {
    ko: "감사합니다.",
    translations: {
      en: "Thank you.", ja: "ありがとうございます。", "zh-CN": "谢谢。", "zh-TW": "謝謝。",
      th: "ขอบคุณ", es: "Gracias.", fr: "Merci.", de: "Danke.", ru: "Спасибо.",
      vi: "Cảm ơn.", id: "Terima kasih.", it: "Grazie.", pt: "Obrigado/a.", "pt-BR": "Obrigado/a."
    }
  },
  {
    ko: "도와주세요!",
    translations: {
      en: "Please help me!", ja: "助けてください！", "zh-CN": "请帮帮我！", "zh-TW": "請幫幫我！",
      th: "ช่วยด้วย", es: "¡Ayúdeme, por favor!", fr: "Aidez-moi, s'il vous plaît !",
      de: "Bitte helfen Sie mir!", ru: "Помогите, пожалуйста!", vi: "Xin hãy giúp tôi!",
      id: "Tolong bantu saya!", it: "Mi aiuti, per favore!", pt: "Ajude-me, por favor!", "pt-BR": "Me ajude, por favor!"
    }
  },
  {
    ko: "화장실이 어디에 있나요?",
    translations: {
      en: "Where is the restroom?", ja: "トイレはどこですか？", "zh-CN": "洗手间在哪里？", "zh-TW": "洗手間在哪裡？",
      th: "ห้องน้ำอยู่ที่ไหน", es: "¿Dónde está el baño?", fr: "Où sont les toilettes?",
      de: "Wo ist die Toilette?", ru: "Где туалет?", vi: "Nhà vệ sinh ở đâu?",
      id: "Di mana toilet?", it: "Dov'è il bagno?", pt: "Onde fica a casa de banho?", "pt-BR": "Onde fica o banheiro?"
    }
  },
  {
    ko: "이거 얼마인가요?",
    translations: {
      en: "How much is this?", ja: "これはいくらですか？", "zh-CN": "这个多少钱？", "zh-TW": "這個多少錢？",
      th: "อันนี้ราคาเท่าไหร่", es: "¿Cuánto cuesta esto?", fr: "Combien ça coûte ?",
      de: "Wie viel kostet das?", ru: "Сколько это стоит?", vi: "Cái này giá bao nhiêu?",
      id: "Berapa harga ini?", it: "Quanto costa questo?", pt: "Quanto custa isto?", "pt-BR": "Quanto custa isso?"
    }
  },
  {
    ko: "맵지 않게 해 주세요.",
    translations: {
      en: "Please make it not spicy.", ja: "辛くしないでください。", "zh-CN": "请不要做辣。", "zh-TW": "請不要做辣。",
      th: "กรุณาทำแบบไม่เผ็ด", es: "Por favor, que no sea picante.", fr: "Pas épicé, s'il vous plaît.",
      de: "Bitte nicht scharf.", ru: "Пожалуйста, не остро.", vi: "Xin đừng làm cay.",
      id: "Tolong jangan pedas.", it: "Non piccante, per favore.", pt: "Sem picante, por favor.", "pt-BR": "Sem pimenta, por favor."
    }
  },
  {
    ko: "경찰을 불러 주세요.",
    translations: {
      en: "Please call the police.", ja: "警察を呼んでください。", "zh-CN": "请叫警察。", "zh-TW": "請叫警察。",
      th: "กรุณาเรียกตำรวจ", es: "Llame a la policía, por favor.", fr: "Appelez la police, s'il vous plaît.",
      de: "Bitte rufen Sie die Polizei.", ru: "Вызовите полицию, пожалуйста.", vi: "Xin hãy gọi cảnh sát.",
      id: "Tolong panggil polisi.", it: "Chiami la polizia, per favore.", pt: "Chame a polícia, por favor.", "pt-BR": "Chame a polícia, por favor."
    }
  }
];
const offlineSpeechLocales = {
  en: "en-US", ja: "ja-JP", "zh-CN": "zh-CN", "zh-TW": "zh-TW",
  th: "th-TH", es: "es-ES", fr: "fr-FR", de: "de-DE", ru: "ru-RU",
  vi: "vi-VN", id: "id-ID", it: "it-IT", pt: "pt-PT", "pt-BR": "pt-BR"
};
function renderOfflinePhrases() {
  if (!offlinePhraseList) return;
  offlinePhraseList.innerHTML = "";
  const language = dst.value;
  const supported = offlinePhrases.filter(item => item.translations[language]);
  if (!supported.length) {
    offlinePhraseNote.textContent = "이 언어의 오프라인 문장은 아직 준비되지 않았습니다. 인터넷 연결 시 일반 번역 기능을 이용해 주세요.";
    return;
  }
  offlinePhraseNote.textContent = "미리 저장된 문장 " + supported.length + "개 · 번역 API를 사용하지 않습니다.";
  supported.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phrase-item offline-item";
    button.innerHTML = "";
    const ko = document.createElement("span");
    ko.className = "offline-ko";
    ko.textContent = item.ko;
    const translated = document.createElement("strong");
    translated.className = "offline-translated";
    translated.textContent = item.translations[language];
    button.append(ko, translated);
    button.addEventListener("click", () => {
      input.value = item.ko;
      output.value = item.translations[language];
      activeDirection = "outbound";
      const myOption = [...src.options].find(option => option.dataset.code === "ko");
      if (myOption) src.value = myOption.value;
      status.textContent = "오프라인 회화를 불러왔습니다. 인터넷 연결 없이 표시할 수 있어요.";
      error.textContent = "";
      speakOfflinePhrase(item.translations[language], offlineSpeechLocales[language] || dst.selectedOptions[0]?.dataset.speech || language);
    });
    offlinePhraseList.appendChild(button);
  });
}
function speakOfflinePhrase(text, locale) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    status.textContent = "문장은 표시했지만 이 브라우저는 음성 읽기를 지원하지 않습니다.";
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.onerror = () => {
      status.textContent = "문장은 표시했지만 이 언어의 음성은 기기에서 지원되지 않을 수 있습니다.";
    };
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    status.textContent = "문장은 표시했지만 음성 읽기를 시작하지 못했습니다.";
  }
}
dst.addEventListener("change", renderOfflinePhrases);

renderOfflinePhrases();

// 긴급 상황 빠른 실행: 국가별 참고 번호와 미리 준비된 회화 문장을 표시합니다.
const emergencyCountries = {
  jp: { police: "110", ambulance: "119", note: "일본 기준 번호입니다. 경찰은 110, 구급·화재는 119입니다." },
  us: { police: "911", ambulance: "911", note: "미국에서는 일반적인 긴급 상황에 911을 사용합니다." },
  ca: { police: "911", ambulance: "911", note: "캐나다에서는 일반적인 긴급 상황에 911을 사용합니다." },
  uk: { police: "999 / 112", ambulance: "999 / 112", note: "영국에서는 긴급 상황에 999 또는 112를 사용할 수 있습니다." },
  eu: { police: "112", ambulance: "112", note: "EU 지역의 일반적인 긴급 번호는 112입니다. 국가별 예외나 추가 번호가 있을 수 있습니다." },
  au: { police: "000", ambulance: "000", note: "호주의 주요 긴급 전화번호는 000입니다." },
  nz: { police: "111", ambulance: "111", note: "뉴질랜드의 주요 긴급 전화번호는 111입니다." },
  th: { police: "191", ambulance: "1669", note: "태국의 일반 경찰 번호는 191, 응급 의료 지원은 1669로 안내됩니다." },
  vn: { police: "113", ambulance: "115", note: "베트남에서는 경찰 113, 구급 115로 안내됩니다." },
  cn: { police: "110", ambulance: "120", note: "중국 본토 기준 번호입니다. 경찰은 110, 구급은 120입니다." },
  sg: { police: "999", ambulance: "995", note: "싱가포르에서는 경찰 999, 구급·화재 긴급 상황은 995로 안내됩니다." },
  my: { police: "999", ambulance: "999", note: "말레이시아의 통합 긴급 번호는 일반적으로 999입니다. 휴대전화에서는 112 안내도 확인하세요." },
  ph: { police: "911", ambulance: "911", note: "필리핀의 통합 긴급 번호는 911입니다." },
  in: { police: "112", ambulance: "112", note: "인도의 통합 긴급 번호는 112입니다." },
  kr: { police: "112", ambulance: "119", note: "대한민국 기준 번호입니다. 경찰은 112, 구급·화재는 119입니다." }
};
const emergencyTranslations = {
  help: { ko: "도와주세요!", en: "Please help me!", ja: "助けてください！", "zh-CN": "请帮帮我！", "zh-TW": "請幫幫我！", th: "ช่วยฉันด้วย!", es: "¡Ayúdeme, por favor!", fr: "Aidez-moi, s'il vous plaît !", de: "Bitte helfen Sie mir!", ru: "Помогите мне, пожалуйста!", vi: "Xin hãy giúp tôi!", id: "Tolong bantu saya!", it: "Mi aiuti, per favore!", pt: "Ajude-me, por favor!", "pt-BR": "Por favor, me ajude!" },
  police: { ko: "경찰을 불러 주세요.", en: "Please call the police.", ja: "警察を呼んでください。", "zh-CN": "请叫警察。", "zh-TW": "請叫警察。", th: "กรุณาเรียกตำรวจ", es: "Llame a la policía, por favor.", fr: "Appelez la police, s'il vous plaît.", de: "Bitte rufen Sie die Polizei.", ru: "Вызовите полицию, пожалуйста.", vi: "Xin hãy gọi cảnh sát.", id: "Tolong panggil polisi.", it: "Chiami la polizia, per favore.", pt: "Chame a polícia, por favor.", "pt-BR": "Chame a polícia, por favor." },
  ambulance: { ko: "구급차가 필요합니다.", en: "I need an ambulance.", ja: "救急車が必要です。", "zh-CN": "我需要救护车。", "zh-TW": "我需要救護車。", th: "ฉันต้องการรถพยาบาล", es: "Necesito una ambulancia.", fr: "J'ai besoin d'une ambulance.", de: "Ich brauche einen Krankenwagen.", ru: "Мне нужна скорая помощь.", vi: "Tôi cần xe cấp cứu.", id: "Saya membutuhkan ambulans.", it: "Ho bisogno di un'ambulanza.", pt: "Preciso de uma ambulância.", "pt-BR": "Preciso de uma ambulância." },
  hospital: { ko: "병원에 가야 합니다.", en: "I need to go to a hospital.", ja: "病院に行く必要があります。", "zh-CN": "我需要去医院。", "zh-TW": "我需要去醫院。", th: "ฉันต้องไปโรงพยาบาล", es: "Necesito ir al hospital.", fr: "Je dois aller à l'hôpital.", de: "Ich muss ins Krankenhaus.", ru: "Мне нужно в больницу.", vi: "Tôi cần đến bệnh viện.", id: "Saya perlu pergi ke rumah sakit.", it: "Devo andare in ospedale.", pt: "Preciso ir ao hospital.", "pt-BR": "Preciso ir ao hospital." }
};
const emergencyCountrySelect = $("emergencyCountry");
const emergencyPhraseDisplay = $("emergencyPhraseDisplay");
let currentEmergencyTranslation = "";
let currentEmergencyLocale = "en-US";
function renderEmergencyCountry() {
  const info = emergencyCountries[emergencyCountrySelect.value];
  $("policeNumber").textContent = info ? info.police : "선택 필요";
  $("ambulanceNumber").textContent = info ? info.ambulance : "선택 필요";
  $("emergencyCountryNote").textContent = info
    ? info.note + " 번호는 참고용이며, 연결이 되지 않으면 현지 공식 안내를 확인하세요."
    : "여행 국가를 선택하면 해당 지역의 긴급 번호 참고 정보를 표시합니다. 실제 상황에서는 현지 공식 안내를 우선하세요.";
}
emergencyCountrySelect.addEventListener("change", renderEmergencyCountry);
document.querySelectorAll("[data-emergency-phrase]").forEach(button => {
  button.addEventListener("click", () => {
    const key = button.dataset.emergencyPhrase;
    const item = emergencyTranslations[key];
    const language = dst.value;
    const translated = item?.[language];
    $("emergencyPhraseKorean").textContent = item.ko;
    if (translated) {
      currentEmergencyTranslation = translated;
      currentEmergencyLocale = dst.selectedOptions[0]?.dataset.speech || language;
      $("emergencyPhraseTranslated").textContent = translated;
      $("emergencyPhraseDisplay").hidden = false;
      output.value = translated;
      input.value = item.ko;
      status.textContent = "긴급 상황 문장을 표시했습니다. 오프라인에서도 미리 준비된 문장을 볼 수 있습니다.";
      error.textContent = "";
    } else {
      currentEmergencyTranslation = "";
      $("emergencyPhraseTranslated").textContent = "이 언어의 미리 저장된 긴급 문장은 없습니다. 아래 영어 문장을 보여주세요: " + (item.en || item.ko);
      emergencyPhraseDisplay.hidden = false;
      output.value = item.en || item.ko;
      input.value = item.ko;
      status.textContent = "현재 언어의 저장 문장이 없어 영어 문장을 표시했습니다.";
    }
  });
});
$("emergencyReadBtn").addEventListener("click", () => {
  if (currentEmergencyTranslation) speakOfflinePhrase(currentEmergencyTranslation, currentEmergencyLocale);
  else speakOfflinePhrase($("emergencyPhraseTranslated").textContent, "en-US");
});
renderEmergencyCountry();
dst.addEventListener("change", () => {
  emergencyPhraseDisplay.hidden = true;
  currentEmergencyTranslation = "";
});

