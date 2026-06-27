// =============================================================
// main.js
// Equivalente a: GameViewController.swift
//
// Orquestra todos os sistemas:
//   - Canvas + bounds
//   - Acelerômetro
//   - Loop de física (Physics.js)
//   - Magnetos (MagnetSystem.js)
//   - Buraco Negro (BlackHole.js)
//   - Itens (ItemFactory.js)
//   - HUD (HUD.js)
//   - Overlays (OverlayManager.js)
//   - Vídeo de intro (IntroSystem.js)
// =============================================================

'use strict';

// ─── Canvas ───────────────────────────────────────────────
const _canvas = document.getElementById('gameCanvas');
const _ctx    = _canvas.getContext('2d');
let   _bounds = { w: 0, h: 0, marginX: 0, marginY: 0 };

function _redimensionar() {
  _canvas.width  = window.innerWidth;
  _canvas.height = window.innerHeight;
  // Labirinto ocupa toda a área (sem margem), igual ao labirintoView do Swift
  _bounds = {
    w:       _canvas.width,
    h:       _canvas.height,
    marginX: 0,
    marginY: 0,
  };
  // Reposiciona jogador ao centro superior se ainda não iniciou
  if (!gameState.jogoAtivo) {
    player.x = _bounds.w / 2;
    player.y = _bounds.h / 4;
  }
}
window.addEventListener('resize', () => { _redimensionar(); _reinicializarFase(); });
_redimensionar();

// ─── Background por fase ──────────────────────────────────
const _bgImgs = {};
function _bgDaFase(fase) {
  const name = `bg_fase${fase}`;
  if (!_bgImgs[name]) {
    const img = new Image();
    img.src   = `assets/${name}.png`;
    _bgImgs[name] = img;
  }
  return _bgImgs[name];
}

// ─── Inicializar fase ─────────────────────────────────────
function mainIniciarFase(numeroFase) {
  // Garante que numero de fase está no range
  gameState.faseAtual = Math.max(1, Math.min(numeroFase, NUMERO_MAXIMO_FASES));

  const config = obterConfigFase(gameState.faseAtual);

  // Reseta todos os sistemas
  physicsReset();
  physicsLimparObstaculos();
  magnetReset();
  blackHoleReset();
  itemsReset();
  overlayLimparTodos();

  // Reinicializa o jogador ao centro
  player.x  = _bounds.w / 2;
  player.y  = _bounds.h / 4;
  player.vx = player.vy = 0;

  // Inicializa sistemas com config da fase
  itemFactoryInit(_bounds);
  magnetCriar(config, _bounds);
  blackHoleCriar(config, _bounds, player.r);
  itemsPopularFase(config, _bounds);

  // Estado do jogo
  gameState.jogoAtivo      = true;
  gameState.jogoPausado    = false;
  gameState.tempoRestante  = modoUsaTempo(gameState.modo)
    ? config.tempoLimite * gameState.dificuldade.multiplicadorTempo
    : Infinity;
  gameState.tempoDecorrido = 0;

  // HUD
  hudMostrar();
  hudBotaoSairAtivo(true);
  hudAtualizar();

  // Inicia acelerômetro (só precisa pedir permissão uma vez)
  iniciarAcelerometro();

  // Inicia loop de física se ainda não estava rodando
  physicsStop();
  physicsInit(_canvas, _bounds, _onFrame);
  physicsStart();
}

function _reinicializarFase() {
  if (!gameState.jogoAtivo) return;
  magnetReset();
  blackHoleReset();
  physicsLimparObstaculos();
  const config = obterConfigFase(gameState.faseAtual);
  itemFactoryInit(_bounds);
  magnetCriar(config, _bounds);
  blackHoleCriar(config, _bounds, player.r);
}

// ─── Efeito de coleta de item ─────────────────────────────
// Equivale a ItemEffectHandler.handleCollection() do Swift
function _efetivarColeta(item) {
  item.visible = false;

  switch (item.tipo) {
    // ── Laranjas normais (objetivo principal) ──────────────
    case ITEM_TYPE.LARANJA_NORMAL:
    case ITEM_TYPE.LARANJA_IMPOSTOR: {
      // Laranjas restantes → vitória quando zerar
      const restantes = laranjasPendentes();
      if (restantes === 0) _verificarCondicaoVitoria();
      break;
    }

    // ── Laranja falsa → spawna azuis extras ───────────────
    case ITEM_TYPE.LARANJA_FALSA: {
      const qtd = item.meta.azuisGerados ?? 4;
      for (let i = 0; i < qtd; i++) {
        const r = player.r;
        const p = _posAleatoria(r);
        const novo = criarItem(ITEM_TYPE.AZUL_NORMAL, p.x, p.y, r);
        items.azuis.push(novo);
      }
      if (laranjasPendentes() === 0) _verificarCondicaoVitoria();
      break;
    }

    // ── Azuis (penalidade de tempo / spawna mais) ──────────
    case ITEM_TYPE.AZUL_NORMAL:
    case ITEM_TYPE.AZUL_ESPECIAL:
    case ITEM_TYPE.AZUL_FASE17:
      _aplicarPenalidade(5);
      break;

    case ITEM_TYPE.AZUL_GERA4: {
      _aplicarPenalidade(5);
      _spawnAzuis(4);
      break;
    }
    case ITEM_TYPE.AZUL_GERA8: {
      _aplicarPenalidade(5);
      _spawnAzuis(8);
      break;
    }

    // ── Bônus de tempo ─────────────────────────────────────
    case ITEM_TYPE.GANHA_TEMPO: {
      const seg = item.meta.segundos ?? 5;
      if (modoUsaTempo(gameState.modo)) gameState.tempoRestante += seg;
      else gameState.tempoDecorrido = Math.max(0, gameState.tempoDecorrido - seg);
      break;
    }

    // ── Perde tempo ────────────────────────────────────────
    case ITEM_TYPE.PERDE_TEMPO: {
      const seg = item.meta.segundos ?? 5;
      if (modoUsaTempo(gameState.modo)) {
        gameState.tempoRestante = Math.max(0, gameState.tempoRestante - seg);
      }
      break;
    }
  }
}

function _spawnAzuis(qtd) {
  for (let i = 0; i < qtd; i++) {
    const r = player.r;
    const p = _posAleatoria(r);
    items.azuis.push(criarItem(ITEM_TYPE.AZUL_NORMAL, p.x, p.y, r));
  }
}

function _posAleatoria(r) {
  return {
    x: _bounds.marginX + r + Math.random() * (_bounds.w - r * 2),
    y: _bounds.marginY + r + Math.random() * (_bounds.h - r * 2),
  };
}

function _aplicarPenalidade(seg) {
  if (modoUsaTempo(gameState.modo)) {
    gameState.tempoRestante = Math.max(0, gameState.tempoRestante - seg);
  }
}

// ─── Condição de vitória ──────────────────────────────────
function _verificarCondicaoVitoria() {
  if (!gameState.jogoAtivo) return;
  if (laranjasPendentes() > 0)  return;

  gameState.jogoAtivo = false;
  hudBotaoSairAtivo(false);

  const ultimaFase  = gameState.faseAtual >= NUMERO_MAXIMO_FASES;
  const videoSrc    = ultimaFase
    ? `assets/video_vitoria_final.mp4`
    : `assets/video_vitoria_fase${gameState.faseAtual}.mp4`;

  // Tenta tocar vídeo de transição; se não existir, vai direto ao overlay
  introPlayVideo(videoSrc, () => {
    overlayMostrarVitoria({
      titulo:    ultimaFase ? '🎉 Parabéns!' : '✅ Fase concluída!',
      mensagem:  ultimaFase
        ? 'Você completou todas as fases!'
        : `Fase ${gameState.faseAtual} completada em ${Math.floor(gameState.tempoDecorrido)}s`,
      ultimaFase,
      onRepetir:       () => mainIniciarFase(gameState.faseAtual),
      onAvancar:       () => mainIniciarFase(gameState.faseAtual + 1),
      onSelecionarFase: (f) => mainIniciarFase(f),
      onFinalizar:     () => overlayMostrarInicio(() => mainIniciarFase(1)),
      onVoltarInicio:  () => overlayMostrarInicio(() => mainIniciarFase(1)),
    });
  });
}

// ─── Fim de tempo ─────────────────────────────────────────
function _verificarFimTempo() {
  if (!gameState.jogoAtivo) return;
  if (!modoUsaTempo(gameState.modo)) return;
  if (gameState.tempoRestante > 0) return;

  gameState.jogoAtivo = false;
  hudBotaoSairAtivo(false);

  overlayMostrarFimTempo({
    onTentarNovamente: () => mainIniciarFase(gameState.faseAtual),
    onSelecionarFase:  (f) => mainIniciarFase(f),
    onVoltarInicio:    () => overlayMostrarInicio(() => mainIniciarFase(1)),
  });
}

// ─── Loop principal (frame) ───────────────────────────────
function _onFrame(dt) {
  if (!gameState.jogoAtivo || gameState.jogoPausado) {
    _render();
    return;
  }

  // Tempo
  if (modoUsaTempo(gameState.modo)) {
    gameState.tempoRestante  = Math.max(0, gameState.tempoRestante - dt);
    gameState.tempoDecorrido += dt;
    _verificarFimTempo();
  } else {
    gameState.tempoDecorrido += dt;
  }

  // Magneto aplica repulsão na física a cada frame (já feito em Physics._step)
  // Buraco negro idem
  // Colisão itens
  _checarColisoes();

  // HUD
  hudAtualizar();

  _render();
}

// ─── Colisão jogador × itens ──────────────────────────────
// Equivale a CollisionSystem.detectItemCollisions() do Swift
function _checarColisoes() {
  const todosItens = [
    ...items.laranjas,
    ...items.falsas,
    ...items.azuis,
    ...items.azuisFase17,
    ...items.ganhaTempo,
    ...items.perdeTempo,
  ];

  for (const item of todosItens) {
    if (itemColideComJogador(item)) {
      _efetivarColeta(item);
    }
  }
}

// ─── Render ───────────────────────────────────────────────
function _render() {
  const ctx = _ctx;
  ctx.clearRect(0, 0, _canvas.width, _canvas.height);

  // Background da fase
  const bg = _bgDaFase(gameState.faseAtual);
  if (bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, _canvas.width, _canvas.height);
  } else {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, _canvas.width, _canvas.height);
  }

  // Magnetos
  magnetDraw(ctx);

  // Buraco negro
  blackHoleDraw(ctx);

  // Itens
  itemsDrawAll(ctx);

  // Jogador
  playerDraw(ctx);
}

// ─── Boot ─────────────────────────────────────────────────
(function boot() {
  hudInit();
  hudOcultar();

  // Mostra tela inicial de seleção de modo
  overlayMostrarInicio(() => {
    mainIniciarFase(gameState.faseAtual);
  });
}());
