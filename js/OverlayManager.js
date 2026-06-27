// =============================================================
// OverlayManager.js
// Equivalente a: OverlayManager.swift + HUDComponents.swift
//   (createTimeoutOverlay, createVictoryOverlay,
//    createExitConfirmationOverlay, createPhaseSelectorOverlay)
//
// Todas as telas de overlay são renderizadas como HTML
// dentro de #overlayContainer.
// =============================================================

'use strict';

const _overlayContainer = document.getElementById('overlayContainer');

// IDs de overlay (equivale às tags do Swift)
const OVERLAY_ID = {
  FIM_TEMPO:     'overlay-fim-tempo',
  VITORIA:       'overlay-vitoria',
  SAIDA:         'overlay-saida',
  SELETOR_FASE:  'overlay-seletor-fase',
  INICIO:        'overlay-inicio',
};

// -------------------------------------------------------------
// Helpers internos
// -------------------------------------------------------------
function _removerOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function _criarBg(id) {
  const bg = document.createElement('div');
  bg.id    = id;
  bg.className = 'overlay-bg';
  return bg;
}

function _criarCard() {
  const card = document.createElement('div');
  card.className = 'card';
  return card;
}

function _btn(label, cssClass, onClick) {
  const b = document.createElement('button');
  b.textContent = label;
  b.className   = `btn ${cssClass}`;
  b.onclick     = onClick;
  return b;
}

// -------------------------------------------------------------
// Tela inicial de seleção de modo
// Equivale ao overlay de início do GameViewController
// -------------------------------------------------------------
function overlayMostrarInicio(onComecar) {
  _removerOverlay(OVERLAY_ID.INICIO);
  _overlayContainer.style.pointerEvents = 'auto';

  const bg   = _criarBg(OVERLAY_ID.INICIO);
  const card = _criarCard();

  const titulo = document.createElement('h2');
  titulo.textContent = 'Como quer jogar?';
  card.appendChild(titulo);

  // Botões de modo
  const modos = [
    { label: 'Livre sem tempo',      valor: MODOS.LIVRE_SEM_TEMPO },
    { label: 'Livre com tempo',      valor: MODOS.LIVRE_COM_TEMPO },
    { label: 'Sequência de história', valor: MODOS.SEQUENCIA_HISTORIA },
  ];
  let modoEscolhido = gameState.modo;

  const btnsModo = [];
  modos.forEach(m => {
    const b = document.createElement('button');
    b.textContent = m.label;
    b.className   = `btn ${modoEscolhido === m.valor ? 'btn-selected' : 'btn-secondary'}`;
    b.onclick = () => {
      modoEscolhido = m.valor;
      btnsModo.forEach((bb, i) => {
        bb.className = `btn ${modos[i].valor === modoEscolhido ? 'btn-selected' : 'btn-secondary'}`;
      });
    };
    card.appendChild(b);
    btnsModo.push(b);
  });

  // Seletor de dificuldade
  const lblDif = document.createElement('p');
  lblDif.textContent = 'Dificuldade:';
  card.appendChild(lblDif);

  const sel = document.createElement('select');
  sel.style.cssText = 'padding:8px;border-radius:8px;font-size:15px;width:100%';
  DIFICULDADES.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = d.titulo;
    if (d.id === gameState.dificuldade.id) opt.selected = true;
    sel.appendChild(opt);
  });
  card.appendChild(sel);

  // Botão começar
  card.appendChild(_btn('Começar', 'btn-primary', () => {
    gameState.modo        = modoEscolhido;
    gameState.dificuldade = DIFICULDADES[parseInt(sel.value)];
    _removerOverlay(OVERLAY_ID.INICIO);
    _overlayContainer.style.pointerEvents = 'none';
    onComecar();
  }));

  bg.appendChild(card);
  _overlayContainer.appendChild(bg);
}

// -------------------------------------------------------------
// Overlay de fim de tempo (timeout)
// Equivale a OverlayManager.createTimeoutOverlay()
// "O seu tempo acabou"
// -------------------------------------------------------------
function overlayMostrarFimTempo({ onTentarNovamente, onSelecionarFase, onVoltarInicio }) {
  _removerOverlay(OVERLAY_ID.FIM_TEMPO);
  _overlayContainer.style.pointerEvents = 'auto';

  const bg   = _criarBg(OVERLAY_ID.FIM_TEMPO);
  const card = _criarCard();

  const h2 = document.createElement('h2');
  h2.textContent = 'O seu tempo acabou';
  card.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = 'Você quer tentar mais uma vez?';
  card.appendChild(p);

  card.appendChild(_btn('Tentar novamente', 'btn-secondary', () => {
    _removerOverlay(OVERLAY_ID.FIM_TEMPO);
    _overlayContainer.style.pointerEvents = 'none';
    onTentarNovamente();
  }));
  card.appendChild(_btn('Selecionar fase', 'btn-blue', () => {
    _removerOverlay(OVERLAY_ID.FIM_TEMPO);
    overlayMostrarSeletorFase({ onSelecionarFase, onCancelar: () => {
      overlayMostrarFimTempo({ onTentarNovamente, onSelecionarFase, onVoltarInicio });
    }});
  }));
  card.appendChild(_btn('Voltar ao início', 'btn-secondary', () => {
    _removerOverlay(OVERLAY_ID.FIM_TEMPO);
    onVoltarInicio();
  }));

  bg.appendChild(card);
  _overlayContainer.appendChild(bg);
}

// -------------------------------------------------------------
// Overlay de vitória
// Equivale a OverlayManager.createVictoryOverlay()
// -------------------------------------------------------------
function overlayMostrarVitoria({
  titulo, mensagem, ultimaFase,
  onRepetir, onAvancar, onSelecionarFase, onFinalizar, onVoltarInicio
}) {
  _removerOverlay(OVERLAY_ID.VITORIA);
  _overlayContainer.style.pointerEvents = 'auto';

  const bg   = _criarBg(OVERLAY_ID.VITORIA);
  const card = _criarCard();

  const h2 = document.createElement('h2');
  h2.textContent = titulo ?? '🎉 Fase concluída!';
  card.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = mensagem ?? '';
  card.appendChild(p);

  card.appendChild(_btn('Repetir', 'btn-secondary', () => {
    _removerOverlay(OVERLAY_ID.VITORIA);
    _overlayContainer.style.pointerEvents = 'none';
    onRepetir();
  }));

  if (ultimaFase) {
    card.appendChild(_btn('Escolher Fase', 'btn-blue', () => {
      _removerOverlay(OVERLAY_ID.VITORIA);
      overlayMostrarSeletorFase({ onSelecionarFase, onCancelar: () => {} });
    }));
    card.appendChild(_btn('Finalizar', 'btn-secondary', () => {
      _removerOverlay(OVERLAY_ID.VITORIA);
      onFinalizar();
    }));
  } else {
    card.appendChild(_btn('Avançar', 'btn-primary', () => {
      _removerOverlay(OVERLAY_ID.VITORIA);
      _overlayContainer.style.pointerEvents = 'none';
      onAvancar();
    }));
  }

  card.appendChild(_btn('Voltar ao início', 'btn-secondary', () => {
    _removerOverlay(OVERLAY_ID.VITORIA);
    onVoltarInicio();
  }));

  bg.appendChild(card);
  _overlayContainer.appendChild(bg);
}

// -------------------------------------------------------------
// Overlay de confirmação de saída
// Equivale a OverlayManager.createExitConfirmationOverlay()
// "Sair do jogo?"
// -------------------------------------------------------------
function overlayMostrarSaida() {
  if (document.getElementById(OVERLAY_ID.SAIDA)) return;
  _overlayContainer.style.pointerEvents = 'auto';
  gameState.jogoPausado = true;

  const bg   = _criarBg(OVERLAY_ID.SAIDA);
  const card = _criarCard();

  const h2 = document.createElement('h2');
  h2.textContent = 'Sair do jogo?';
  card.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = 'Sair do jogo ou retornar';
  card.appendChild(p);

  card.appendChild(_btn('Sair do jogo', 'btn-danger', () => {
    _removerOverlay(OVERLAY_ID.SAIDA);
    gameState.jogoAtivo  = false;
    gameState.jogoPausado = false;
    _overlayContainer.style.pointerEvents = 'none';
    // Volta para a tela inicial
    overlayMostrarInicio(() => mainIniciarFase(gameState.faseAtual));
  }));

  card.appendChild(_btn('Retornar', 'btn-secondary', () => {
    _removerOverlay(OVERLAY_ID.SAIDA);
    _overlayContainer.style.pointerEvents = 'none';
    gameState.jogoPausado = false;
  }));

  bg.appendChild(card);
  _overlayContainer.appendChild(bg);
}

// -------------------------------------------------------------
// Seletor de fase (grade 5 colunas)
// Equivale a OverlayManager.createPhaseSelectorOverlay()
// -------------------------------------------------------------
function overlayMostrarSeletorFase({ onSelecionarFase, onCancelar }) {
  _removerOverlay(OVERLAY_ID.SELETOR_FASE);
  _overlayContainer.style.pointerEvents = 'auto';

  const bg   = _criarBg(OVERLAY_ID.SELETOR_FASE);
  const card = _criarCard();

  const h2 = document.createElement('h2');
  h2.textContent = 'Escolher Fase';
  card.appendChild(h2);

  // Grade de botões (5 colunas, igual ao Swift)
  const grade = document.createElement('div');
  grade.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:8px';

  for (let f = 1; f <= NUMERO_MAXIMO_FASES; f++) {
    const b = document.createElement('button');
    b.textContent = `${f}`;
    b.style.cssText = [
      'padding:10px 0',
      'border:none',
      'border-radius:10px',
      `background:${f === gameState.faseAtual ? '#34c759' : '#007aff'}`,
      'color:#fff',
      'font-size:17px',
      'font-weight:700',
      'cursor:pointer',
    ].join(';');
    const fase = f;
    b.onclick = () => {
      _removerOverlay(OVERLAY_ID.SELETOR_FASE);
      _overlayContainer.style.pointerEvents = 'none';
      onSelecionarFase(fase);
    };
    grade.appendChild(b);
  }
  card.appendChild(grade);

  card.appendChild(_btn('Cancelar', 'btn-secondary', () => {
    _removerOverlay(OVERLAY_ID.SELETOR_FASE);
    _overlayContainer.style.pointerEvents = 'none';
    onCancelar();
  }));

  bg.appendChild(card);
  _overlayContainer.appendChild(bg);
}

// Remove todos os overlays ativos
function overlayLimparTodos() {
  Object.values(OVERLAY_ID).forEach(_removerOverlay);
  _overlayContainer.style.pointerEvents = 'none';
}
