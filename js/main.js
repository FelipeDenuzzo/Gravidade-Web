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

// ─── Canvas ───────────────────────────────────────────────────
const _canvas = document.getElementById('gameCanvas');
const _ctx    = _canvas.getContext('2d');
let   _bounds = { w: 0, h: 0, marginX: 0, marginY: 0 };

function _redimensionar() {
  _canvas.width  = window.innerWidth;
  _canvas.height = window.innerHeight;
  _bounds = {
    w:       _canvas.width,
    h:       _canvas.height,
    marginX: 0,
    marginY: 0,
  };
  if (!gameState.jogoAtivo) {
    player.x = _bounds.w / 2;
    player.y = _bounds.h / 4;
  }
}
window.addEventListener('resize', () => { _redimensionar(); _reinicializarFase(); });
_redimensionar();

// ─── Background por fase ──────────────────────────────────────
// Tenta bg_faseN.png → fundo.jpg → cor sólida
const _bgImgs  = {};
const _bgFundo = new Image();
_bgFundo.src   = 'assets/fundo.jpg';

function _bgDaFase(fase) {
  const key = `bg_fase${fase}`;
  if (!_bgImgs[key]) {
    const img = new Image();
    img.src = `assets/${key}.png`;
    _bgImgs[key] = img;
  }
  return _bgImgs[key];
}

// ─── Vídeos de transição (nomes reais do repo Swift) ──────────
const VIDEO_VITORIA = 'assets/transivitoria.mp4';
const VIDEO_DERROTA = 'assets/transiderrota.mp4';

// ─── Inicializar fase ─────────────────────────────────────────
function mainIniciarFase(numeroFase) {
  gameState.faseAtual = Math.max(1, Math.min(numeroFase, NUMERO_MAXIMO_FASES));

  const config = obterConfigFase(gameState.faseAtual);

  physicsReset();
  physicsLimparObstaculos();
  magnetReset();
  blackHoleReset();
  itemsReset();
  overlayLimparTodos();
  introStop();

  player.x  = _bounds.w / 2;
  player.y  = _bounds.h / 4;
  player.vx = player.vy = 0;

  itemFactoryInit(_bounds);
  magnetCriar(config, _bounds);
  blackHoleCriar(config, _bounds, player.r);
  itemsPopularFase(config, _bounds);

  gameState.jogoAtivo      = true;
  gameState.jogoPausado    = false;
  gameState.tempoRestante  = modoUsaTempo(gameState.modo)
    ? config.tempoLimite * gameState.dificuldade.multiplicadorTempo
    : Infinity;
  gameState.tempoDecorrido = 0;

  hudMostrar();
  hudBotaoSairAtivo(true);
  hudAtualizar();

  iniciarAcelerometro();

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

// ─── Efeito de coleta de item ─────────────────────────────────
// Equivale a ItemEffectHandler.handleCollection() do Swift
function _efetivarColeta(item) {
  item.visible = false;

  switch (item.tipo) {

    case ITEM_TYPE.LARANJA_NORMAL:
    case ITEM_TYPE.LARANJA_IMPOSTOR:
      if (laranjasPendentes() === 0) _verificarCondicaoVitoria();
      break;

    case ITEM_TYPE.LARANJA_FALSA: {
      const qtd = item.meta.azuisGerados ?? 4;
      for (let i = 0; i < qtd; i++) {
        const p = _posAleatoria(player.r);
        items.azuis.push(criarItem(ITEM_TYPE.AZUL_NORMAL, p.x, p.y, player.r));
      }
      if (laranjasPendentes() === 0) _verificarCondicaoVitoria();
      break;
    }

    case ITEM_TYPE.AZUL_NORMAL:
    case ITEM_TYPE.AZUL_ESPECIAL:
    case ITEM_TYPE.AZUL_FASE17:
      _aplicarPenalidade(5);
      break;

    case ITEM_TYPE.AZUL_GERA4:
      _aplicarPenalidade(5); _spawnAzuis(4);
      break;

    case ITEM_TYPE.AZUL_GERA8:
      _aplicarPenalidade(5); _spawnAzuis(8);
      break;

    case ITEM_TYPE.GANHA_TEMPO: {
      const seg = item.meta.segundos ?? 5;
      if (modoUsaTempo(gameState.modo)) gameState.tempoRestante += seg;
      else gameState.tempoDecorrido = Math.max(0, gameState.tempoDecorrido - seg);
      break;
    }

    case ITEM_TYPE.PERDE_TEMPO: {
      const seg = item.meta.segundos ?? 5;
      if (modoUsaTempo(gameState.modo))
        gameState.tempoRestante = Math.max(0, gameState.tempoRestante - seg);
      break;
    }
  }
}

function _spawnAzuis(qtd) {
  for (let i = 0; i < qtd; i++) {
    const p = _posAleatoria(player.r);
    items.azuis.push(criarItem(ITEM_TYPE.AZUL_NORMAL, p.x, p.y, player.r));
  }
}

function _posAleatoria(r) {
  return {
    x: _bounds.marginX + r + Math.random() * (_bounds.w - r * 2),
    y: _bounds.marginY + r + Math.random() * (_bounds.h - r * 2),
  };
}

function _aplicarPenalidade(seg) {
  if (modoUsaTempo(gameState.modo))
    gameState.tempoRestante = Math.max(0, gameState.tempoRestante - seg);
}

// ─── Vitória ──────────────────────────────────────────────────
function _verificarCondicaoVitoria() {
  if (!gameState.jogoAtivo) return;
  if (laranjasPendentes() > 0) return;

  gameState.jogoAtivo = false;
  hudBotaoSairAtivo(false);

  const ultimaFase = gameState.faseAtual >= NUMERO_MAXIMO_FASES;

  introPlayVideo(VIDEO_VITORIA, () => {
    overlayMostrarVitoria({
      titulo:    ultimaFase ? '🎉 Parabéns!' : '✅ Fase concluída!',
      mensagem:  ultimaFase
        ? 'Você completou todas as fases!'
        : `Fase ${gameState.faseAtual} completada em ${Math.floor(gameState.tempoDecorrido)}s`,
      ultimaFase,
      onRepetir:        () => mainIniciarFase(gameState.faseAtual),
      onAvancar:        () => mainIniciarFase(gameState.faseAtual + 1),
      onSelecionarFase: (f) => mainIniciarFase(f),
      onFinalizar:      () => overlayMostrarInicio(() => mainIniciarFase(1)),
      onVoltarInicio:   () => overlayMostrarInicio(() => mainIniciarFase(1)),
    });
  });
}

// ─── Fim de tempo ─────────────────────────────────────────────
function _verificarFimTempo() {
  if (!gameState.jogoAtivo) return;
  if (!modoUsaTempo(gameState.modo)) return;
  if (gameState.tempoRestante > 0) return;

  gameState.jogoAtivo = false;
  hudBotaoSairAtivo(false);

  introPlayVideo(VIDEO_DERROTA, () => {
    overlayMostrarFimTempo({
      onTentarNovamente: () => mainIniciarFase(gameState.faseAtual),
      onSelecionarFase:  (f) => mainIniciarFase(f),
      onVoltarInicio:    () => overlayMostrarInicio(() => mainIniciarFase(1)),
    });
  });
}

// ─── Loop principal ───────────────────────────────────────────
function _onFrame(dt) {
  if (!gameState.jogoAtivo || gameState.jogoPausado) {
    _render(); return;
  }

  if (modoUsaTempo(gameState.modo)) {
    gameState.tempoRestante  = Math.max(0, gameState.tempoRestante - dt);
    gameState.tempoDecorrido += dt;
    _verificarFimTempo();
  } else {
    gameState.tempoDecorrido += dt;
  }

  _checarColisoes();
  hudAtualizar();
  _render();
}

// ─── Colisão jogador × itens ──────────────────────────────────
function _checarColisoes() {
  const todos = [
    ...items.laranjas, ...items.falsas,
    ...items.azuis,    ...items.azuisFase17,
    ...items.ganhaTempo, ...items.perdeTempo,
  ];
  for (const item of todos) {
    if (itemColideComJogador(item)) _efetivarColeta(item);
  }
}

// ─── Render ───────────────────────────────────────────────────
function _render() {
  const ctx = _ctx;
  ctx.clearRect(0, 0, _canvas.width, _canvas.height);

  // Tenta bg da fase → fundo.jpg → cor sólida
  const bgFase = _bgDaFase(gameState.faseAtual);
  if (bgFase.complete && bgFase.naturalWidth > 0) {
    ctx.drawImage(bgFase, 0, 0, _canvas.width, _canvas.height);
  } else if (_bgFundo.complete && _bgFundo.naturalWidth > 0) {
    ctx.drawImage(_bgFundo, 0, 0, _canvas.width, _canvas.height);
  } else {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, _canvas.width, _canvas.height);
  }

  magnetDraw(ctx);
  blackHoleDraw(ctx);
  itemsDrawAll(ctx);
  playerDraw(ctx);
}

// ─── Boot ─────────────────────────────────────────────────────
(function boot() {
  hudInit();
  hudOcultar();
  overlayMostrarInicio(() => mainIniciarFase(gameState.faseAtual));
}());
