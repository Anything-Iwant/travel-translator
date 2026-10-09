const $=id=>document.getElementById(id);
const src=$("sourceLang"),dst=$("targetLang"),input=$("recognized"),output=$("translated");
let installPrompt = null;
let installEventSeen = false;
const installBtn = $("installBtn"), help = $("installHelp"), error = $("error"), status = $("status");

function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    navigator.standalone === true;
}
function isDesktopDevice() {
  return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function desktopInstallHelp() {
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) {
    return "브라우저가 자동 설치 창을 제공하지 않았어요. Edge 주소창 오른쪽의 설치 아이콘을 확인하거나, ⋯ → 앱 → 이 사이트를 앱으로 설치를 선택해 주세요.";
  }
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    return "브라우저가 자동 설치 창을 제공하지 않았어요. Chrome 주소창 오른쪽의 설치 아이콘을 확인하거나, ⋮ → 전송, 저장 및 공유 → 페이지를 앱으로 설치를 선택해 주세요.";
  }
  if (/Safari/i.test(ua) && /Macintosh|Mac OS X/i.test(ua)) {
    return "Safari에서는 웹사이트가 설치 창을 자동으로 열 수 없어요. 메뉴 막대에서 파일 → Dock에 추가를 선택하거나 Chrome/Edge를 이용해 주세요.";
  }
  if (/Firefox\//i.test(ua)) {
    return "이 브라우저는 앱 설치 팝업을 지원하지 않을 수 있어요. PC의 Chrome 또는 Edge에서 페이지를 열어 설치해 주세요.";
  }
  return "PC의 Chrome 또는 Edge에서 설치할 수 있어요. 주소창 오른쪽의 설치 아이콘이나 브라우저 메뉴의 앱 설치 항목을 확인해 주세요.";
}
function showInstallHelp() {
  if (isInstalledApp()) {
    help.textContent = "이미 앱으로 설치되어 있어요. 바탕화면 또는 시작 메뉴의 '여행 번역기' 아이콘으로 실행할 수 있습니다.";
    return;
  }
  if (/; wv\)|\bwv\b|NAVER\(inapp|Naver.*InApp/i.test(navigator.userAgent)) {
    help.textContent = "현재 앱 안의 브라우저에서는 설치가 제한될 수 있어요. 메뉴에서 'Chrome에서 열기'를 선택한 뒤 설치 버튼을 다시 눌러 주세요.";
    return;
  }
  help.textContent = isDesktopDevice()
    ? desktopInstallHelp()
    : "휴대전화 브라우저에서 설치 팝업이 지원되면 이 버튼으로 열 수 있어요. 팝업이 나타나지 않으면 브라우저 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 선택해 주세요.";
}

// Chromium 브라우저가 설치 팝업을 허용하면 이벤트를 저장하고,
// 사용자가 설치 버튼을 누른 바로 그 순간 prompt()를 호출합니다.
window.addEventListener("beforeinstallprompt", event => {
  if (isInstalledApp()) return;
  event.preventDefault();
  installPrompt = event;
  installEventSeen = true;
  installBtn.disabled = false;
  installBtn.textContent = "＋ 바탕화면 설치";
  help.textContent = "설치할 수 있어요. '바탕화면 설치'를 누르면 브라우저 설치 창이 열립니다.";
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  help.textContent = "설치 완료! 바탕화면 또는 앱 목록에서 '여행 번역기'를 실행하세요.";
  installBtn.textContent = "✓ 설치 완료";
  installBtn.disabled = true;
});
if (isInstalledApp()) {
  installBtn.textContent = "✓ 앱으로 설치됨";
  help.textContent = "이미 앱으로 설치되어 있어요. 바탕화면 또는 시작 메뉴의 아이콘으로 실행할 수 있습니다.";
  installBtn.disabled = true;
}
installBtn.addEventListener("click", async () => {
  error.textContent = "";
  if (isInstalledApp()) {
    showInstallHelp();
    return;
  }
  // Prompt can only be shown when the browser has fired beforeinstallprompt.
  // Calling it synchronously from this click preserves the required user gesture.
  const promptEvent = installPrompt;
  if (promptEvent) {
    installPrompt = null;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        help.textContent = "설치를 진행했어요. 설치가 끝나면 바탕화면 또는 앱 목록에서 아이콘을 확인해 주세요.";
      } else {
        help.textContent = "설치가 취소됐어요. 다시 설치하려면 이 버튼을 누르거나 브라우저 메뉴에서 설치해 주세요.";
      }
    } catch (err) {
      showInstallHelp();
    }
    return;
  }
  if (isDesktopDevice() && !installEventSeen) {
    help.textContent = "이 브라우저가 아직 자동 설치 창을 제공하지 않았어요. 잠시 후 버튼을 다시 눌러 보세요. 그래도 열리지 않으면 아래 브라우저별 설치 안내를 따라 주세요.";
    // Keep the actionable browser-specific fallback visible rather than pretending
    // a website can force an install dialog when the browser has not authorized it.
    setTimeout(() => {
      if (!installPrompt && !isInstalledApp()) help.textContent = desktopInstallHelp();
    }, 1800);
    return;
  }
  showInstallHelp();
});

// 인터넷 연결 상태: navigator.onLine은 기기의 연결 여부를 알려주지만,
// 실제 번역 서버 접속 가능 여부까지 보장하지는 않습니다.
const networkStatus = $("networkStatus");
function renderNetworkStatus() {
  if (!networkStatus) return;
  const online = navigator.onLine;
  networkStatus.dataset.state = online ? "online" : "offline";
  $("networkStatusTitle").textContent = online ? "인터넷 연결 상태: 온라인" : "인터넷 연결 끊김";
  $("networkStatusDetail").textContent = online
    ? "일반 번역을 사용할 수 있어요. 번역 서버 상태에 따라 실패할 수 있습니다."
    : "저장된 오프라인 필수 문장은 사용할 수 있지만, 새 번역은 인터넷이 필요해요.";
  $("networkStatusBadge").textContent = online ? "온라인" : "오프라인";
}
window.addEventListener("online", renderNetworkStatus);
window.addEventListener("offline", renderNetworkStatus);
renderNetworkStatus();
function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    navigator.standalone === true;
}
function desktopInstallHelp() {
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) {
    return "PC의 Microsoft Edge에서 설치하려면 오른쪽 위 메뉴(⋯) → 앱 → '이 사이트를 앱으로 설치'를 선택하세요. 설치 항목이 안 보이면 주소창 오른쪽의 설치 아이콘도 확인해 주세요.";
  }
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    return "PC의 Chrome에서 설치하려면 주소창 오른쪽의 설치 아이콘을 눌러 보세요. 아이콘이 없다면 오른쪽 위 메뉴(⋮) → '전송, 저장 및 공유' → '페이지를 앱으로 설치' 또는 '앱 설치'를 선택하세요.";
  }
  if (/Safari/i.test(ua) && /Macintosh|Mac OS X/i.test(ua)) {
    return "Mac의 Safari에서는 화면 맨 위 메뉴 막대에서 파일 → Dock에 추가를 선택하세요. 설치 메뉴가 없다면 Chrome 또는 Edge에서 이 페이지를 열어 설치할 수 있습니다.";
  }
  if (/Firefox\//i.test(ua)) {
    return "PC의 Firefox는 이 앱의 설치 버튼을 통한 앱 설치를 지원하지 않을 수 있어요. Chrome 또는 Microsoft Edge에서 이 페이지를 열고 주소창의 설치 아이콘이나 브라우저 메뉴를 이용해 주세요.";
  }
  return "PC에서는 Chrome 또는 Microsoft Edge로 이 페이지를 여는 것이 가장 쉬워요. 주소창 오른쪽의 설치 아이콘을 누르거나, 브라우저 메뉴에서 '앱 설치' 또는 '페이지를 앱으로 설치'를 찾아 선택하세요.";
}
function showInstallHelp() {
  if (isInstalledApp()) {
    help.textContent = "이미 앱으로 설치되어 있어요. 바탕화면 또는 시작 메뉴의 '여행 번역기' 아이콘으로 실행할 수 있습니다.";
    return;
  }
  if (/; wv\)|\bwv\b|NAVER\(inapp|Naver.*InApp/i.test(navigator.userAgent)) {
    help.textContent = "현재 앱 안의 브라우저에서는 설치가 제한될 수 있어요. 메뉴에서 'Chrome에서 열기'를 선택한 뒤 설치 버튼을 다시 눌러 주세요.";
    return;
  }
  const isDesktop = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  help.textContent = isDesktop
    ? desktopInstallHelp()
    : "휴대전화 브라우저 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 선택하세요. Chrome에서는 설치 아이콘이 보일 수도 있어요.";
}
window.addEventListener("beforeinstallprompt", e => {
  if (isInstalledApp()) return;
  e.preventDefault();
  installPrompt = e;
  help.textContent = "설치할 수 있어요. 이 버튼을 누르면 브라우저 설치 창이 열립니다.";
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  help.textContent = "설치 완료! 바탕화면 또는 앱 목록에서 '여행 번역기'를 실행하세요.";
  installBtn.textContent = "✓ 설치 완료";
  installBtn.disabled = true;
});
if (isInstalledApp()) {
  installBtn.textContent = "✓ 앱으로 설치됨";
  help.textContent = "이미 앱으로 설치되어 있어요. 바탕화면 또는 시작 메뉴의 아이콘으로 실행할 수 있습니다.";
  installBtn.disabled = true;
}
installBtn.addEventListener("click", async () => {
  error.textContent = "";
  if (isInstalledApp()) {
    showInstallHelp();
    return;
  }
  if (installPrompt) {
    try {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      help.textContent = choice.outcome === "accepted"
        ? "설치를 진행했어요. 바탕화면 또는 앱 목록에서 아이콘을 확인해 주세요."
        : "설치가 취소됐어요. 원할 때 설치 버튼을 다시 누르거나 브라우저 메뉴에서 설치할 수 있어요.";
    } catch (err) {
      showInstallHelp();
    } finally {
      installPrompt = null;
    }
    return;
  }
  showInstallHelp();
});
$("swapBtn").addEventListener("click",()=>{const oldSrc=src.value,oldDst=dst.value,srcCode=src.selectedOptions[0].dataset.code;const reverseSrc=[...src.options].find(o=>(o.dataset.code||o.value)===oldDst);const reverseDst=[...dst.options].find(o=>o.value===srcCode);if(reverseSrc&&reverseDst){src.value=reverseSrc.value;dst.value=reverseDst.value;}output.value="";error.textContent="";});
let conversationMode = false;
let activeDirection = "outbound";
let activeRecognition = null;
let isSpeakingTranslation = false;
let conversationTurns = [];

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
    ? "먼저 ‘내가 말하기’를 눌러 말해 주세요. 번역 후 다음 차례를 안내합니다."
    : "내가 말하기를 누르고 문장을 말해 주세요.";
  $("conversationNextTurn").textContent = conversationMode
    ? "다음 차례: 나 — ‘내가 말하기’를 눌러 시작하세요."
    : "대화 모드를 켜면 다음 차례를 안내해 드려요.";
  activeDirection = "outbound";
});

$("speakBtn").addEventListener("click", () => startListening("outbound"));
partnerSpeakBtn.addEventListener("click", () => startListening("inbound"));

function startListening(direction) {
  error.textContent = "";
  if (isSpeakingTranslation || ("speechSynthesis" in window && window.speechSynthesis.speaking)) {
    status.textContent = "번역 음성이 끝난 뒤 마이크를 눌러 주세요.";
    return;
  }
  if (activeRecognition) {
    try { activeRecognition.abort(); } catch (_) {}
    activeRecognition = null;
  }
  activeDirection = direction;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    error.textContent = "이 브라우저는 음성 인식을 지원하지 않아요. Android에서는 Chrome을 사용해 주세요. 마이크 버튼 대신 문장을 직접 입력해도 됩니다.";
    return;
  }

  const rec = new SR();
  activeRecognition = rec;
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
    activeButton.setAttribute("aria-pressed", "true");
  };
  rec.onresult = e => {
    const transcript = e.results && e.results[0] && e.results[0][0]
      ? e.results[0][0].transcript.trim() : "";
    if (!transcript) return;
    input.value = transcript;
    status.textContent = "음성을 인식했어요. 번역 중입니다.";
    translateText(direction);
  };
  rec.onerror = e => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      error.textContent = "마이크 권한이 차단되어 있어요. 브라우저 사이트 설정에서 마이크를 허용해 주세요.";
    } else if (e.error === "no-speech") {
      error.textContent = "음성이 들리지 않았어요. 주변 소음을 줄이고 다시 말해 주세요.";
    } else if (e.error !== "aborted") {
      error.textContent = "음성 인식 오류가 발생했어요. 인터넷 연결, 마이크 권한, 브라우저 지원 여부를 확인해 주세요.";
    }
  };
  rec.onend = () => {
    activeButton.textContent = defaultText;
    activeButton.setAttribute("aria-pressed", "false");
    if (activeRecognition === rec) activeRecognition = null;
  };
  try {
    rec.start();
  } catch (e) {
    if (activeRecognition === rec) activeRecognition = null;
    activeButton.textContent = defaultText;
    activeButton.setAttribute("aria-pressed", "false");
    error.textContent = "음성 인식을 시작하지 못했어요. 잠시 기다렸다가 다시 눌러 주세요.";
  }
}

function renderConversationTranscript() {
  const list = $("conversationTranscript");
  list.replaceChildren();
  if (!conversationTurns.length) {
    const empty = document.createElement("li");
    empty.className = "conversation-empty";
    empty.textContent = "번역한 대화가 여기에 차례대로 표시됩니다.";
    list.appendChild(empty);
    return;
  }
  conversationTurns.forEach(turn => {
    const item = document.createElement("li");
    item.className = `conversation-turn ${turn.direction === "inbound" ? "incoming" : "outgoing"}`;
    const heading = document.createElement("div");
    heading.className = "conversation-turn-heading";
    heading.textContent = turn.direction === "inbound" ? "상대방 → 나" : "나 → 상대방";
    const original = document.createElement("p");
    original.className = "conversation-turn-original";
    original.textContent = turn.original;
    const translated = document.createElement("p");
    translated.className = "conversation-turn-translated";
    translated.textContent = turn.translated;
    const meta = document.createElement("div");
    meta.className = "conversation-turn-meta";
    meta.textContent = `${turn.fromLabel} → ${turn.toLabel} · ${turn.time}`;
    item.append(heading, original, translated, meta);
    list.appendChild(item);
  });
  list.scrollTop = list.scrollHeight;
}

function addConversationTurn(original, translated, direction) {
  const fromLabel = direction === "inbound" ? dst.selectedOptions[0]?.textContent : src.selectedOptions[0]?.textContent;
  const toLabel = direction === "inbound" ? src.selectedOptions[0]?.textContent : dst.selectedOptions[0]?.textContent;
  conversationTurns.push({
    original, translated, direction,
    fromLabel: (fromLabel || "원문").trim(),
    toLabel: (toLabel || "번역").trim(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });
  if (conversationTurns.length > 50) conversationTurns.shift();
  renderConversationTranscript();
  if (conversationMode) {
    const next = direction === "inbound" ? "나" : "상대방";
    $("conversationNextTurn").textContent = `다음 차례: ${next} — ${next === "나" ? "‘내가 말하기’를 눌러 주세요." : "‘상대방 말하기’를 눌러 주세요."}`;
  }
}

$("clearConversationBtn").addEventListener("click", () => {
  conversationTurns = [];
  renderConversationTranscript();
  $("conversationNextTurn").textContent = conversationMode
    ? "다음 차례: 나 — ‘내가 말하기’를 눌러 시작하세요."
    : "대화 모드를 켜면 다음 차례를 안내해 드려요.";
});
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
    addConversationTurn(text, text, direction);
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
    addConversationTurn(text, output.value, direction);
    if (autoReadEnabled) setTimeout(() => speakTranslatedText(), 0);
  } catch (e) {
    error.textContent = e.message || "번역에 실패했어요. 인터넷 연결을 확인해 주세요.";
    status.textContent = "번역 실패";
  } finally {
    $("translateBtn").disabled = false;
  }
}
$("translateBtn").addEventListener("click",translateText);

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
 if (activeRecognition) {
   try { activeRecognition.abort(); } catch (_) {}
   activeRecognition = null;
 }
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
   isSpeakingTranslation = false;
   const utterance = new SpeechSynthesisUtterance(text);
   utterance.lang = targetLocale;
   utterance.rate = 0.9;
   if (voice) utterance.voice = voice;

   utterance.onstart = () => {
     isSpeakingTranslation = true;
     error.textContent = "";
     status.textContent = "번역 음성을 재생 중이에요. 재생이 끝나면 다음 사람이 말하면 됩니다.";
   };
   utterance.onend = () => {
     isSpeakingTranslation = false;
     error.textContent = "";
     if (conversationMode) {
       const next = activeDirection === "inbound" ? "나" : "상대방";
       $("conversationNextTurn").textContent = `다음 차례: ${next} — ${next === "나" ? "‘내가 말하기’를 눌러 주세요." : "‘상대방 말하기’를 눌러 주세요."}`;
       status.textContent = `번역 음성 재생 완료. 이제 ${next}의 차례예요.`;
     } else {
       status.textContent = "번역 음성 재생을 마쳤어요.";
     }
   };
   utterance.onerror = (event) => {
     isSpeakingTranslation = false;
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


renderTranslationHistory();


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
const travelPresetLanguages = {
  jp: { target: "ja", label: "일본어" },
  us: { target: "en", label: "영어" },
  ca: { target: "en", label: "영어" },
  uk: { target: "en", label: "영어" },
  eu: { target: "en", label: "영어(기본 설정)" },
  au: { target: "en", label: "영어" },
  nz: { target: "en", label: "영어" },
  th: { target: "th", label: "태국어" },
  vn: { target: "vi", label: "베트남어" },
  cn: { target: "zh-CN", label: "중국어(간체)" },
  sg: { target: "en", label: "영어" },
  my: { target: "ms", label: "말레이어" },
  ph: { target: "tl", label: "필리핀어" },
  in: { target: "hi", label: "힌디어" },
  kr: { target: "ko", label: "한국어" }
};
function applyTravelCountryPreset(country, save = true) {
  const preset = travelPresetLanguages[country];
  if (!preset) {
    if (travelPresetNote) travelPresetNote.textContent = "여행 국가를 고르면 상대방 언어와 긴급 연락처 국가를 함께 설정해요.";
    return;
  }
  const targetOption = [...dst.options].find(option => option.value === preset.target);
  if (targetOption) dst.value = preset.target;
  if (travelPresetNote) {
    const countryName = travelCountryPreset.selectedOptions[0]?.textContent.trim() || "선택한 국가";
    travelPresetNote.textContent = `${countryName}에 맞춰 상대방 언어를 ${preset.label}(으)로 설정했어요. 필요하면 아래에서 직접 바꿀 수 있어요.`;
  }
  if (save) {
    try { localStorage.setItem("travelTranslatorCountryPreset", country); } catch (_) {}
  }
}
travelCountryPreset.addEventListener("change", () => applyTravelCountryPreset(travelCountryPreset.value));
try {
  const savedCountry = localStorage.getItem("travelTranslatorCountryPreset");
  if (savedCountry && travelPresetLanguages[savedCountry]) {
    travelCountryPreset.value = savedCountry;
    applyTravelCountryPreset(savedCountry, false);
  }
} catch (_) {}
