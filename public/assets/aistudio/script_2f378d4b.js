const $ = (id) => document.getElementById(id);

let selectedMode = "video", secondsLeft = 120, timerInterval = null;
let recognition = null, isRecording = false, transcriptText = "", savedText = "";
let mediaStream = null, mediaRecorder = null, chunks = [];
let currentTopic = null;

/* ---------- Topics ---------- */
const topics = [
  {tag:"Interview",icon:"💼",title:"Tell me about yourself",desc:"Introduce yourself, your education, your skills and your career goals in a clear and confident way."},
  {tag:"Placement",icon:"🏢",title:"Why should we hire you?",desc:"Explain your strengths, relevant skills and how you can contribute to a team."},
  {tag:"Placement",icon:"🏢",title:"Why TCS / Infosys?",desc:"Say why you want this company, what you know about it and how you fit."},
  {tag:"Interview",icon:"💼",title:"What is your biggest weakness?",desc:"Be honest, give one example and explain how you are improving it."},
  {tag:"Group Discussion",icon:"👥",title:"Is AI helpful for students?",desc:"Share your opinion, one example and a balanced conclusion."},
  {tag:"Group Discussion",icon:"👥",title:"Social media: good or bad for students?",desc:"Give two points on each side and then your own view."},
  {tag:"Personal Growth",icon:"🌱",title:"Describe a challenge you overcame",desc:"Explain the situation, the action you took and what you learned."},
  {tag:"Career",icon:"🎯",title:"What are your career goals?",desc:"Describe what you want to learn and the kind of impact you want to make."}
];

// Hi-IN Hindi ko Devanagari me likhta hai, isliye dono scripts
const FILLERS = new Set(["matlab","toh","basically","actually","yaani","yani","na","um","uh","like","मतलब","तो","बेसिकली","एक्चुअली","यानी","ना"]);
function countFillers(words){
  return words.filter(w => FILLERS.has(w.toLowerCase().replace(/[.,!?।]/g,""))).length;
}

/* ---------- Learning platforms (search / home links, nakli video links nahi) ---------- */
const enc = encodeURIComponent;
const P = {
  yt:(t,q,lang)=>({t, name:"YouTube", icon:"▶️", kind:"Video" + (lang ? " · " + lang : ""), url:"https://www.youtube.com/results?search_query=" + enc(q)}),
  web:(t,q)=>({t, name:"Articles (Google)", icon:"📄", kind:"Read", url:"https://www.google.com/search?q=" + enc(q)}),
  course:(t,q)=>({t, name:"Coursera", icon:"🎓", kind:"Online courses", url:"https://www.coursera.org/search?query=" + enc(q)}),
  nptel:(t)=>({t, name:"NPTEL", icon:"🏫", kind:"Free college courses", url:"https://nptel.ac.in/"}),
  pod:(t,q)=>({t, name:"Podcasts (Spotify)", icon:"🎧", kind:"Listen", url:"https://open.spotify.com/search/" + enc(q)}),
  club:(t)=>({t, name:"Toastmasters", icon:"🎤", kind:"Speaking practice club", url:"https://www.toastmasters.org/"}),
  orai:(t)=>({t, name:"Orai", icon:"📱", kind:"AI speaking practice app", url:"https://orai.com/"}),
  yoodli:(t)=>({t, name:"Yoodli", icon:"🤖", kind:"AI speech coach", url:"https://yoodli.ai/"})
};
function learnRows(items){
  return items.map(i => '<a class="link-row" target="_blank" rel="noopener" href="' + i.url + '"><span class="ic">' + i.icon + '</span><div><b>' + escapeHtml(i.t) + '</b><small>' + escapeHtml(i.name) + ' · ' + escapeHtml(i.kind) + '</small></div></a>').join("");
}

const ADVICE = {
  filler:{
    name:"Filler words",
    why:"Fillers like 'matlab', 'toh' and 'basically' make you sound unsure and break your flow. Interviewers notice them quickly.",
    steps:[
      "Replace the filler with a silent pause. A one-second pause sounds confident, not awkward.",
      "Slow down a little. Fillers usually appear when your mouth is faster than your thinking.",
      "Use shorter sentences. Finish one idea, pause, then start the next.",
      "Find your own top 2-3 fillers (check your transcript) and focus on avoiding only those.",
      "Listen to your recording once and count the fillers. Awareness alone reduces them."
    ],
    practice:"Answer the same topic again in 60 seconds with zero fillers. Pause instead of filling the gap.",
    plan:[
      "Day 1-2: Speak for 1 minute daily on any topic. Whenever a filler comes, stop and pause for one second.",
      "Day 3-4: Prepare 3 points for your topic and pause between them. Record yourself and count fillers.",
      "Day 5-7: Do a 2-minute practice here daily and try to cut your filler count by 30% compared to Day 1."
    ],
    learn:[
      P.yt("How to avoid filler words (full guide)","how to avoid filler words full guide","English"),
      P.yt("Filler words kaise kam karein","filler words kaise kam kare hindi communication skills","Hindi"),
      P.web("Articles: how to stop using filler words","how to stop using filler words um uh like"),
      P.course("Courses on speaking clearly","public speaking"),
      P.pod("Podcasts on communication skills","communication skills podcast"),
      P.club("Practice with a speaking club"),
      P.orai("Try an AI speaking practice app")
    ]
  },
  pace:{
    name:"Speaking pace",
    why:"Too fast and the listener gets lost, too slow and they lose interest. About 120-160 words per minute feels clear and confident.",
    steps:[
      "Read a paragraph aloud for 1 minute and count the words. This tells you your natural pace.",
      "If you are fast: pause after every complete idea and breathe before the next sentence.",
      "If you are slow: practice your answer more so you do not search for words, and add some energy to your voice.",
      "Slow down on important words (skills, achievements) and move a little faster on connecting words.",
      "A 2-minute answer should have roughly 240-300 words. Use a timer while practicing."
    ],
    practice:"Read a short news paragraph aloud at a steady pace, then answer a topic at the same pace.",
    plan:[
      "Day 1-2: Read a paragraph aloud for 1 minute daily and count your words per minute.",
      "Day 3-4: Answer a topic while watching a timer. Pause after each point.",
      "Day 5-7: Do a 2-minute practice here daily and aim for 120-160 WPM."
    ],
    learn:[
      P.yt("How to control your speaking speed","how to control speaking speed public speaking","English"),
      P.yt("Bolne ki speed kaise sudharein","bolne ki speed kaise control kare hindi","Hindi"),
      P.web("Articles: right speaking pace","ideal speaking pace words per minute interview"),
      P.pod("Podcasts for clear speaking","public speaking podcast"),
      P.club("Practice with a speaking club"),
      P.yoodli("Try an AI speech coach")
    ]
  },
  posture:{
    name:"Posture",
    why:"On video, posture is the first thing an interviewer sees. Slouching can look low-energy or nervous, while sitting upright looks confident.",
    steps:[
      "Sit with your back against the chair and both feet flat on the floor.",
      "Keep your shoulders relaxed and level, not raised or hunched forward.",
      "Place the camera at eye level so you do not look down at the screen.",
      "Sit an arm's length from the screen so your face and both shoulders are visible.",
      "Set a mental reminder to check your posture every 30 seconds while speaking."
    ],
    practice:"Record again with a straight back and level shoulders. Try to keep your slouch score under 0.30.",
    plan:[
      "Day 1-2: Fix your setup: chair, camera at eye level, enough light. Practice sitting straight for 5 minutes.",
      "Day 3-4: Stick a note on your screen that says 'shoulders back'. Record a 2-minute practice.",
      "Day 5-7: Practice daily and compare your slouch score with Day 1."
    ],
    learn:[
      P.yt("How to improve sitting posture for video interviews","how to improve sitting posture for interview video call","English"),
      P.yt("Interview body language tips","interview body language tips hindi","Hindi"),
      P.web("Articles: posture and body language","body language posture confident interview"),
      P.course("Courses on body language","body language"),
      P.pod("Podcasts on confidence and presence","confidence body language podcast")
    ]
  },
  gesture:{
    name:"Hand gestures",
    why:"Natural hand gestures make your message more energetic and memorable. Frozen hands look stiff, and constant movement looks nervous.",
    steps:[
      "Keep your hands visible in the frame, around chest level.",
      "Use one simple gesture per key point, like counting points on your fingers or open palms while explaining.",
      "Avoid keeping your hands in your lap, in your pockets or hidden behind the desk.",
      "If you fidget, rest your hands lightly together between gestures.",
      "Practice in front of a mirror or record a quick video to see how you look."
    ],
    practice:"Answer a topic again and use a gesture for each of your three points.",
    plan:[
      "Day 1-2: Practice in front of a mirror. Add one natural gesture for each point.",
      "Day 3-4: Sit slightly farther from the camera so your hands are in the frame. Record yourself.",
      "Day 5-7: Do a 2-minute practice here daily and watch your recording for natural movement."
    ],
    learn:[
      P.yt("Hand gestures and body language for interviews","hand gestures body language interview","English"),
      P.yt("Body language aur hand gestures","body language hand gestures hindi public speaking","Hindi"),
      P.web("Articles: hand gestures while speaking","hand gestures while speaking tips"),
      P.course("Courses on public speaking","public speaking"),
      P.club("Practice with a speaking club")
    ]
  },
  structure:{
    name:"Answer structure",
    why:"A clear structure helps the listener follow you and shows organized thinking, which interviewers value.",
    steps:[
      "Start with a one-line introduction of your answer.",
      "Give 2 or 3 clear points, each with a short example.",
      "For experience questions, use STAR: Situation, Task, Action, Result.",
      "End with a one-line conclusion or your goal.",
      "Try to speak for the full 2 minutes. Very short answers miss chances to show your strengths."
    ],
    practice:"Answer the same topic again using: introduction, two points with examples, conclusion.",
    plan:[
      "Day 1-2: Write 3 bullet points for 3 common questions (Tell me about yourself, strengths, goals).",
      "Day 3-4: Practice each answer aloud using Introduction, Points, Conclusion.",
      "Day 5-7: Do a 2-minute practice here daily and speak for the full time."
    ],
    learn:[
      P.yt("How to structure an interview answer","interview answer structure tell me about yourself","English"),
      P.yt("Interview ke liye communication skills","communication skills for interview hindi","Hindi"),
      P.web("Articles: STAR method for interviews","STAR method interview answers examples"),
      P.course("Courses on interview skills","interview skills"),
      P.nptel("Soft skills courses (NPTEL)"),
      P.yoodli("Try an AI speech coach")
    ]
  }
};

const generalLearn = [
  P.yt("Communication skills for interviews","communication skills for interview in hindi","English / Hindi"),
  P.yt("Group discussion tips for freshers","group discussion tips for freshers hindi","Hinglish"),
  P.web("Articles: interview communication tips","interview communication tips for freshers"),
  P.course("Communication courses","communication skills"),
  P.nptel("Soft skills courses (NPTEL)"),
  P.pod("Communication podcasts","communication skills podcast"),
  P.club("Toastmasters: practice public speaking"),
  P.orai("Orai: AI speaking practice app"),
  P.yoodli("Yoodli: AI speech coach")
];

/* ---------- Helpers ---------- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmt(s){ return String(Math.floor(s/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0"); }
function todayStr(d = new Date()){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function dayDiff(a, b){
  const pa = a.split("-").map(Number), pb = b.split("-").map(Number);
  return Math.round((new Date(pb[0],pb[1]-1,pb[2]) - new Date(pa[0],pa[1]-1,pa[2])) / 86400000);
}
function agoLabel(day){
  const n = dayDiff(day, todayStr());
  return n === 0 ? "Today" : n === 1 ? "Yesterday" : n + " days ago";
}
function calcStreak(sessions){
  const days = new Set(sessions.map(s => s.day));
  let streak = 0, d = new Date();
  if (!days.has(todayStr(d))) d.setDate(d.getDate() - 1);
  while (days.has(todayStr(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
function loadSessions(){ try { return JSON.parse(localStorage.getItem("coachSessions") || "[]"); } catch(e){ return []; } }
function focusLabel(s){
  const p = s.problem || (s.fillers > 2 ? "filler" : "structure");
  const m = {filler:"Filler words", pace:"Pace", posture:"Posture", gesture:"Gestures", structure:"Structure"};
  return m[p] || "Structure";
}

/* ---------- Name + theme ---------- */
function getName(){ return localStorage.getItem("coachName") || ""; }
function renderName(){
  const n = getName();
  $("greet").textContent = n ? "Hi " + n + "! 👋" : "Hi there! 👋";
  $("resTitle").textContent = n ? "Great Job, " + n + "!" : "Great Job!";
  $("setName").textContent = n ? "Change name" : "Set your name";
}
$("setName").addEventListener("click", () => {
  const n = prompt("Aapka naam kya hai?", getName());
  if (n !== null) { localStorage.setItem("coachName", n.trim()); renderName(); }
});
function applyTheme(t){
  document.documentElement.dataset.theme = t;
  $("themeBtn").textContent = t === "dark" ? "☀️" : "🌙";
}
applyTheme(localStorage.getItem("coachTheme") || "light");
$("themeBtn").addEventListener("click", () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("coachTheme", t); applyTheme(t);
});

/* ---------- Navigation ---------- */
function showPage(id){
  if (isRecording && id !== "practice") stopRecording();   // page chhodte hi recording + camera band
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === id));
  document.querySelectorAll("[data-page]").forEach(b => b.classList.toggle("active", b.dataset.page === id));
  window.scrollTo({top:0, behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => showPage(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => showPage(b.dataset.goto)));
$("startHome").addEventListener("click", () => showPage("mode"));
document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
  if (!b.classList.contains("choice")) return;
  selectedMode = b.dataset.mode;
  document.querySelectorAll(".choice").forEach(c => c.classList.toggle("selected", c === b));
}));

$("continueMode").addEventListener("click", () => {
  currentTopic = topics[Math.floor(Math.random() * topics.length)];
  $("topicTag").textContent = currentTopic.tag;
  $("topicIcon").textContent = currentTopic.icon;
  $("topicTitle").textContent = currentTopic.title;
  $("topicDesc").textContent = currentTopic.desc;
  $("topicLinks").innerHTML = learnRows([
    P.yt('How to answer "' + currentTopic.title + '"', "how to answer " + currentTopic.title + " interview", "English"),
    P.yt("Sample answers & tips", currentTopic.title + " sample answer hindi", "Hindi"),
    P.web("Read: sample answer & tips", currentTopic.title + " interview answer tips")
  ]);
  showPage("topic");
});

/* ---------- Practice ---------- */
function updateTimerUI(){
  const e = 120 - secondsLeft;
  $("timerText").textContent = fmt(e) + " / 02:00";
  $("timerBar").style.width = (e / 120 * 100) + "%";
}
function updateLiveMetrics(){
  const t = transcriptText.trim();
  const words = t ? t.split(/\s+/) : [];
  const elapsed = 120 - secondsLeft;
  if (elapsed >= 10) {
    $("mFiller").textContent = (countFillers(words) / (elapsed / 60)).toFixed(1) + "/min";
    $("mWpm").textContent = Math.round(words.length / (elapsed / 60));
  } else {
    $("mFiller").textContent = "—"; $("mWpm").textContent = "—";
  }
}

$("beginPractice").addEventListener("click", () => {
  secondsLeft = 120; transcriptText = ""; savedText = ""; isRecording = false;
  $("transcript").textContent = "Your speech will appear here. If speech recognition is unavailable, type below.";
  $("manualTranscript").value = "";
  $("recordStatus").textContent = "Ready to record";
  $("recordBtn").classList.remove("hide"); $("stopBtn").classList.add("hide");
  $("preview").style.display = "none"; $("videoPlaceholder").classList.remove("hide");
  $("videoBox").style.display = selectedMode === "video" ? "grid" : "none";
  $("playback").style.display = "none"; $("playback").removeAttribute("src"); $("playbackHead").classList.add("hide");
  $("modeNotice").textContent = selectedMode === "video"
    ? "Video mode: sit straight for the first 5 seconds (it sets your posture baseline). Keep both shoulders and your hands in the frame."
    : "Audio-only mode: posture and gesture analysis are not used.";

  resetPoseData();
  $("mSlouch").textContent = "—";
  $("postureCard").style.display = "none";
  $("postureBadge").textContent = selectedMode === "video" ? "Posture: ready" : "";
  if (selectedMode === "video") loadPose();      // model pehle se load ho jata hai

  updateTimerUI(); updateLiveMetrics();
  showPage("practice");
});

async function startMedia(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio:true, video: selectedMode === "video"});
    if (!isRecording) { stream.getTracks().forEach(t => t.stop()); return; }   // permission ke dauran Stop dabaya ho
    mediaStream = stream;
    if (selectedMode === "video") {
      $("preview").srcObject = mediaStream;
      $("preview").style.display = "block";
      $("videoPlaceholder").classList.add("hide");
    }
    chunks = [];
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, {type: mediaRecorder.mimeType || "video/webm"});
      $("playback").src = URL.createObjectURL(blob);
      $("playback").style.display = "block";
      $("playbackHead").classList.remove("hide");
    };
    mediaRecorder.start();
    if (selectedMode === "video") startPose();
  } catch (e) {
    $("recordStatus").textContent = "Camera/mic permission nahi mili. Typing se bhi practice kar sakte ho.";
  }
}

function stopMedia(){
  stopPose();
  try { if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop(); } catch(e){}
  const s = mediaStream || $("preview").srcObject;
  if (s) s.getTracks().forEach(t => t.stop());
  mediaStream = null;
  $("preview").srcObject = null;
  $("preview").style.display = "none";
  $("videoPlaceholder").classList.remove("hide");
}

function startRecognition(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $("recordStatus").textContent = "Speech recognition not supported. Use Chrome or type your answer."; return; }
  recognition = new SR();
  recognition.lang = "hi-IN";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    let cur = "";
    for (let i = 0; i < e.results.length; i++) cur += e.results[i][0].transcript + " ";
    transcriptText = (savedText + cur).trim();
    $("transcript").textContent = transcriptText || "Listening...";
    updateLiveMetrics();
  };
  recognition.onerror = (e) => { if (e.error !== "no-speech") $("recordStatus").textContent = "Mic recognition stopped. You can type your answer."; };
  recognition.onend = () => {
    savedText = transcriptText + " ";
    if (isRecording) { try { recognition.start(); } catch(e){} }
  };
  try { recognition.start(); } catch(e){}
}

function stopRecording(){
  isRecording = false;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (recognition) { try { recognition.stop(); } catch(e){} }
  stopMedia();
  $("recordBtn").classList.remove("hide"); $("stopBtn").classList.add("hide");
  $("recordStatus").textContent = "Recording stopped";
  if (transcriptText) $("manualTranscript").value = transcriptText;
}

$("recordBtn").addEventListener("click", () => {
  if (isRecording) return;
  isRecording = true;
  savedText = transcriptText ? transcriptText + " " : "";
  $("recordBtn").classList.add("hide"); $("stopBtn").classList.remove("hide");
  $("recordStatus").innerHTML = '<span class="dot-red"></span>Recording...';
  startMedia();
  startRecognition();
  timerInterval = setInterval(() => {
    secondsLeft--;
    updateTimerUI(); updateLiveMetrics();
    if (secondsLeft <= 0) { stopRecording(); $("recordStatus").textContent = "Time is up!"; }
  }, 1000);
});
$("stopBtn").addEventListener("click", stopRecording);

/* ========== POSTURE + GESTURE (MediaPipe) ========== */
const MP_VER = "0.10.14";
let poseLandmarker = null, poseLoading = null, poseTimer = null;
let poseBase = [], baseRatio = null;                 // shuruaat ke 5 second = baseline
let poseSamples = [], poseTicks = 0, poseSeen = 0, recentSlouch = [];
let handMoves = [], handPrev = null, handTicks = 0, handVisible = 0;

function resetPoseData(){
  poseBase = []; baseRatio = null; poseSamples = []; poseTicks = 0; poseSeen = 0; recentSlouch = [];
  handMoves = []; handPrev = null; handTicks = 0; handVisible = 0;
}

// Model ek hi baar load hota hai (internet chahiye)
function loadPose(){
  if (poseLandmarker) return Promise.resolve(poseLandmarker);
  if (poseLoading) return poseLoading;
  poseLoading = (async () => {
    try {
      const base = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@" + MP_VER;
      const vision = await import(base + "/vision_bundle.mjs");
      const fileset = await vision.FilesetResolver.forVisionTasks(base + "/wasm");
      poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"},
        runningMode: "VIDEO",
        numPoses: 1
      });
      return poseLandmarker;
    } catch (e) {
      poseLoading = null;
      $("postureBadge").textContent = "Posture: unavailable";
      return null;
    }
  })();
  return poseLoading;
}

function postureLabel(x){ return x < 0.3 ? "Good" : x < 0.55 ? "Okay" : "Needs work"; }

function startPose(){
  stopPose();
  resetPoseData();
  $("postureBadge").textContent = "Posture: loading...";
  loadPose().then(lm => {
    if (!lm || !isRecording || poseTimer) return;
    $("postureBadge").textContent = "Sit straight (calibrating)...";
    poseTimer = setInterval(poseTick, 200);      // 5 baar per second kaafi hai
  });
}
function stopPose(){
  if (poseTimer) { clearInterval(poseTimer); poseTimer = null; }
}

function poseTick(){
  const v = $("preview");
  if (!poseLandmarker || !v.srcObject || v.readyState < 2 || !v.videoWidth) return;
  poseTicks++;
  let res;
  try { res = poseLandmarker.detectForVideo(v, performance.now()); } catch(e){ return; }
  const lm = res && res.landmarks && res.landmarks[0];
  if (!lm) return;

  const nose = lm[0], ls = lm[11], rs = lm[12];           // naak, left/right kandha
  if ((ls.visibility || 0) < 0.5 || (rs.visibility || 0) < 0.5) return;   // kandhe saaf nahi dikh rahe
  poseSeen++;

  const W = v.videoWidth, H = v.videoHeight;
  const shoulderW = Math.hypot((ls.x - rs.x) * W, (ls.y - rs.y) * H);
  if (shoulderW < 20) return;

  // ---- Gesture: kalai (wrist) kitni hili ----
  handTicks++;
  const lw = lm[15], rw = lm[16];
  const cur = {};
  if ((lw.visibility || 0) > 0.5) cur.l = {x: lw.x * W, y: lw.y * H};
  if ((rw.visibility || 0) > 0.5) cur.r = {x: rw.x * W, y: rw.y * H};
  if (cur.l || cur.r) {
    handVisible++;
    if (handPrev) {
      let d = 0, n = 0;
      ["l", "r"].forEach(k => {
        if (cur[k] && handPrev[k]) { d += Math.hypot(cur[k].x - handPrev[k].x, cur[k].y - handPrev[k].y) / shoulderW; n++; }
      });
      if (n) handMoves.push(d / n);
    }
  }
  handPrev = cur;

  // ---- Posture: sir aur kandhon ki doori ----
  const midY = ((ls.y + rs.y) / 2) * H;
  const ratio = (midY - nose.y * H) / shoulderW;
  const tilt = (Math.abs(ls.y - rs.y) * H) / shoulderW;

  // Pehle ~5 second (25 sample) me seedha baithne ka baseline banta hai
  if (baseRatio === null) {
    poseBase.push(ratio);
    if (poseBase.length >= 25) {
      const s = poseBase.slice().sort((a, b) => a - b);
      baseRatio = s[Math.floor(s.length / 2)];
    }
    return;
  }

  const drop = Math.max(0, (baseRatio - ratio) / baseRatio);
  const slouch = Math.min(1, 0.7 * Math.min(drop / 0.25, 1) + 0.3 * Math.min(tilt / 0.15, 1));
  poseSamples.push(slouch);
  recentSlouch.push(slouch);
  if (recentSlouch.length > 10) recentSlouch.shift();
  const avg = recentSlouch.reduce((a, b) => a + b, 0) / recentSlouch.length;
  $("mSlouch").textContent = avg.toFixed(2);
  $("postureBadge").textContent = "Posture: " + postureLabel(avg);
}

function summarizePose(){
  if (selectedMode !== "video" || poseTicks === 0) return null;
  const seen = poseSeen / poseTicks;
  if (poseSamples.length < 10 || seen < 0.5) return {ok:false, seen};
  const avg = poseSamples.reduce((a, b) => a + b, 0) / poseSamples.length;
  return {ok:true, avg, seen, label: postureLabel(avg)};
}

function summarizeGesture(){
  if (selectedMode !== "video" || handTicks < 25) return null;
  const vis = handVisible / handTicks;
  if (vis < 0.3 || handMoves.length < 10) return {status:"hidden", vis};
  const avg = handMoves.reduce((a, b) => a + b, 0) / handMoves.length;
  const status = avg < 0.04 ? "stiff" : avg > 0.5 ? "fidgety" : "good";
  return {status, vis, avg};
}

/* ---------- Analysis ---------- */
$("analyzeBtn").addEventListener("click", () => {
  if (isRecording) stopRecording();
  const text = ($("manualTranscript").value || transcriptText).trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const fillers = countFillers(words);
  const elapsed = 120 - secondsLeft;
  const wpm = elapsed >= 10 ? Math.round(words.length / (elapsed / 60)) : 0;
  const fillerRate = elapsed >= 10 ? fillers / (elapsed / 60) : fillers;
  const posture = summarizePose();
  const gesture = summarizeGesture();

  // 1) Saari problems ek list me. sev jitna bada, problem utni badi.
  const issues = [];
  if (fillers >= 2 && fillerRate > 4)
    issues.push({id:"filler", sev:Math.min(fillerRate / 4, 3), evidence: fillers + " filler words detected (" + fillerRate.toFixed(1) + " per minute)."});
  if (wpm > 170)
    issues.push({id:"pace", sev:Math.min(wpm / 170, 3), evidence:"You spoke fast: about " + wpm + " words per minute (comfortable range: 120-160)."});
  if (wpm > 0 && wpm < 110)
    issues.push({id:"pace", sev:Math.min(110 / wpm, 3), evidence:"You spoke slowly: about " + wpm + " words per minute (comfortable range: 120-160)."});
  if (posture && posture.ok && posture.avg >= 0.55)
    issues.push({id:"posture", sev:Math.min(posture.avg / 0.55, 3), evidence:"Your slouch score was " + posture.avg.toFixed(2) + " (lower is better, under 0.30 is good)."});
  if (gesture && (gesture.status === "stiff" || gesture.status === "fidgety"))
    issues.push({id:"gesture", sev:1.1, evidence: gesture.status === "stiff" ? "Your hands barely moved while you spoke." : "Your hands moved a lot, which can look nervous."});
  if (words.length < 30)
    issues.push({id:"structure", sev:1.3, evidence:"Your answer was short (" + words.length + " words). Try to speak for the full 2 minutes."});

  issues.sort((a, b) => b.sev - a.sev);
  const main = issues[0] || {id:"structure", sev:1, evidence:"No big problem found. Your next goal is a clear structure: introduction, two points, conclusion."};
  const others = issues.slice(1);

  // 2) Score
  let score = 90;
  score -= Math.min(fillers * 3, 30);
  if (issues.some(i => i.id === "pace")) score -= 10;
  if (issues.some(i => i.id === "posture")) score -= 10;
  if (issues.some(i => i.id === "gesture")) score -= 5;
  if (words.length < 30) score -= 15;
  score = Math.max(20, Math.min(96, score));

  // 3) Strengths
  const strengths = [];
  if (wpm >= 110 && wpm <= 170) strengths.push("Your speaking pace (" + wpm + " WPM) was in a comfortable range.");
  if (fillers <= 1 && words.length >= 20) strengths.push("You used very few filler words. Nice control!");
  if (posture && posture.ok && posture.avg < 0.3) strengths.push("Your posture was upright and steady.");
  if (gesture && gesture.status === "good") strengths.push("Your hand gestures looked natural.");
  if (words.length >= 100) strengths.push("You gave a full-length answer and kept going.");
  if (!strengths.length) strengths.push("You completed a practice session. Consistency is what builds confidence.");

  // 4) Result page bharo
  $("scoreNum").textContent = score + "%";
  $("scoreRing").style.background = "conic-gradient(var(--green) 0 " + score + "%, var(--line) " + score + "%)";
  $("fillerNum").textContent = fillers;
  $("wpmNum").textContent = wpm;
  $("wordNum").textContent = words.length;

  const A = ADVICE[main.id];
  $("strengthList").innerHTML = strengths.map(s => "<li>" + escapeHtml(s) + "</li>").join("");
  $("mainName").textContent = A.name;
  $("mainEvidence").textContent = main.evidence;
  $("mainWhy").textContent = A.why;
  $("howList").innerHTML = A.steps.map(s => "<li>" + escapeHtml(s) + "</li>").join("");
  $("practiceNext").textContent = A.practice;
  $("planList").innerHTML = A.plan.map(s => "<li>" + escapeHtml(s) + "</li>").join("");
  $("otherList").innerHTML = others.length
    ? others.map(o => "<li><b>" + escapeHtml(ADVICE[o.id].name) + ":</b> " + escapeHtml(o.evidence) + "</li>").join("")
    : "<li>Nothing else major this time. Keep practicing daily.</li>";
  $("learnList").innerHTML = learnRows(A.learn);

  // Posture + gesture card
  const lines = [];
  if (posture) lines.push(posture.ok
    ? "Posture: slouch score " + posture.avg.toFixed(2) + " (" + posture.label + "). You were visible " + Math.round(posture.seen * 100) + "% of the time. Lower is better."
    : "Posture: not enough data. Keep your face and both shoulders in the frame and record at least 15 seconds.");
  if (gesture) {
    const g = {
      hidden:"Your hands were mostly out of the camera. Sit a little farther back so we can see them.",
      stiff:"Your hands barely moved. Add simple gestures at chest level.",
      fidgety:"Your hands moved a lot. Try calmer, purposeful gestures.",
      good:"Your hand movement looked natural."
    };
    lines.push("Gestures: " + g[gesture.status]);
  }
  $("bodyText").innerHTML = lines.map(l => "<p>" + escapeHtml(l) + "</p>").join("");
  $("postureCard").style.display = lines.length ? "block" : "none";

  // 5) Save
  const sessions = loadSessions();
  sessions.push({
    day: todayStr(),
    date: new Date().toLocaleDateString("en-IN", {day:"2-digit", month:"short", year:"numeric"}),
    score, fillers, wpm, words: words.length,
    topic: currentTopic ? currentTopic.title : "",
    problem: main.id,
    slouch: (posture && posture.ok) ? +posture.avg.toFixed(2) : null
  });
  localStorage.setItem("coachSessions", JSON.stringify(sessions));
  renderAll();
  showPage("results");
});
$("againBtn").addEventListener("click", () => showPage("mode"));

/* ---------- Dashboard / History ---------- */
function renderWeek(sessions){
  const days = new Set(sessions.map(s => s.day));
  const names = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  let html = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const key = todayStr(d);
    const cls = "dot" + (days.has(key) ? " done" : "") + (key === todayStr() ? " today" : "");
    html += '<div>' + names[i] + '<div class="' + cls + '">' + (days.has(key) ? "✓" : "-") + '</div></div>';
  }
  $("weekRow").innerHTML = html;
}

function renderAll(){
  const sessions = loadSessions();
  const first = sessions[0], last = sessions[sessions.length - 1];
  const st = calcStreak(sessions);
  const streakTxt = st + " day" + (st === 1 ? "" : "s");

  $("streakValue").textContent = streakTxt;
  $("streakSub").textContent = st > 0 ? "Keep going! 🔥" : "Start today!";
  $("lastScore").textContent = last ? last.score + "%" : "—";
  $("lastScoreSub").textContent = last ? "(" + agoLabel(last.day) + ")" : "No practice yet";
  $("firstScore").textContent = first ? first.score + "%" : "—";
  $("firstSub").textContent = first ? "(" + agoLabel(first.day) + ")" : "Not started";
  $("latestScore").textContent = last ? last.score + "%" : "—";
  $("firstBar").style.width = (first ? first.score : 0) + "%";
  $("latestBar").style.width = (last ? last.score : 0) + "%";

  $("streakBig").textContent = streakTxt;
  $("streakMsg").textContent = st > 0 ? "You're on fire! Keep it up! 🔥" : "Practice today to start your streak!";
  renderWeek(sessions);

  $("histFirst").textContent = first ? first.score + "%" : "—";
  $("histToday").textContent = last ? last.score + "%" : "—";
  $("histFirstBar").style.width = (first ? first.score : 0) + "%";
  $("histTodayBar").style.width = (last ? last.score : 0) + "%";

  if (!sessions.length) {
    $("histTable").innerHTML = '<p class="muted">No sessions yet. Complete your first practice to see it here.</p>';
    return;
  }
  $("histTable").innerHTML = "<table><tr><th>Date</th><th>Score</th><th>Main Issue</th></tr>" +
    sessions.slice(-7).reverse().map(s => {
      const c = s.score >= 70 ? "s-good" : s.score >= 50 ? "s-mid" : "s-low";
      return "<tr><td>" + s.date + "<br><small class='muted'>" + escapeHtml(s.topic) + "</small></td><td class='" + c + "'>" + s.score + "%</td><td>" + focusLabel(s) + "</td></tr>";
    }).join("") + "</table>";
}

$("shareBtn").addEventListener("click", () => {
  const sessions = loadSessions();
  const last = sessions[sessions.length - 1];
  const msg = "🔥 I'm on a " + calcStreak(sessions) + "-day streak on AI Communication Coach!" + (last ? " Latest score: " + last.score + "%." : "") + " Practicing daily to improve my communication.";
  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
});
$("clearHistory").addEventListener("click", () => {
  if (confirm("Clear all practice history saved in this browser?")) { localStorage.removeItem("coachSessions"); renderAll(); }
});

/* ---------- Init ---------- */
$("resList").innerHTML = learnRows(generalLearn);
renderName();
renderAll();