(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const SAVE_KEY = "desktopExeAnalogHorror_v1";
  const state = {
    booted:false, windows:new Map(), z:10, clues:[], flags:{}, ending:null,
    note:"", soundOn:false, startTime:Date.now(), jumpscareSeen:false
  };
  const titles = {
    readme:"LEIA-ME.txt", files:"Meus arquivos", notepad:"Bloco de notas",
    terminal:"Terminal — SYS98", player:"Media Player", paint:"Paint.exe", recycle:"Lixeira",
    about:"Propriedades do sistema", log:"LOG_03.TXT", image:"imagem_corrompida.bmp"
  };
  const initialFiles = [
    {id:"log",icon:"📄",name:"LOG_03.TXT",meta:"Arquivo de texto · 1 KB"},
    {id:"image",icon:"🖼️",name:"imagem_corrompida.bmp",meta:"Imagem · 84 KB"},
    {id:"readme",icon:"📄",name:"LEIA-ME.txt",meta:"Documento · 2 KB"},
    {id:"memo",icon:"🗒️",name:"recado_pessoal.txt",meta:"Documento · 1 KB",locked:true}
  ];

  function loadSave(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(!raw) return;
      const saved=JSON.parse(raw);
      state.clues=Array.isArray(saved.clues)?saved.clues:[];
      state.flags=saved.flags||{};
      state.ending=saved.ending||null;
      state.note=typeof saved.note==="string"?saved.note:"";
      state.soundOn=!!saved.soundOn;
      state.jumpscareSeen=!!saved.jumpscareSeen;
    }catch(e){ console.warn("Não foi possível carregar o salvamento local.",e); }
  }
  function save(){
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify({
        clues:state.clues,flags:state.flags,ending:state.ending,note:state.note,
        soundOn:state.soundOn,jumpscareSeen:state.jumpscareSeen
      }));
    }catch(e){toast("Não foi possível salvar. O armazenamento do navegador pode estar bloqueado.");}
  }
  function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function toast(message){
    const el=$("#toast");el.textContent=message;el.classList.remove("hidden");
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add("hidden"),2800);
  }
  function glitch(){const el=$("#glitch-overlay");el.classList.remove("active");void el.offsetWidth;el.classList.add("active");}
  function jumpScare(){
    if(state.jumpscareSeen) {glitch();toast("SINAL PERDIDO");return;}
    state.jumpscareSeen=true;save();
    const el=$("#jump-overlay");el.classList.remove("hidden");
    if(state.soundOn) playTone(120,0.18);
    setTimeout(()=>el.classList.add("hidden"),850);
  }
  let audioContext=null;
  function playTone(freq=180,duration=.1){
    if(!state.soundOn) return;
    try{
      audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
      const osc=audioContext.createOscillator(),gain=audioContext.createGain();
      osc.type="square";osc.frequency.value=freq;gain.gain.value=.045;
      osc.connect(gain);gain.connect(audioContext.destination);osc.start();
      gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
      osc.stop(audioContext.currentTime+duration);
    }catch(e){/* áudio é opcional */}
  }
  function addClue(id,text){
    if(state.clues.includes(id)) return;
    state.clues.push(id);save();toast("Pista registrada: "+text);playTone(660,.08);
    if(state.clues.length===2 && !state.flags.firstGlitch){state.flags.firstGlitch=true;save();setTimeout(glitch,450);}
    if(state.clues.length>=3) state.flags.memoUnlocked=true;
    save();
  }
  function openWindow(id){
    if(state.ending && id!=="readme" && id!=="files" && id!=="about"){toast("O sistema já foi encerrado. Reinicie a investigação para jogar novamente.");return;}
    if(state.windows.has(id)){
      const w=state.windows.get(id);w.el.classList.remove("minimized");w.el.style.zIndex=++state.z;w.minimized=false;refreshTaskbar();return;
    }
    const layer=$("#window-layer"),el=document.createElement("section");
    el.className="window";el.dataset.id=id;el.style.zIndex=++state.z;
    el.setAttribute("role","dialog");el.setAttribute("aria-label",titles[id]||id);
    el.innerHTML=`<div class="titlebar"><span class="titlebar-title">${escapeHTML(titles[id]||id)}</span><div class="window-controls"><button data-action="min" aria-label="Minimizar">_</button><button data-action="max" aria-label="Maximizar">□</button><button data-action="close" aria-label="Fechar">×</button></div></div><div class="window-content">${contentFor(id)}</div>`;
    layer.appendChild(el);
    const obj={el,id,minimized:false,maximized:false,previous:null};state.windows.set(id,obj);
    el.addEventListener("pointerdown",()=>{el.style.zIndex=++state.z;refreshTaskbar();});
    el.addEventListener("click",e=>{
      const b=e.target.closest("[data-action]");if(!b)return;
      if(b.dataset.action==="close"){el.remove();state.windows.delete(id);refreshTaskbar();}
      if(b.dataset.action==="min"){obj.minimized=true;el.classList.add("minimized");refreshTaskbar();}
      if(b.dataset.action==="max"){
        if(!obj.maximized){obj.previous={left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height};obj.maximized=true;el.classList.add("maximized");}
        else{obj.maximized=false;el.classList.remove("maximized");if(obj.previous){Object.assign(el.style,obj.previous);}}
      }
    });
    makeDraggable(el,obj);
    wireApp(id,el);
    refreshTaskbar();
    if(id==="log") addClue("log","registro de inicialização");
    if(id==="image") addClue("image","imagem corrompida");
    if(id==="readme") state.flags.readmeSeen=true;
    save();
  }
  function contentFor(id){
    if(id==="readme") return `<h2>Bem-vindo ao sistema legado</h2><p>Este computador foi recuperado de um lote de equipamentos desativados. O perfil do usuário anterior foi removido durante a restauração.</p><div class="dialog"><b>NOTA DO TÉCNICO</b><p>Se você encontrar arquivos que não constam no inventário, não os execute. Registre o nome e encerre a sessão.</p></div><p class="small">Inventário: SYS-98-041 · Última manutenção: 14/10/2001</p><button data-action-app="about">Propriedades do sistema</button>`;
    if(id==="files") return `<h2>Meus arquivos</h2><p class="small">C:\\USERS\\DEFAULT\\DESKTOP</p><div class="file-list" id="file-list"></div><p class="small">Dica: alguns arquivos aparecem depois que você encontra pistas.</p>`;
    if(id==="notepad") return `<h2>Bloco de notas</h2><p class="small">RECADO_PESSOAL.TXT — salvamento local</p><textarea id="note-text" aria-label="Texto da nota" placeholder="Escreva aqui..."></textarea><div><button id="save-note">Salvar nota</button><button id="clear-note">Limpar</button></div><p id="note-status" class="small">As notas ficam salvas neste navegador.</p>`;
    if(id==="terminal") return `<div class="player-screen" style="text-align:left">SYS98 LEGACY TERMINAL<br>BUILD 4.1.98<br>Digite <b>help</b> para ver comandos.</div><pre id="terminal-output">Sistema pronto.\nAguardando comando...</pre><div class="terminal-input-row"><span>C:\\&gt;</span><input id="terminal-input" type="text" autocomplete="off" aria-label="Comando" placeholder="help"><button id="run-command">Executar</button></div><p class="small">Terminal fictício: não executa comandos reais do computador.</p>`;
    if(id==="paint") return `<h2>Paint.exe</h2><div class="paint-toolbar"><label>Cor <input id="paint-color" type="color" value="#111111" aria-label="Cor do pincel"></label><label>Tamanho <input id="paint-size" type="range" min="1" max="18" value="4" aria-label="Tamanho do pincel"></label><button id="paint-clear">Limpar</button><button id="paint-download">Baixar PNG</button></div><canvas id="paint-canvas" width="640" height="320" aria-label="Área de desenho"></canvas><p class="small">Desenhe com o mouse ou toque. Este desenho não sai do navegador até você baixar.</p>`;
    if(id==="player") return `<h2>Media Player 98</h2><div class="player-screen"><div id="track-name">TRACK 01 — AMBIENTE</div><div class="player-bars">${Array.from({length:18},()=>"<span></span>").join("")}</div><div id="track-time">00:00 / 00:18</div></div><p>Uma gravação de teste encontrada no cache.</p><button id="play-track">▶ Reproduzir gravação</button><button id="stop-track">■ Parar</button><p class="small">O áudio é sintetizado localmente e não usa arquivos externos.</p>`;
    if(id==="recycle") return `<h2>Lixeira</h2><p>1 item encontrado.</p><div class="file-row">🗒️ <button id="restore-memo">Restaurar recado_pessoal.txt</button></div><p class="small">O arquivo só pode ser restaurado após reunir três pistas.</p>`;
    if(id==="about") return `<h2>Propriedades do sistema</h2><div class="dialog"><p><b>DESKTOP.EXE</b></p><p>Sistema legado 98.4</p><p>Usuário atual: DEFAULT</p><p>Usuário anterior: <span class="danger-text">[REGISTRO AUSENTE]</span></p><p>Última atividade: <span id="last-activity">não disponível</span></p></div><button id="check-system">Verificar integridade</button>`;
    if(id==="log") return `<h2>LOG_03.TXT</h2><pre>14/10/2001 23:41:02  BOOT OK\n14/10/2001 23:41:05  USER: M. VALE\n14/10/2001 23:41:08  SESSION LOCKED\n14/10/2001 23:41:08  USER RECORD: NOT FOUND\n14/10/2001 23:41:09  PROCESS "HOME" STILL RUNNING\n14/10/2001 23:41:10  DO NOT REBUILD INDEX\n\n[linhas restantes corrompidas]</pre><button id="decode-log">Tentar recuperar linhas</button>`;
    if(id==="image") return `<h2>imagem_corrompida.bmp</h2><div class="dialog" style="text-align:center;background:#111;color:#aaffbb;font-family:monospace;padding:28px 8px"><div style="font-size:45px;letter-spacing:7px">M . V</div><p>FRAME 0007 / DATA INVALIDA</p><p id="image-caption">O arquivo não pôde ser renderizado.</p></div><button id="inspect-image">Inspecionar metadados</button>`;
    if(id==="memo") return `<h2>recado_pessoal.txt</h2><pre>Se você está lendo isso, o índice foi reconstruído.\nNão procure meu nome na lista de usuários.\nO sistema apaga tudo que consegue lembrar.\n\n— M.</pre><button id="finish-investigation">Responder ao recado</button>`;
    return `<p>Aplicativo indisponível.</p>`;
  }
  function wireApp(id,el){
    const q=s=>$(s,el);
    if(id==="files") renderFiles(el);
    if(id==="notepad"){
      const area=q("#note-text");area.value=state.note;
      q("#save-note").addEventListener("click",()=>{state.note=area.value;save();q("#note-status").textContent="Salvo às "+new Date().toLocaleTimeString("pt-BR");toast("Nota salva.");});
      q("#clear-note").addEventListener("click",()=>{area.value="";state.note="";save();q("#note-status").textContent="Nota limpa.";});
    }
    if(id==="terminal"){
      const input=q("#terminal-input"),out=q("#terminal-output");
      const run=()=>{const cmd=input.value.trim().toLowerCase();if(!cmd)return;input.value="";const result=terminalCommand(cmd);out.textContent+=`\n\nC:\\> ${cmd}\n${result}`;out.scrollTop=out.scrollHeight;};
      q("#run-command").addEventListener("click",run);input.addEventListener("keydown",e=>{if(e.key==="Enter")run();});
    }
    if(id==="paint"){
      const canvas=q("#paint-canvas"),ctx=canvas.getContext("2d");let drawing=false;
      ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.lineCap="round";ctx.lineJoin="round";
      const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};};
      canvas.addEventListener("pointerdown",e=>{drawing=true;canvas.setPointerCapture(e.pointerId);const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+0.1,p.y+0.1);ctx.strokeStyle=q("#paint-color").value;ctx.lineWidth=Number(q("#paint-size").value);ctx.stroke();});
      canvas.addEventListener("pointermove",e=>{if(!drawing)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.strokeStyle=q("#paint-color").value;ctx.lineWidth=Number(q("#paint-size").value);ctx.stroke();});
      const stop=()=>{drawing=false;};canvas.addEventListener("pointerup",stop);canvas.addEventListener("pointercancel",stop);
      q("#paint-clear").addEventListener("click",()=>{ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);});
      q("#paint-download").addEventListener("click",()=>{const a=document.createElement("a");a.download="meu-desenho.png";a.href=canvas.toDataURL("image/png");a.click();});
    }
    if(id==="player"){
      let timer=null,seconds=0;
      q("#play-track").addEventListener("click",()=>{
        if(timer)return;state.flags.audioPlayed=true;save();addClue("audio","gravação no Media Player");
        q("#track-name").textContent="TRACK 02 — NÃO É RUÍDO";
        q("#track-time").textContent="SINAL DETECTADO";glitch();
        let n=0;timer=setInterval(()=>{n++;q("#track-time").textContent=`00:${String(n).padStart(2,"0")} / 00:18`;playTone(n%2?220:196,.04);if(n>=18){clearInterval(timer);timer=null;q("#track-time").textContent="FIM DA GRAVAÇÃO";toast("Fim da fita. Verifique seus arquivos.");}},1000);
      });
      q("#stop-track").addEventListener("click",()=>{if(timer)clearInterval(timer);timer=null;q("#track-time").textContent="PARADO";});
    }
    if(id==="recycle") q("#restore-memo").addEventListener("click",()=>{
      if(!state.flags.memoUnlocked){toast("Arquivo danificado. Reúna três pistas para restaurá-lo.");return;}
      state.flags.memoRestored=true;save();toast("Arquivo restaurado.");openWindow("memo");
    });
    if(id==="about") q("#check-system").addEventListener("click",()=>{
      q("#last-activity").textContent="23:41:10 — sessão encerrada sem logout";
      glitch();toast("AVISO: um processo continua ativo.");addClue("system","propriedades do sistema");
    });
    if(id==="log") q("#decode-log").addEventListener("click",()=>{
      q("pre").textContent += "\n23:41:11  INDEX REBUILD REQUESTED\n23:41:12  REQUEST ORIGIN: LOCAL\n23:41:12  REQUEST OWNER: M. VALE\n23:41:13  OWNER STATUS: PRESENT";
      addClue("owner","registro recuperado");glitch();
    });
    if(id==="image") q("#inspect-image").addEventListener("click",()=>{
      q("#image-caption").textContent="METADADOS: captura_0007 / usuário: M. Vale / local: C:\\HOME\\";
      addClue("imageMeta","metadados da imagem");toast("Metadados recuperados.");
    });
    if(id==="memo") q("#finish-investigation").addEventListener("click",()=>showChoice());
    if(id==="readme") q('[data-action-app="about"]').addEventListener("click",()=>openWindow("about"));
  }
  function renderFiles(el){
    const list=$("#file-list",el);list.innerHTML="";
    initialFiles.forEach(file=>{
      if(file.locked&&!state.flags.memoUnlocked)return;
      const b=document.createElement("button");b.className="file-row";
      b.innerHTML=`<span>${file.icon}</span><span class="file-name">${escapeHTML(file.name)}</span><span class="file-meta">${escapeHTML(file.meta)}</span>`;
      b.addEventListener("click",()=>openWindow(file.id==="memo"?"recycle":file.id));list.appendChild(b);
    });
    if(state.clues.length>=2){
      const b=document.createElement("button");b.className="file-row";b.innerHTML="<span>📄</span><span class='file-name'>cache_fragment.tmp</span><span class='file-meta'>Arquivo recuperado</span>";
      b.addEventListener("click",()=>{openWindow("log");toast("O arquivo parece ser uma cópia do registro de sessão.");});list.appendChild(b);
    }
  }
  function terminalCommand(cmd){
    const parts=cmd.split(/\s+/),base=parts[0];
    if(base==="help")return "COMANDOS DISPONÍVEIS:\nhelp — lista comandos\nabout — informações do sistema\ndate — data atual\nls — lista arquivos\nopen [app] — abre aplicativo\nscan — verifica integridade\nwhoami — usuário atual\nclear — limpa a tela";
    if(base==="about")return "DESKTOP.EXE / SYS98 LEGACY\nBuild 4.1.98\nEste sistema foi restaurado de uma imagem incompleta.";
    if(base==="date")return new Date().toLocaleString("pt-BR");
    if(base==="ls")return "LEIA-ME.txt\nLOG_03.TXT\nimagem_corrompida.bmp\nrecado_pessoal.txt [DELETADO]";
    if(base==="whoami")return "DEFAULT\nprevious_user = M. VALE [NOT FOUND]";
    if(base==="scan"){addClue("scan","verificação do terminal");glitch();return "Verificando índice... ERRO 0x0041\nRegistro do usuário anterior encontrado em cache.\nDica: abra LOG_03.TXT e recupere as linhas."; }
    if(base==="open"){
      const app=parts[1];
      const map={readme:"readme",files:"files",notepad:"notepad",terminal:"terminal",player:"player",paint:"paint",log:"log",about:"about"};
      if(map[app]){setTimeout(()=>openWindow(map[app]),10);return `Abrindo ${app}...`;}
      return "Aplicativo não encontrado. Use: open files | open log | open player";
    }
    if(base==="clear"){const term=$("#terminal-output");if(term)term.textContent="";return "Tela limpa.";}
    if(cmd==="home"||cmd==="rebuild index"){glitch();addClue("home","comando HOME");return "ACESSO NEGADO.\nO processo HOME não pode ser encerrado.\nUSUÁRIO: PRESENTE";}
    if(cmd==="forget"){glitch();return "ERRO: função de esquecimento não disponível.\nA memória do sistema não é um arquivo.";}
    if(cmd==="restore user"){if(state.clues.length>=3){state.flags.restoreAttempt=true;save();return "PONTO DE RESTAURAÇÃO ENCONTRADO.\nAbra a Lixeira e restaure recado_pessoal.txt.";}return "PONTO DE RESTAURAÇÃO INCOMPLETO.\nReúna mais pistas.";}
    return "Comando desconhecido. Digite help.";
  }
  function makeDraggable(el,obj){
    const bar=$(".titlebar",el);let start=null;
    bar.addEventListener("pointerdown",e=>{
      if(e.target.closest("button")||obj.maximized)return;
      start={x:e.clientX,y:e.clientY,left:el.offsetLeft,top:el.offsetTop};
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener("pointermove",e=>{
      if(!start)return;
      const left=Math.max(0,Math.min(window.innerWidth-el.offsetWidth,start.left+e.clientX-start.x));
      const top=Math.max(0,Math.min(window.innerHeight-70,start.top+e.clientY-start.y));
      el.style.left=left+"px";el.style.top=top+"px";
    });
    bar.addEventListener("pointerup",()=>start=null);
    bar.addEventListener("pointercancel",()=>start=null);
  }
  function refreshTaskbar(){
    const box=$("#task-buttons");box.innerHTML="";
    for(const [id,obj] of state.windows){
      const b=document.createElement("button");b.className="task-button"+(!obj.minimized&&Number(obj.el.style.zIndex)===state.z?" active":"");
      b.textContent=titles[id]||id;b.title=titles[id]||id;
      b.addEventListener("click",()=>{if(obj.minimized){obj.minimized=false;obj.el.classList.remove("minimized");obj.el.style.zIndex=++state.z;}else{obj.minimized=true;obj.el.classList.add("minimized");}refreshTaskbar();});
      box.appendChild(b);
    }
  }
  function showChoice(){
    if(state.ending){showEnding();return;}
    const id="choice";if(state.windows.has(id)){openWindow(id);return;}
    const layer=$("#window-layer"),el=document.createElement("section");el.className="window";el.dataset.id=id;el.style.zIndex=++state.z;el.style.left="calc(50% - 220px)";el.style.top="calc(45% - 140px)";
    el.innerHTML=`<div class="titlebar"><span class="titlebar-title">DECISÃO FINAL — SYS98</span><div class="window-controls"><button data-action="close">×</button></div></div><div class="window-content"><h2>O sistema pergunta:</h2><p class="danger-text">“Se eu reconstruir o índice, ele vai lembrar de mim. Você vai permitir?”</p><p>O registro de M. Vale ainda aparece como PRESENTE, embora o perfil não exista.</p><button data-ending="restore">Reconstruir o índice</button><button data-ending="erase">Apagar o processo HOME</button><button data-ending="leave">Desligar sem responder</button></div>`;
    layer.appendChild(el);const obj={el,id,minimized:false,maximized:false};state.windows.set(id,obj);
    el.addEventListener("click",e=>{
      const a=e.target.closest("[data-ending]");if(a){state.ending=a.dataset.ending;state.flags.finished=true;save();el.remove();state.windows.delete(id);glitch();showEnding();return;}
      if(e.target.closest('[data-action="close"]')){el.remove();state.windows.delete(id);refreshTaskbar();}
    });
    makeDraggable(el,obj);refreshTaskbar();
  }
  function showEnding(){
    const ending=state.ending;if(!ending)return;
    const data={
      restore:["FINAL 01 — LEMBRANÇA RESTAURADA","O índice reconstrói o perfil de M. Vale. Por um instante, o desktop mostra uma nova conta: M.VALE — ONLINE. Então o computador volta à tela inicial. O arquivo LEIA-ME agora termina com uma frase que você não escreveu: “Obrigado por lembrar.”"],
      erase:["FINAL 02 — PROCESSO ENCERRADO","O processo HOME é encerrado. Os arquivos param de mudar, o relógio volta a funcionar e o sistema registra a limpeza como concluída. No último segundo, surge uma linha: “Usuário anterior: nunca existiu.”"],
      leave:["FINAL 03 — SESSÃO ABANDONADA","Você encerra a sessão sem responder. O desktop escurece, mas o sistema não desliga completamente. Ao retornar, o relógio marca 23:41. Um novo arquivo aparece: VOLTE.txt."]
    }[ending];
    const layer=$("#window-layer"),id="ending";
    if(state.windows.has(id))return;
    const el=document.createElement("section");el.className="window";el.style.zIndex=++state.z;el.style.left="calc(50% - 230px)";el.style.top="calc(45% - 150px)";
    el.innerHTML=`<div class="titlebar"><span class="titlebar-title">${data[0]}</span><div class="window-controls"><button data-action="close">×</button></div></div><div class="window-content"><h2>${data[0]}</h2><p>${data[1]}</p><div class="dialog">INVESTIGAÇÃO CONCLUÍDA<br>Pistas encontradas: ${state.clues.length}</div><button id="ending-restart">Jogar novamente</button></div>`;
    layer.appendChild(el);state.windows.set(id,{el,id,minimized:false,maximized:false});
    el.addEventListener("click",e=>{if(e.target.closest('[data-action="close"]')){el.remove();state.windows.delete(id);refreshTaskbar();}if(e.target.id==="ending-restart")restartGame();});
    refreshTaskbar();
  }
  function restartGame(){
    if(!confirm("Reiniciar a investigação? O progresso atual será apagado deste navegador."))return;
    localStorage.removeItem(SAVE_KEY);location.reload();
  }
  function boot(){
    const screen=$("#boot-screen");
    screen.classList.add("ready");
    const start=()=>{if(state.booted)return;state.booted=true;document.body.classList.add("booted");openWindow("readme");toast("Sistema iniciado. Explore os arquivos.");document.removeEventListener("keydown",bootKey);screen.removeEventListener("click",start);};
    const bootKey=e=>{if(e.key==="Enter"||e.key===" "){start();}};
    screen.addEventListener("click",start);document.addEventListener("keydown",bootKey);
    setTimeout(()=>{if(!state.booted)screen.querySelector(".boot-hint").textContent="Clique para continuar";},1200);
  }
  $("#start-button").addEventListener("click",()=>$("#start-menu").classList.toggle("hidden"));
  $("#start-menu").addEventListener("click",e=>{
    const app=e.target.closest("[data-open]");if(app){openWindow(app.dataset.open);$("#start-menu").classList.add("hidden");}
  });
  $$(".desktop-icon").forEach(icon=>{
    icon.addEventListener("dblclick",()=>openWindow(icon.dataset.open));
    icon.addEventListener("click",()=>{ $$(".desktop-icon").forEach(x=>x.classList.remove("selected"));icon.classList.add("selected");});
    icon.addEventListener("keydown",e=>{if(e.key==="Enter")openWindow(icon.dataset.open);});
  });
  $("#restart-game").addEventListener("click",restartGame);
  $("#shutdown").addEventListener("click",()=>{ $("#start-menu").classList.add("hidden");toast("Desligamento simulado. Recarregue a página para iniciar novamente.");document.body.classList.remove("booted");});
  function updateClock(){$("#clock").textContent=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}
  updateClock();setInterval(updateClock,1000);
  loadSave();boot();
  // Expose a tiny, safe debugging helper for the browser console.
  window.DesktopExe = {open:openWindow,save,progress:()=>({clues:[...state.clues],ending:state.ending})};
})(); 
