const $ = (id) => document.getElementById(id);
const source = $("sourceLanguage");
const target = $("targetLanguage");
const swap = $("swap");
const listen = $("listen");
const listenText = $("listenText");
const status = $("status");
const promptTitle = $("promptTitle");
const hint = $("hint");
const historyBox = $("history");
const empty = $("empty");

const languageNames = {
  "ko-KR":"한국어", "en-US":"영어", "ja-JP":"일본어", "th-TH":"태국어",
  "zh-CN":"중국어", "es-ES":"스페인어", "fr-FR":"프랑스어", "de-DE":"독일어"
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

function updateLabels() {
  promptTitle.textContent = `${languageNames[source.value]}로 말해 보세요`;
  hint.textContent = `번역 방향: ${languageNames[source.value]} → ${languageNames[target.value]}`;
}
source.addEventListener("change", updateLabels);
target.addEventListener("change", updateLabels);

swap.addEventListener("click", () => {
  const old = source.value;
  source.value = target.value;
  target.value = old;
  updateLabels();
});

function setListening(value) {
  isListening = value;
  listen.classList.toggle("active", value);
  status.classList.toggle("active", value);
  status.textContent = value ? "듣는 중" : "준비";
  listenText.textContent = value ? "듣기 중지" : "말하기 시작";
}

function addEntry(original, translated, from, to) {
  empty.hidden = true;
  const entry = document.createElement("article");
  entry.className = "entry";

  const top = document.createElement("div");
  top.className = "entry-top";
  const direction = document.createElement("span");
  direction.textContent = `${languageNames[from]} → ${languageNames[to]}`;
  const time = document.createElement("span");
  time.textContent = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  top.append(direction, time);

  const content = document.createElement("div");
  content.className = "entry-content";
  const cap1 = document.createElement("div");
  cap1.className = "caption";
  cap1.textContent = "인식한 문장";
  const orig = document.createElement("p");
  orig.className = "original";
  orig.textContent = original;
  const cap2 = document.createElement("div");
  cap2.className = "caption";
  cap2.textContent = "번역 결과";
  const trans = document.createElement("p");
  trans.className = "translation";
  trans.textContent = translated;
  content.append(cap1, orig, cap2, trans);

  const actions = document.createElement("div");
  actions.className = "entry-actions";
  const speak = document.createElement("button");
  speak.type = "button";
  speak.className = "speak";
  speak.textContent = "🔊 번역 읽기";
  speak.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) {
      alert("이 브라우저에서는 음성 읽기를 지원하지 않습니다.");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translated);
    utterance.lang = to;
    speechSynthesis.speak(utterance);
  });
  actions.append(speak);
  entry.append(top, content, actions);
  historyBox.prepend(entry);
}

function startRecognition() {
  if (!SpeechRecognition) {
    alert("현재 브라우저가 음성 인식을 지원하지 않습니다. Android의 최신 Chrome 또는 iPhone의 최신 Safari에서 다시 시도해 주세요. 브라우저별 지원은 다를 수 있습니다.");
    return;
  }
  if (source.value === target.value) {
    alert("서로 다른 언어를 선택해 주세요.");
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = source.value;
  recognition.interimResults = true;
  recognition.continuous = false;
  let finalTranscript = "";

  recognition.onstart = () => setListening(true);
  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += text;
      else interim += text;
    }
    hint.textContent = interim ? `인식 중: ${interim}` : "말씀을 인식하고 있습니다…";
  };
  recognition.onerror = (event) => {
    setListening(false);
    if (event.error !== "aborted" && event.error !== "no-speech") {
      alert(`음성 인식 오류: ${event.error}. 마이크 권한과 인터넷 연결을 확인해 주세요.`);
    }
  };
  recognition.onend = async () => {
    setListening(false);
    const recognized = finalTranscript.trim();
    updateLabels();
    if (!recognized) {
      hint.textContent = "문장을 인식하지 못했습니다. 마이크 가까이에서 다시 말해 주세요.";
      return;
    }
    hint.textContent = "번역 중…";
    listen.disabled = true;
    try {
      const translated = await translateText(recognized, source.value, target.value);
      addEntry(recognized, translated, source.value, target.value);
      hint.textContent = "번역 완료! 상대방이 답하면 ⇄ 버튼으로 언어를 바꾸세요.";
    } catch (error) {
      hint.textContent = "번역에 실패했습니다.";
      alert(error.message);
    } finally {
      listen.disabled = false;
    }
  };

  try { recognition.start(); }
  catch { setListening(false); alert("음성 인식을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
}

async function translateText(text, from, to) {
  // Static GitHub Pages cannot keep an API key secret. Use MyMemory as a starter translation service.
  // Public service quotas and quality are not guaranteed; don't send sensitive information.
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${from.split("-")[0]}|${to.split("-")[0]}`);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("번역 서비스에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.");
  const data = await response.json();
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error("번역 결과를 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  return decodeEntities(data.responseData.translatedText);
}

function decodeEntities(value) {
  const el = document.createElement("textarea");
  el.innerHTML = value;
  return el.value;
}

listen.addEventListener("click", () => {
  if (isListening) {
    recognition?.stop();
  } else {
    startRecognition();
  }
});

$("clear").addEventListener("click", () => {
  historyBox.replaceChildren();
  empty.hidden = false;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
});

updateLabels();
