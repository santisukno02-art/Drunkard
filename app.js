(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const state = {
    sound: true,
    diceCount: 1,
    deck: [],
    drawnCards: [],
    doraDeck: [],
    kingDeck: [],
    kingPlayers: 4,
    kingRound: 0,
    fingers: new Map(),
    fingerTimer: null,
    countingFingers: false,
    raceAnimals: [],
    raceBusy: false
  };

  const suits = [
    {s:"♠", red:false}, {s:"♥", red:true}, {s:"♦", red:true}, {s:"♣", red:false}
  ];
  const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

  // ไพ่โดเรม่อน: 52 ใบ = A-K x 4 ดอก โดยไพ่แต่ละอันดับมีความสามารถเดียวกัน
  // อ้างอิงชุดกติกาไพ่โดเรม่อน/เกมการ์ดวงเหล้าที่พบจากแหล่งข้อมูลออนไลน์
  const doraAbilities = {
    A: {emoji:"🍺", title:"กินคนเดียว", text:"คนที่จั่วได้กินคนเดียว"},
    "2": {emoji:"👥", title:"หาเพื่อนกิน 1 คน", text:"เลือกเพื่อน 1 คนมาร่วมทำตามคำสั่ง"},
    "3": {emoji:"👥", title:"หาเพื่อนกิน 2 คน", text:"เลือกเพื่อน 2 คนมาร่วมทำตามคำสั่ง"},
    "4": {emoji:"👈", title:"เพื่อนฝั่งซ้ายกิน", text:"คนทางซ้ายของผู้จั่วทำตามคำสั่ง"},
    "5": {emoji:"🍻", title:"เฮฮาล้อมวง", text:"ทุกคนในวงทำตามคำสั่ง"},
    "6": {emoji:"👉", title:"เพื่อนฝั่งขวากิน", text:"คนทางขวาของผู้จั่วทำตามคำสั่ง"},
    "7": {emoji:"🎤", title:"ดวลปอด", text:"หาคู่ประลอง ใครแพ้เป็นผู้โดนตามกติกาของวง"},
    "8": {emoji:"⏸️", title:"Relax", text:"ทุกคนพักได้ตามอัธยาศัย"},
    "9": {emoji:"🎯", title:"มินิเกม", text:"เปิดมินิเกมที่ตกลงกันไว้ ใครแพ้เป็นผู้โดน"},
    "10": {emoji:"🧴", title:"เลอะ", text:"ทาแป้ง/ทำภารกิจตามกติกาของวง"},
    J: {emoji:"🫵", title:"จับหน้า", text:"ผู้จั่วจับหน้า ทุกคนทำตาม ใครช้าสุดเป็นผู้โดน"},
    Q: {emoji:"🤫", title:"แหม่มเพื่อนไม่คบ", text:"ห้ามตอบคำถามของผู้ถือ Q จนกว่าจะถึงเงื่อนไขที่ตกลง"},
    K: {emoji:"👑", title:"KING", text:"ทำตามกฎ KING ที่ตกลงก่อนเริ่ม และกำหนดกฎ KING คนต่อไป"}
  };

  const kingCommands = [
    ["👑","KING — คนที่ได้ K รอด และสามารถสั่งคนอื่นได้"],
    ["🍺","KING สั่งให้ใครก็ได้ทำภารกิจ 1 อย่าง"],
    ["🎯","KING เลือกคน 1 คนให้ทำภารกิจที่กำหนด"],
    ["👥","KING เลือก 2 คนให้ทำภารกิจพร้อมกัน"],
    ["🤫","KING ตั้งกฎห้ามพูด 1 ข้อ จนกว่าจะถึงรอบถัดไป"],
    ["😂","KING ตั้งกติกา: คนที่หัวเราะก่อนเป็นผู้ทำภารกิจ"],
    ["🫵","KING เลือกคนหนึ่งคนเป็นผู้ช่วย"],
    ["🔄","KING ส่งต่อสิทธิ์การสั่งให้คนอื่น 1 ครั้ง"]
  ];

  const commandCards = [
    ["🔥","เลือกเพื่อน 1 คนให้ดื่ม"],["👈","คนทางซ้ายดื่ม"],["👉","คนทางขวาดื่ม"],
    ["🍻","ทุกคนดื่มพร้อมกัน"],["🎯","สุ่มคน 1 คนดื่ม"],["😂","คนที่หัวเราะก่อนดื่ม"],
    ["🤫","ห้ามพูด 30 วินาที"],["🗣️","พูดประโยคนี้ด้วยเสียงตลก"],["🕺","ทำท่าเต้น 5 วินาที"],
    ["🥤","พัก 1 รอบ"],["👥","เลือกเพื่อน 2 คนให้ดื่ม"],["🔄","ส่งต่อคำสั่งให้คนถัดไป"]
  ];

  const animals = [
    ["🐇","กระต่าย"],["🐢","เต่า"],["🦒","ยีราฟ"],["🐅","เสือ"],["🐘","ช้าง"],
    ["🐊","จระเข้"],["🦜","นก"],["🦆","เป็ด"],["🦓","ม้าลาย"],["🐟","ปลา"]
  ];
  const maps = [
    ["🌳","ป่าเขียว"],["🏖️","ชายหาด"],["🏜️","ทะเลทราย"],["🏘️","หมู่บ้าน"],["🌲","ป่าสน"],
    ["🌋","ภูเขาไฟ"],["🌼","ทุ่งดอกไม้"],["🌧️","ทางฝนตก"]
  ];
  const fingerColors = ["#ff5b8d","#5cc8ff","#ffd166","#6ee7b7","#b692ff","#ff9f43","#60a5fa","#f472b6","#a3e635","#22d3ee"];

  function shuffle(arr) {
    const a = [...arr];
    for (let i=a.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
  function beep(freq=440,duration=.06) {
    if(!state.sound) return;
    try {
      const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
      const ctx=beep.ctx||(beep.ctx=new AC());
      const osc=ctx.createOscillator(), gain=ctx.createGain();
      osc.frequency.value=freq; osc.type="sine";
      gain.gain.setValueAtTime(.035,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);
      osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+duration);
    } catch(_){}
  }
  function toast(message){
    const el=$("#toast"); el.textContent=message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),1800);
  }
  function goHome(){
    clearInterval(state.fingerTimer); state.fingerTimer=null; state.countingFingers=false;
    state.raceBusy=false; $("#gameView").classList.remove("active"); $("#homeView").classList.add("active"); $("#gameContent").innerHTML="";
  }
  function openGame(key){
    $("#homeView").classList.remove("active"); $("#gameView").classList.add("active");
    const names={dice:"ลูกเต๋า",cards:"เกมไพ่",finger:"จิ้มนิ้ว",doraemon:"ไพ่โดเรม่อน",king:"King Game",command:"ไพ่คำสั่ง",race:"สัตว์วิ่งแข่ง"};
    $("#gameEyebrow").textContent="PARTY GAME"; $("#gameTitle").textContent=names[key]||"เกม";
    ({dice:renderDice,cards:renderCards,finger:renderFinger,doraemon:renderDoraemon,king:renderKing,command:renderCommand,race:renderRace}[key])();
  }

  // ---------- Dice: CSS 3D cube ----------
  const faceDots = {
    1:"<i></i>", 2:"<i></i><i></i>", 3:"<i></i><i></i><i></i", 4:"<i></i><i></i><i></i><i></i", 5:"<i></i><i></i><i></i><i></i><i></i", 6:"<i></i><i></i><i></i><i></i><i></i><i></i"
  };
  function dieMarkup(value="?"){
    return `<div class="die3d"><div class="cube ${value!=="?"?"settled":""}"><div class="face front">${faceDots[value]||""}</div><div class="face back">${faceDots[value]||""}</div><div class="face right">${faceDots[value]||""}</div><div class="face left">${faceDots[value]||""}</div><div class="face top">${faceDots[value]||""}</div><div class="face bottom">${faceDots[value]||""}</div></div></div>`;
  }
  function renderDice(){
    $("#gameContent").innerHTML=`<div class="game-panel"><div class="status">ลูกเต๋า <strong id="diceCount">${state.diceCount}</strong> ลูก • กดทอยเพื่อสุ่ม</div><div class="dice-stage" id="diceStage"></div><div class="dice-total" id="diceTotal">—</div><div class="controls"><button class="secondary" id="minusDie">− ลูกเต๋า</button><button class="primary" id="rollDice">🎲 ทอย</button><button class="secondary" id="plusDie">+ ลูกเต๋า</button></div></div>`;
    renderDiceFaces();
    $("#plusDie").onclick=()=>{if(state.diceCount<20){state.diceCount++;renderDiceFaces();}};
    $("#minusDie").onclick=()=>{if(state.diceCount>1){state.diceCount--;renderDiceFaces();}};
    $("#rollDice").onclick=rollDice;
  }
  function renderDiceFaces(values=[]){
    const stage=$("#diceStage"); if(!stage)return;
    stage.innerHTML=Array.from({length:state.diceCount},(_,i)=>dieMarkup(values[i]||"?")).join("");
    $("#diceCount").textContent=state.diceCount;
    $("#diceTotal").textContent=values.length?`รวม = ${values.reduce((a,b)=>a+b,0)}`:"—";
  }
  function rollDice(){
    const values=Array.from({length:state.diceCount},()=>1+Math.floor(Math.random()*6));
    const cubes=$$(".cube",$("#diceStage"));
    cubes.forEach((cube,i)=>{cube.classList.remove("rolling","settled"); cube.style.setProperty("--rx",`${720+Math.floor(Math.random()*360)}deg`); cube.style.setProperty("--ry",`${720+Math.floor(Math.random()*360)}deg`); cube.style.setProperty("--rz",`${360+Math.floor(Math.random()*360)}deg`); void cube.offsetWidth; cube.classList.add("rolling"); setTimeout(()=>{cube.classList.remove("rolling");cube.classList.add("settled");cube.parentElement.outerHTML=dieMarkup(values[i]);},1050);});
    $("#diceTotal").textContent="กำลังทอย..."; beep(380,.08); setTimeout(()=>{renderDiceFaces(values);beep(850,.1);},1100);
  }

  // ---------- Normal cards: keep every drawn card ----------
  function newDeck(){state.deck=shuffle(suits.flatMap(s=>ranks.map(rank=>({suit:s.s,red:s.red,rank})))); state.drawnCards=[];}
  function cardHTML(card,small=false){return `<div class="playing-card ${card.red?"red":""} ${small?"small-card":""}"><div class="card-corner">${card.rank}<br>${card.suit}</div><div class="card-center">${card.suit}</div><div class="card-corner rotate">${card.rank}<br>${card.suit}</div></div>`;}
  function renderCards(){
    if(!state.deck.length && !state.drawnCards.length)newDeck();
    $("#gameContent").innerHTML=`<div class="game-panel"><div class="status">จั่วแล้วจะเก็บไพ่ที่เปิดไว้ทุกใบ • เหลือในสำรับ <strong id="deckLeft">${state.deck.length}</strong> ใบ</div><div class="big-card-wrap" id="normalCard">${state.drawnCards.length?cardHTML(state.drawnCards[state.drawnCards.length-1]):"<div class=\"empty-card\">🃏<br><span>กดสุ่มไพ่</span></div>"}</div><div class="controls"><button class="primary" id="drawCard">🃏 สุ่มไพ่</button><button class="secondary" id="resetDeck">🔄 รีเซ็ต / สับไพ่ใหม่</button></div><div class="history-title">ไพ่ที่จั่วแล้ว <span id="historyCount">${state.drawnCards.length}</span></div><div class="card-history" id="cardHistory">${state.drawnCards.slice().reverse().map(c=>cardHTML(c,true)).join("")}</div></div>`;
    $("#drawCard").onclick=drawNormalCard;
    $("#resetDeck").onclick=()=>{newDeck();renderCards();toast("สับไพ่ใหม่แล้ว");};
  }
  function drawNormalCard(){
    if(!state.deck.length){toast("ไพ่หมดสำรับแล้ว — กดรีเซ็ตเพื่อสับใหม่");return;}
    const card=state.deck.pop(); state.drawnCards.push(card); renderCards(); beep(740,.08);
  }

  // ---------- Finger ----------
  function renderFinger(){
    state.fingers.clear(); clearInterval(state.fingerTimer); state.fingerTimer=null; state.countingFingers=false;
    $("#gameContent").innerHTML=`<div class="game-panel"><div class="finger-count-outside"><span id="fingerCount">0</span> นิ้ว</div><div class="finger-help">แตะค้างไว้บนพื้นที่ด้านล่าง • ทุกนิ้วจะมีสีของตัวเอง</div><div class="finger-zone" id="fingerZone"><div id="fingerCountdown" class="countdown" hidden></div></div><div class="controls" style="margin-top:14px"><button class="secondary" id="clearFingers">↻ เริ่มใหม่</button></div></div>`;
    const zone=$("#fingerZone");
    const add=(id,x,y)=>{
      if(state.fingers.has(id)||state.fingers.size>=20)return;
      const idx=state.fingers.size%fingerColors.length, color=fingerColors[idx];
      const dot=document.createElement("div"); dot.className="finger-dot"; dot.dataset.id=id; dot.style.left=`${x}px`;dot.style.top=`${y}px`;dot.style.setProperty("--finger-color",color);dot.innerHTML=`<span>🔥</span>`; zone.appendChild(dot);
      state.fingers.set(id,{dot,x,y,color}); $("#fingerCount").textContent=state.fingers.size;
    };
    const move=(id,x,y)=>{const f=state.fingers.get(id);if(!f)return;f.x=x;f.y=y;f.dot.style.left=`${x}px`;f.dot.style.top=`${y}px`;};
    const remove=id=>{const f=state.fingers.get(id);if(!f)return;f.dot.remove();state.fingers.delete(id);$("#fingerCount").textContent=state.fingers.size;};
    zone.addEventListener("pointerdown",e=>{if(state.countingFingers)return;const r=zone.getBoundingClientRect();zone.setPointerCapture?.(e.pointerId);add(e.pointerId,e.clientX-r.left,e.clientY-r.top);beep(520,.04);if(state.fingers.size>=2)scheduleFingerPick();});
    zone.addEventListener("pointermove",e=>{const r=zone.getBoundingClientRect();move(e.pointerId,e.clientX-r.left,e.clientY-r.top);});
    ["pointerup","pointercancel"].forEach(t=>zone.addEventListener(t,e=>remove(e.pointerId)));
    $("#clearFingers").onclick=()=>{clearInterval(state.fingerTimer);state.fingerTimer=null;state.countingFingers=false;state.fingers.clear();$$('.finger-dot',zone).forEach(x=>x.remove());$("#fingerCount").textContent="0";$("#fingerCountdown").hidden=true;};
  }
  function scheduleFingerPick(){
    if(state.countingFingers)return; state.countingFingers=true;
    const cd=$("#fingerCountdown"); let n=3; cd.hidden=false; cd.textContent=n; beep(420,.07);
    state.fingerTimer=setInterval(()=>{
      if(state.fingers.size<2){clearInterval(state.fingerTimer);state.fingerTimer=null;state.countingFingers=false;cd.hidden=true;return;}
      n--; cd.textContent=n; beep(500+n*80,.07);
      if(n<=0){clearInterval(state.fingerTimer);state.fingerTimer=null;cd.hidden=true;const ids=[...state.fingers.keys()];const winner=ids[Math.floor(Math.random()*ids.length)];state.fingers.forEach((f,id)=>f.dot.classList.toggle("selected",id===winner));beep(980,.18);toast("🔥 นิ้วที่ถูกเลือกยังติดไฟ!");state.countingFingers=false;}
    },1000);
  }

  // ---------- Doraemon 52 cards ----------
  function newDoraDeck(){
    state.doraDeck=shuffle(suits.flatMap(s=>ranks.map(rank=>({rank,suit:s.s,red:s.red,...doraAbilities[rank]}))));
  }
  function renderDoraemon(){
    if(!state.doraDeck.length)newDoraDeck();
    $("#gameContent").innerHTML=`<div class="game-panel"><div class="status">สำรับโดเรม่อน <strong>52 ใบ</strong> • ไพ่แต่ละอันดับมีความสามารถประจำตัว • เหลือ <strong id="doraLeft">${state.doraDeck.length}</strong> ใบ</div><div id="doraCard" class="command-card"><div><div class="command-emoji">🃏</div><div class="command-text" style="font-size:30px">ไพ่โดเรม่อน</div><div class="command-sub">กดจั่วเพื่อเปิดไพ่</div></div></div><div class="controls" style="margin-top:14px"><button class="primary" id="drawDora">🃏 จั่วไพ่</button><button class="secondary" id="resetDora">🔄 สับไพ่ใหม่</button></div></div>`;
    $("#drawDora").onclick=()=>{if(!state.doraDeck.length){toast("ไพ่หมดสำรับ — กดสับไพ่ใหม่");return;}const c=state.doraDeck.pop();$("#doraCard").innerHTML=`<div><div class="dora-card-rank">${c.rank} ${c.suit}</div><div class="command-emoji">${c.emoji}</div><div class="command-text">${c.title}</div><div class="command-sub">${c.text}<br>เหลือ ${state.doraDeck.length} ใบ</div></div>`;$("#doraLeft").textContent=state.doraDeck.length;beep(700,.1);};
    $("#resetDora").onclick=()=>{newDoraDeck();renderDoraemon();toast("สับไพ่โดเรม่อนใหม่แล้ว");};
  }

  // ---------- King Game: setup players, deal one card per direction/player ----------
  function newKingDeck(){state.kingDeck=shuffle(suits.flatMap(s=>ranks.map(rank=>({rank,suit:s.s,red:s.red}))));}
  function renderKing(){
    newKingDeck(); state.kingRound=0;
    $("#gameContent").innerHTML=`<div class="game-panel"><div class="status">กำหนดจำนวนคนก่อน แล้วระบบจะแจกไพ่ให้ครบตามจำนวนที่เลือก</div><div class="king-setup"><label>จำนวนผู้เล่น <select id="kingPlayers">${Array.from({length:9},(_,i)=>`<option value="${i+2}" ${i+2===state.kingPlayers?"selected":""}>${i+2} คน</option>`).join("")}</select></label><button class="primary" id="dealKing">🃏 แจกไพ่</button></div><div id="kingBoard" class="king-board" hidden></div></div>`;
    $("#kingPlayers").onchange=e=>state.kingPlayers=Number(e.target.value);
    $("#dealKing").onclick=dealKing;
  }
  function dealKing(){
    newKingDeck(); state.kingRound++;
    const cards=state.kingDeck.splice(0,state.kingPlayers);
    const board=$("#kingBoard"); board.hidden=false;
    const directions=["เหนือ","ตะวันออกเฉียงเหนือ","ตะวันออก","ตะวันออกเฉียงใต้","ใต้","ตะวันตกเฉียงใต้","ตะวันตก","ตะวันตกเฉียงเหนือ","กลาง-ขวา","กลาง-ซ้าย"];
    board.innerHTML=`<div class="king-board-title">รอบที่ ${state.kingRound} • แจกครบ ${cards.length} ใบ</div><div class="king-cards">${cards.map((c,i)=>`<button class="king-card" data-i="${i}" type="button"><span class="king-direction">${directions[i]}</span><span class="card-back">?</span><span class="king-result"></span></button>`).join("")}</div><div class="controls" style="margin-top:14px"><button class="secondary" id="redealKing">🔄 สับแล้วแจกใหม่</button></div>`;
    $$(".king-card",board).forEach((el,i)=>el.onclick=()=>revealKingCard(el,cards[i],i));
    $("#redealKing").onclick=dealKing;
    toast(`แจกไพ่ ${cards.length} คนแล้ว`);
  }
  function revealKingCard(el,card,index){
    if(el.classList.contains("revealed"))return;
    el.classList.add("revealed");
    const ability=card.rank==="K";
    el.innerHTML=`<span class="king-direction">${$(".king-direction",el)?.textContent||""}</span><span class="king-face ${card.red?"red":""}">${card.rank}<br>${card.suit}</span><span class="king-result">${ability?"👑 KING — รอด! สั่งใครก็ได้":"ทำตามกติกาของวง"}</span>`;
    if(ability){beep(1000,.18);toast("👑 ได้ KING — รอดและสั่งคนอื่นได้");}else beep(650,.07);
  }

  // ---------- Command cards ----------
  function renderCommand(){
    $("#gameContent").innerHTML=`<div class="game-panel"><div class="status">จั่วแล้วทำตามคำสั่ง</div><div id="commandCard" class="command-card"><div><div class="command-emoji">🔥</div><div class="command-text" style="font-size:30px">พร้อมหรือยัง?</div><div class="command-sub">กดจั่วเพื่อสุ่มคำสั่ง</div></div></div><div class="controls" style="margin-top:14px"><button class="primary" id="drawCommand">🔥 จั่วคำสั่ง</button></div></div>`;
    $("#drawCommand").onclick=()=>{const [emoji,text]=commandCards[Math.floor(Math.random()*commandCards.length)];$("#commandCard").innerHTML=`<div><div class="command-emoji">${emoji}</div><div class="command-text">${text}</div></div>`;beep(700,.1);};
  }

  // ---------- Animal race ----------
  function renderRace(){
    state.raceAnimals=[]; state.raceBusy=false;
    $("#gameContent").innerHTML=`<div class="game-panel"><div class="race-setup" id="raceSetup"><div class="status">เลือกสัตว์ 2–10 ตัว • ระบบสุ่ม <strong>ระยะ 5M / 10M / 15M</strong> และ <strong>Map</strong> ทุกการแข่งขัน</div><div class="animal-grid" id="animalGrid"></div><div class="status"><strong id="selectedAnimalCount">0</strong> / 10 ตัว</div><div class="controls"><button class="primary" id="startRace" disabled>🏁 เริ่มแข่ง</button></div></div><div id="raceArea" hidden></div></div>`;
    const grid=$("#animalGrid");
    animals.forEach((a,i)=>{const b=document.createElement("button");b.type="button";b.className="animal";b.innerHTML=`<span class="emoji">${a[0]}</span><strong>${a[1]}</strong>`;b.onclick=()=>{if(b.classList.contains("selected")){b.classList.remove("selected");state.raceAnimals=state.raceAnimals.filter(x=>x!==i);}else if(state.raceAnimals.length<10){b.classList.add("selected");state.raceAnimals.push(i);}$("#selectedAnimalCount").textContent=state.raceAnimals.length;$("#startRace").disabled=state.raceAnimals.length<2;};grid.appendChild(b);});
    $("#startRace").onclick=startRace;
  }
  function startRace(){
    if(state.raceBusy||state.raceAnimals.length<2)return; state.raceBusy=true;
    const distance=[5,10,15][Math.floor(Math.random()*3)], map=maps[Math.floor(Math.random()*maps.length)];
    const racers=shuffle(state.raceAnimals).map(i=>({i,animal:animals[i][0],name:animals[i][1]}));
    $("#raceSetup").hidden=true; const area=$("#raceArea");area.hidden=false;
    area.innerHTML=`<div class="race-stage"><div class="race-info"><span>🏁 ${distance}M</span><span>${map[0]} ${map[1]}</span></div><div class="track" id="track"></div><div class="race-message" id="raceMessage">3</div><div id="podium"></div></div><div class="controls" style="margin-top:14px"><button class="primary" id="raceAgain">🏁 แข่งอีกครั้ง</button><button class="secondary" id="raceBackSetup">← เปลี่ยนสัตว์</button></div>`;
    racers.forEach((r,idx)=>{const lane=document.createElement("div");lane.className="lane";lane.innerHTML=`<span class="lane-name">${r.name}</span><span class="runner" id="runner-${idx}">${r.animal}</span><span class="finish"></span>`;$("#track").appendChild(lane);});
    $("#raceAgain").onclick=()=>{state.raceBusy=false;startRace();};$("#raceBackSetup").onclick=()=>{state.raceBusy=false;renderRace();};runRace(racers,distance);
  }
  function runRace(racers,distance){let n=3;$("#raceMessage").textContent=n;const timer=setInterval(()=>{n--;$("#raceMessage").textContent=n>0?n:"GO!";beep(420+n*90,.07);if(n<=0){clearInterval(timer);animateRacers(racers,distance);}},800);}
  function animateRacers(racers,distance){
    const base=4200+distance*80,results=[];
    racers.forEach((r,idx)=>{const runner=$("#runner-"+idx),duration=base*(.84+Math.random()*.32),start=performance.now(),phase=Math.random()*8;
      const frame=now=>{const p=Math.min(1,(now-start)/duration),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;const wobble=Math.sin(p*16+phase)*1.6+Math.sin(p*38)*.6;runner.style.left=`${Math.min(95,2+e*93+wobble)}%`;if(p<1)requestAnimationFrame(frame);else{results.push(r);if(results.length===racers.length)finishRace(results);}};requestAnimationFrame(frame);
    });
  }
  function finishRace(results){$("#raceMessage").textContent=`🏆 ${results[0].name} ชนะ!`;$("#podium").innerHTML=`<div class="podium">${results.slice(0,3).map((r,i)=>`<div class="podium-item ${i===0?"first":""}"><div>${["🥇","🥈","🥉"][i]}</div><div class="pemoji">${r.animal}</div><strong>${r.name}</strong></div>`).join("")}</div>`;beep(980,.18);}

  $$(".game-card").forEach(c=>c.addEventListener("click",()=>openGame(c.dataset.game)));
  $("#backBtn").addEventListener("click",goHome); $("#homeBtn").addEventListener("click",goHome);
  $("#soundBtn").addEventListener("click",()=>{state.sound=!state.sound;$("#soundBtn").textContent=state.sound?"🔊":"🔇";toast(state.sound?"เปิดเสียง":"ปิดเสียง");});
})();
