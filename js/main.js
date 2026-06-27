// =============================================================
// main.js  —  Equivalente a GameViewController.swift
// =============================================================
'use strict';

// ─── Canvas ──────────────────────────────────────────────────
const _mainCanvas = document.getElementById('gameCanvas');
const _mainCtx    = _mainCanvas.getContext('2d');
let   _mainBounds = { w: 0, h: 0, marginX: 0, marginY: 0 };

// Retorna dimensões reais da área visível (desconta barras do browser mobile)
function _getViewSize() {
  if (window.visualViewport) {
    return { w: window.visualViewport.width, h: window.visualViewport.height };
  }
  return { w: window.innerWidth, h: window.innerHeight };
}

function _redimensionar() {
  const { w, h } = _getViewSize();
  _mainCanvas.width  = w;
  _mainCanvas.height = h;
  _mainBounds = { w, h, marginX: 0, marginY: 0 };
  if (!gameState.jogoAtivo) {
    player.x = _mainBounds.w / 2;
    player.y = _mainBounds.h / 4;
  }
}

window.addEventListener('resize', () => { _redimensionar(); _reinicializarFase(); });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => { _redimensionar(); _reinicializarFase(); });
}
_redimensionar();

// ─── Background ───────────────────────────────────────────────
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

// ─── Vídeos ──────────────────────────────────────────────────
const VIDEO_VITORIA = 'assets/transivitoria.mp4';
const VIDEO_DERROTA = 'assets/transiderrota.mp4';

// ─── Inicializar fase ────────────────────────────────────────
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

  player.x  = _mainBounds.w / 2;
  player.y  = _mainBounds.h / 4;
  player.vx = player.vy = 0;

  itemFactoryInit(_mainBounds);
  magnetCriar(config, _mainBounds);
  blackHoleCriar(config, _mainBounds, player.r);
  itemsPopularFase(config, _mainBounds);

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
  physicsInit(_mainCanvas, _mainBounds, _onFrame);
  physicsStart();
}

function _reinicializarFase() {
  if (!gameState.jogoAtivo) return;
  magnetReset();
  blackHoleReset();
  physicsLimparObstaculos();
  const config = obterConfigFase(gameState.faseAtual);
  itemFactoryInit(_mainBounds);
  magnetCriar(config, _mainBounds);
  blackHoleCriar(config, _mainBounds, player.r);
}

// ─── Efeito de coleta ─────────────────────────────────────────
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
    case ITEM_TYPE.AZUL_FASE17:   _aplicarPenalidade(5); break;
    case ITEM_TYPE.AZUL_GERA4:    _aplicarPenalidade(5); _spawnAzuis(4); break;
    case ITEM_TYPE.AZUL_GERA8:    _aplicarPenalidade(5); _spawnAzuis(8); break;
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
    x: _mainBounds.marginX + r + Math.random() * (_mainBounds.w - r * 2),
    y: _mainBounds.marginY + r + Math.random() * (_mainBounds.h - r * 2),
  };
}
function _aplicarPenalidade(seg) {
  if (modoUsaTempo(gameState.modo))
    gameState.tempoRestante = Math.max(0, gameState.tempoRestante - seg);
}

// ─── Vitória ──────────────────────────────────────────────────
function _verificarCondicaoVitoria() {
  if (!gameState.jogoAtivo || laranjasPendentes() > 0) return;
  gameState.jogoAtivo = false;
  hudBotaoSairAtivo(false);
  const ultimaFase = gameState.faseAtual >= NUMERO_MAXIMO_FASES;
  introPlayVideo(VIDEO_VITORIA, () => {
    overlayMostrarVitoria({
      titulo:    ultimaFase ? '🎉 Parabéns!' : '✅ Fase concluída!',
      mensagem:  ultimaFase ? 'Você completou todas as fases!'
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

// ─── Fim de tempo ────────────────────────────────────────────
function _verificarFimTempo() {
  if (!gameState.jogoAtivo || !modoUsaTempo(gameState.modo) || gameState.tempoRestante > 0) return;
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
  if (!gameState.jogoAtivo || gameState.jogoPausado) { _render(); return; }
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

// ─── Colisões ────────────────────────────────────────────────
function _checarColisoes() {
  const todos = [...items.laranjas, ...items.falsas, ...items.azuis,
                 ...items.azuisFase17, ...items.ganhaTempo, ...items.perdeTempo];
  for (const item of todos) {
    if (itemColideComJogador(item)) _efetivarColeta(item);
  }
}

// ─── Render ──────────────────────────────────────────────────
function _render() {
  const ctx = _mainCtx;
  ctx.clearRect(0, 0, _mainCanvas.width, _mainCanvas.height);
  const bgFase = _bgDaFase(gameState.faseAtual);
  if (bgFase.complete && bgFase.naturalWidth > 0) {
    ctx.drawImage(bgFase, 0, 0, _mainCanvas.width, _mainCanvas.height);
  } else if (_bgFundo.complete && _bgFundo.naturalWidth > 0) {
    ctx.drawImage(_bgFundo, 0, 0, _mainCanvas.width, _mainCanvas.height);
  } else {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, _mainCanvas.width, _mainCanvas.height);
  }
  magnetDraw(ctx);
  blackHoleDraw(ctx);
  itemsDrawAll(ctx);
  playerDraw(ctx);
}

// ─── Boot ──────────────────────────────────────────────────────
(function boot() {
  hudInit();
  hudOcultar();
  overlayMostrarInicio(() => mainIniciarFase(gameState.faseAtual));
}());
