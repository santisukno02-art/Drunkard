(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const state = {
    sound: true,
    diceCount: 1,
    deck: [],
    doraDeck: [],
    kingDeck: [],
    commandDeck: [],
    fingers: new Map(),
    raceAnimals: [],
    raceBusy: false
  };

  const suits = [
    {s:"♠", name:"โพดำ", red:false},
    {s:"♥", name:"โพแดง", red:true},
    {s:"♦", name:"ข้าวหลามตัด", red:true},
    {s:"♣", name:"ดอกจิก", red:false}
  ];
  const ranks = [
    ["A","🅰️"],["2","2️⃣"],["3","3️⃣"],["4","4️⃣"],["5","5️⃣"],["6","6️⃣"],
    ["7","7️⃣"],["8","8️⃣"],["9","9️⃣"],["10","🔟"],["J","J"],["Q","Q"],["K","K"]
  ];

  const doraCommands = [
    ["🍺","กินคนเดียว"],["👥","หาเพื่อนกิน 1 คน"],["👥","หาเพื่อนกิน 2 คน"],
    ["👈","เพื่อนฝั่งซ้ายกิน"],["👉","เพื่อนฝั่งขวากิน"],["🍻","ทุกคนกิน"],
    ["⏸️","พัก 1 รอบ"],["🎯","เลือกใครก็ได้ 1 คนให้กิน"],["😂","คนที่หัวเราะคนแรกกิน"],
    ["🗣️","พูดคำต้องห้ามไม่ได้จนกว่าจะถึงรอบตัวเอง"],["👑","KING"],["🫵","ชี้คนที่คิดว่าซวยที่สุด"]
  ];
  const kingCommands = [
    ["👑","KING — คนที่จั่วได้เป็น King"],["🍺","สั่งให้ใครก็ได้กิน 1 ครั้ง"],
    ["👥","เลือก 2 คนให้กินพร้อมกัน"],["👉","คนทางขวากิน"],["👈","คนทางซ้ายกิน"],
    ["🍻","ทุกคนกิน"],["🎯","เลือกคน 1 คนเป็นผู้ช่วยของคุณ"],["🤫","ห้ามพูดจนกว่าจะถึงรอบตัวเอง"],
    ["😂","คนที่หัวเราะคนแรกกิน"],["🫵","เลือกคนหนึ่งคนให้จั่วต่อทันที"]
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

  function shuffle(arr) {
    const a = [...arr];
    for (let i=a.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function beep(freq=440, duration=.06) {
    if (!state.sound) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = beep.ctx || (beep.ctx = new AC());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function goHome() {
    $("#gameView").classList.remove("active");
    $("#homeView").classList.add("active");
    $("#gameContent").innerHTML = "";
    state.raceBusy = false;
  }

  function openGame(key) {
    $("#homeView").classList.remove("active");
    $("#gameView").classList.add("active");
    const names = {
      dice:"ลูกเต๋า", cards:"เกมไพ่", finger:"จิ้มนิ้ว",
      doraemon:"ไพ่โดเรม่อน", king:"King Game", command:"ไพ่คำสั่ง", race:"สัตว์วิ่งแข่ง"
    };
    $("#gameEyebrow").textContent = "PARTY GAME";
    $("#gameTitle").textContent = names[key] || "เกม";
    const renderers = {dice:renderDice,cards:renderCards,finger:renderFinger,doraemon:renderDoraemon,king:renderKing,command:renderCommand,race:renderRace};
    renderers[key]();
  }

  function renderDice() {
    $("#gameContent").innerHTML = `
      <div class="game-panel">
        <div class="status">มีลูกเต๋า <strong id="diceCount">${state.diceCount}</strong> ลูก</div>
        <div class="dice-stage" id="diceStage"></div>
        <div class="dice-total" id="diceTotal">—</div>
        <div class="controls">
          <button class="secondary" id="minusDie" type="button">− ลูกเต๋า</button>
          <button class="primary" id="rollDice" type="button">🎲 ทอย</button>
          <button class="secondary" id="plusDie" type="button">+ ลูกเต๋า</button>
        </div>
      </div>`;
    renderDiceFaces();
    $("#plusDie").addEventListener("click",()=>{ if(state.diceCount<20){state.diceCount++;renderDiceFaces();}});
    $("#minusDie").addEventListener("click",()=>{ if(state.diceCount>1){state.diceCount--;renderDiceFaces();}});
    $("#rollDice").addEventListener("click",rollDice);
  }

  function renderDiceFaces(values=[]) {
    const stage = $("#diceStage");
    if (!stage) return;
    stage.innerHTML = "";
    for(let i=0;i<state.diceCount;i++){
      const d = document.createElement("div");
      d.className="die";
      d.textContent = values[i] || "⚄";
      stage.appendChild(d);
    }
    $("#diceCount").textContent = state.diceCount;
    $("#diceTotal").textContent = values.length ? `รวม = ${values.reduce((a,b)=>a+b,0)}` : "—";
  }

  function rollDice() {
    const values = Array.from({length:state.diceCount},()=>1+Math.floor(Math.random()*6));
    const diceEls = $$(".die", $("#diceStage"));
    diceEls.forEach(d=>{d.classList.remove("rolling"); void d.offsetWidth; d.classList.add("rolling");});
    beep(620,.09);
    setTimeout(()=>{renderDiceFaces(values); beep(820,.08);},600);
  }

  function newDeck() {
    state.deck = shuffle(suits.flatMap(s => ranks.map(r => ({suit:s.s, rank:r[0], red:s.red}))));
  }

  function renderCards() {
    if (!state.deck.length) newDeck();
    $("#gameContent").innerHTML = `
      <div class="game-panel">
        <div class="status">สำรับไพ่ 52 ใบ • จั่วทีละ 1 ใบ</div>
        <div class="big-card-wrap" id="normalCard"></div>
        <div class="controls">
          <button class="primary" id="drawCard" type="button">🃏 สุ่มไพ่</button>
          <button class="secondary" id="resetDeck" type="button">🔄 รีเซ็ต / สับไพ่ใหม่</button>
        </div>
        <div class="card-reset-note" id="deckNote">ยังไม่ได้จั่วไพ่</div>
      </div>`;
    $("#drawCard").addEventListener("click",drawNormalCard);
    $("#resetDeck").addEventListener("click",()=>{newDeck();$("#normalCard").innerHTML="";$("#deckNote").textContent="สับไพ่ใหม่แล้ว";toast("สับไพ่ใหม่แล้ว");});
  }

  function drawNormalCard() {
    if (!state.deck.length) newDeck();
    const card = state.deck.pop();
    $("#normalCard").innerHTML = `
      <div class="playing-card ${card.red ? "red":""}">
        <div class="card-corner">${card.rank}<br>${card.suit}</div>
        <div class="card-center">${card.suit}</div>
        <div class="card-corner" style="transform:rotate(180deg)">${card.rank}<br>${card.suit}</div>
      </div>`;
    $("#deckNote").textContent = `เหลือในสำรับ ${state.deck.length} ใบ`;
    beep(740,.08);
  }

  function renderFinger() {
    $("#gameContent").innerHTML = `
      <div class="game-panel">
        <div class="finger-count"><span id="fingerCount">0</span> นิ้ว</div>
        <div class="finger-help">ให้ทุกคนแตะหน้าจอค้างไว้ แล้วรอ 3 วินาที</div>
        <div class="finger-zone" id="fingerZone">
          <div id="fingerCountdown" class="countdown" hidden></div>
        </div>
        <div class="controls" style="margin-top:14px">
          <button class="secondary" id="clearFingers" type="button">↻ เริ่มใหม่</button>
        </div>
      </div>`;
    state.fingers.clear();
    const zone = $("#fingerZone");

    const addFinger = (id,x,y) => {
      if (state.fingers.has(id)) return;
      const dot=document.createElement("div");
      dot.className="finger-dot";
      dot.dataset.id=id;
      dot.textContent="🔥";
      dot.style.left=`${x}px`; dot.style.top=`${y}px`;
      zone.appendChild(dot);
      state.fingers.set(id,{dot,x,y});
      $("#fingerCount").textContent=state.fingers.size;
    };
    const moveFinger = (id,x,y) => {
      const f=state.fingers.get(id); if(!f) return;
      f.x=x; f.y=y; f.dot.style.left=`${x}px`; f.dot.style.top=`${y}px`;
    };
    const removeFinger = id => {
      const f=state.fingers.get(id); if(!f) return;
      f.dot.remove(); state.fingers.delete(id); $("#fingerCount").textContent=state.fingers.size;
    };

    zone.addEventListener("pointerdown", e=>{
      if(state.fingers.size>=20 || state.counting) return;
      zone.setPointerCapture(e.pointerId);
      const r=zone.getBoundingClientRect();
      addFinger(e.pointerId,e.clientX-r.left,e.clientY-r.top);
      beep(520,.04);
      if(state.fingers.size>=2) scheduleFingerPick();
    });
    zone.addEventListener("pointermove", e=>{
      const r=zone.getBoundingClientRect();
      moveFinger(e.pointerId,e.clientX-r.left,e.clientY-r.top);
    });
    ["pointerup","pointercancel","pointerleave"].forEach(type=>zone.addEventListener(type,e=>{
      if(type==="pointerleave" && e.buttons) return;
      removeFinger(e.pointerId);
    }));

    $("#clearFingers").addEventListener("click",()=>{
      state.counting=false; state.fingers.clear(); $$(".finger-dot",zone).forEach(x=>x.remove());
      $("#fingerCountdown").hidden=true; $("#fingerCount").textContent="0";
    });
  }

  function scheduleFingerPick() {
    if(state.counting) return;
    state.counting=true;
    const countdown=$("#fingerCountdown");
    countdown.hidden=false;
    let n=3; countdown.textContent=n; beep(420,.07);
    const timer=setInterval(()=>{
      if(state.fingers.size<2){clearInterval(timer);state.counting=false;countdown.hidden=true;return;}
      n--; countdown.textContent=n;
      beep(420+n*80,.07);
      if(n<=0){
        clearInterval(timer);
        countdown.hidden=true;
        const ids=[...state.fingers.keys()];
        if(ids.length){
          const winner=ids[Math.floor(Math.random()*ids.length)];
          state.fingers.forEach((f,id)=>f.dot.classList.toggle("selected",id===winner));
          beep(980,.18);
          toast("🔥 นิ้วที่ถูกเลือกยังติดไฟ!");
        }
        state.counting=false;
      }
    },1000);
  }

  function setupSpecialDeck(type) {
    const source = type==="dora" ? doraCommands : type==="king" ? kingCommands : commandCards;
    const key = type==="dora" ? "doraDeck" : type==="king" ? "kingDeck" : "commandDeck";
    if(!state[key].length) state[key]=shuffle(source);
    return {source,key};
  }

  function renderSpecialDeck(type) {
    const cfg={dora:{title:"ไพ่โดเรม่อน",emoji:"🃏",desc:"สุ่มการ์ดคำสั่ง 1 ใบแล้วทำตาม",label:"จั่วการ์ด"},king:{title:"King Game",emoji:"👑",desc:"จั่วไพ่และทำตามกติกา",label:"จั่วไพ่"},command:{title:"ไพ่คำสั่ง",emoji:"🔥",desc:"จั่วแล้วทำตามคำสั่ง",label:"จั่วคำสั่ง"}}[type];
    $("#gameContent").innerHTML=`
      <div class="game-panel">
        <div class="status">${cfg.desc}</div>
        <div id="specialCard" class="command-card">
          <div><div class="command-emoji">${cfg.emoji}</div><div class="command-text" style="font-size:30px">พร้อมหรือยัง?</div><div class="command-sub">กดจั่วเพื่อสุ่มการ์ด</div></div>
        </div>
        <div class="controls" style="margin-top:14px">
          <button class="primary" id="drawSpecial" type="button">${cfg.label}</button>
          <button class="secondary" id="resetSpecial" type="button">🔄 สับไพ่ใหม่</button>
        </div>
      </div>`;
    setupSpecialDeck(type);
    $("#drawSpecial").addEventListener("click",()=>{
      const {key}=setupSpecialDeck(type);
      if(!state[key].length) setupSpecialDeck(type);
      const [emoji,text]=state[key].pop();
      $("#specialCard").innerHTML=`<div><div class="command-emoji">${emoji}</div><div class="command-text">${text}</div><div class="command-sub">เหลือ ${state[key].length} ใบ</div></div>`;
      beep(700,.1);
    });
    $("#resetSpecial").addEventListener("click",()=>{
      const {source,key}=setupSpecialDeck(type); state[key]=shuffle(source);
      $("#specialCard").innerHTML=`<div><div class="command-emoji">${cfg.emoji}</div><div class="command-text" style="font-size:30px">สับไพ่ใหม่แล้ว</div><div class="command-sub">พร้อมจั่วอีกครั้ง</div></div>`;
      toast("สับไพ่ใหม่แล้ว");
    });
  }
  function renderDoraemon(){renderSpecialDeck("dora");}
  function renderKing(){renderSpecialDeck("king");}
  function renderCommand(){renderSpecialDeck("command");}

  function renderRace() {
    state.raceAnimals=[];
    $("#gameContent").innerHTML=`
      <div class="game-panel">
        <div class="race-setup" id="raceSetup">
          <div class="status">เลือกสัตว์ 2–10 ตัว • ระบบจะสุ่มระยะและสนามให้ทุกครั้ง</div>
          <div class="animal-grid" id="animalGrid"></div>
          <div class="status"><strong id="selectedAnimalCount">0</strong> / 10 ตัว</div>
          <div class="controls"><button class="primary" id="startRace" type="button" disabled>🏁 เริ่มแข่ง</button></div>
        </div>
        <div id="raceArea" hidden></div>
      </div>`;
    const grid=$("#animalGrid");
    animals.forEach((a,i)=>{
      const b=document.createElement("button");
      b.type="button"; b.className="animal"; b.dataset.i=i;
      b.innerHTML=`<span class="emoji">${a[0]}</span><strong>${a[1]}</strong><br><small>เลือก</small>`;
      b.addEventListener("click",()=>{
        if(b.classList.contains("selected")){
          b.classList.remove("selected");
          state.raceAnimals=state.raceAnimals.filter(x=>x!==i);
        } else if(state.raceAnimals.length<10){
          b.classList.add("selected");
          state.raceAnimals.push(i);
        }
        $("#selectedAnimalCount").textContent=state.raceAnimals.length;
        $("#startRace").disabled=state.raceAnimals.length<2;
      });
      grid.appendChild(b);
    });
    $("#startRace").addEventListener("click",startRace);
  }

  function startRace() {
    if(state.raceBusy || state.raceAnimals.length<2) return;
    state.raceBusy=true;
    const distance=[5,10,15][Math.floor(Math.random()*3)];
    const map=maps[Math.floor(Math.random()*maps.length)];
    const racers=shuffle(state.raceAnimals).map(i=>({i,animal:animals[i][0],name:animals[i][1]}));
    $("#raceSetup").hidden=true;
    const area=$("#raceArea"); area.hidden=false;
    area.innerHTML=`
      <div class="race-stage" id="raceStage">
        <div class="race-info"><span>🏁 ${distance}M</span><span>${map[0]} ${map[1]}</span></div>
        <div class="track" id="track"></div>
        <div class="race-message" id="raceMessage">เตรียมตัว...</div>
        <div id="podium"></div>
      </div>
      <div class="controls" style="margin-top:14px">
        <button class="primary" id="raceAgain" type="button">🏁 แข่งอีกครั้ง</button>
        <button class="secondary" id="raceBackSetup" type="button">← เปลี่ยนสัตว์</button>
      </div>`;
    const track=$("#track");
    racers.forEach((r,idx)=>{
      const lane=document.createElement("div"); lane.className="lane";
      lane.innerHTML=`<span style="position:absolute;left:8px;top:4px;font-size:11px;color:#333;font-weight:800">${r.name}</span><span class="runner" id="runner-${idx}">${r.animal}</span><span class="finish"></span>`;
      track.appendChild(lane);
    });
    $("#raceAgain").addEventListener("click",()=>{state.raceBusy=false;startRace();});
    $("#raceBackSetup").addEventListener("click",()=>{state.raceBusy=false;renderRace();});
    runRace(racers,distance);
  }

  function runRace(racers,distance) {
    const message=$("#raceMessage");
    let n=3; message.textContent=n;
    const countdown=setInterval(()=>{
      n--; message.textContent=n>0?n:"GO!";
      beep(420+n*90,.07);
      if(n<=0){
        clearInterval(countdown);
        animateRacers(racers,distance);
      }
    },800);
  }

  function animateRacers(racers,distance) {
    const durationBase=4200 + distance*80;
    const results=[];
    const started=performance.now();
    racers.forEach((r,idx)=>{
      const runner=$("#runner-"+idx);
      const jitter=(Math.random()*0.32)-0.16;
      const duration=durationBase*(1+jitter);
      let wobble=Math.random();
      const start=performance.now();
      function frame(now){
        const p=Math.min(1,(now-start)/duration);
        const eased=p < .5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
        const extra=Math.sin(p*16+wobble*8)*1.7 + Math.sin(p*39)*.7;
        runner.style.left=`${2 + eased*93 + extra}%`;
        if(p<1){requestAnimationFrame(frame);}
        else {
          results.push(r);
          if(results.length===racers.length) finishRace(results);
        }
      }
      requestAnimationFrame(frame);
    });
  }

  function finishRace(results) {
    const message=$("#raceMessage");
    message.textContent=`🏆 ${results[0].name} ชนะ!`;
    const podium=$("#podium");
    const top=results.slice(0,3);
    podium.innerHTML=`<div class="podium">${top.map((r,i)=>`
      <div class="podium-item ${i===0?"first":""}">
        <div>${["🥇","🥈","🥉"][i]}</div>
        <div class="pemoji">${r.animal}</div>
        <strong>${r.name}</strong>
      </div>`).join("")}</div>`;
    beep(980,.18);
  }

  $$(".game-card").forEach(card=>card.addEventListener("click",()=>openGame(card.dataset.game)));
  $("#backBtn").addEventListener("click",goHome);
  $("#homeBtn").addEventListener("click",goHome);
  $("#soundBtn").addEventListener("click",()=>{
    state.sound=!state.sound;
    $("#soundBtn").textContent=state.sound?"🔊":"🔇";
    toast(state.sound?"เปิดเสียง":"ปิดเสียง");
  });
})();
