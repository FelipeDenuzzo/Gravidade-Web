// =============================================================
// ItemFactory.js
// Equivalente a: ItemType.swift + ItemModel.swift +
//   ItemFactory.swift (Lab_gravidade iOS/Game/Items/)
//
// Cria e renderiza todos os tipos de esferas no canvas.
// Detecta colisão círculo-círculo com o jogador.
// =============================================================

'use strict';

// -------------------------------------------------------------
// Tipos de item (enum ItemType do Swift)
// -------------------------------------------------------------
const ITEM_TYPE = {
  LARANJA_NORMAL:   'laranjaNormal',
  LARANJA_IMPOSTOR: 'laranjaImpostor',
  LARANJA_FALSA:    'laranjaFalsa',
  AZUL_NORMAL:      'azulNormal',
  AZUL_GERA4:       'azulGera4',
  AZUL_GERA8:       'azulGera8',
  AZUL_ESPECIAL:    'azulEspecial',
  AZUL_FASE17:      'azulFase17',
  GANHA_TEMPO:      'ganhaTempo',
  PERDE_TEMPO:      'perdeTempo',
};

// Mapeamento tipo → asset (fiel ao ItemFactory.assetName do Swift)
const ITEM_ASSET = {
  [ITEM_TYPE.LARANJA_NORMAL]:   'esfera_laranja',
  [ITEM_TYPE.LARANJA_IMPOSTOR]: 'esfera_laranja',
  [ITEM_TYPE.LARANJA_FALSA]:    'falsa',
  [ITEM_TYPE.AZUL_NORMAL]:      'esfera_azul',
  [ITEM_TYPE.AZUL_GERA4]:       'esfera_azul',
  [ITEM_TYPE.AZUL_GERA8]:       'esfera_azul',
  [ITEM_TYPE.AZUL_ESPECIAL]:    'esfera_azul',
  [ITEM_TYPE.AZUL_FASE17]:      'esfera_azul',
  [ITEM_TYPE.GANHA_TEMPO]:      'ganhatempo',
  [ITEM_TYPE.PERDE_TEMPO]:      'perdetempo',
};

// Fallback colors (igual ao ItemFactory.fallbackColor do Swift)
const ITEM_FALLBACK_COLOR = {
  [ITEM_TYPE.LARANJA_NORMAL]:   '#ff9500',
  [ITEM_TYPE.LARANJA_IMPOSTOR]: '#ff9500',
  [ITEM_TYPE.LARANJA_FALSA]:    '#ff2d55',
  [ITEM_TYPE.AZUL_NORMAL]:      '#007aff',
  [ITEM_TYPE.AZUL_GERA4]:       '#007aff',
  [ITEM_TYPE.AZUL_GERA8]:       '#007aff',
  [ITEM_TYPE.AZUL_ESPECIAL]:    '#007aff',
  [ITEM_TYPE.AZUL_FASE17]:      '#007aff',
  [ITEM_TYPE.GANHA_TEMPO]:      '#34c759',
  [ITEM_TYPE.PERDE_TEMPO]:      '#ff3b30',
};

// Pré-carregamento de imagens (uma vez, na inicialização)
const ITEM_IMGS = {};
Object.values(ITEM_ASSET)
  .filter((v, i, a) => a.indexOf(v) === i)  // únicos
  .forEach(name => {
    const img = new Image();
    img.src   = `assets/${name}.png`;
    ITEM_IMGS[name] = img;
  });

// Imagem do jogador
const PLAYER_IMG = new Image();
PLAYER_IMG.src = 'assets/esfera_vermelha.png';

// -------------------------------------------------------------
// Model de item (equivale ao ItemModel.swift)
// { tipo, x, y, r, vx, vy, angle, visible, meta }
// -------------------------------------------------------------
function criarItem(tipo, x, y, r, meta = {}) {
  return { tipo, x, y, r, vx: 0, vy: 0, angle: 0, visible: true, meta };
}

// -------------------------------------------------------------
// Arrays de itens ativos na fase
// -------------------------------------------------------------
const items = {
  laranjas:    [],  // laranjaNormal + laranjaImpostor
  falsas:      [],  // laranjaFalsa
  azuis:       [],  // azulNormal, azulGera4, azulGera8, azulEspecial
  azuisFase17: [],  // azulFase17
  ganhaTempo:  [],
  perdeTempo:  [],
};

function itemsReset() {
  Object.keys(items).forEach(k => { items[k] = []; });
}

// -------------------------------------------------------------
// Posicionamento aleatório sem sobreposição
// Equivale a MAXTENTATIVASPOSICAO = 100 do GameViewController
// -------------------------------------------------------------
const MAX_TENTATIVAS = 100;

function _posicaoValida(x, y, r, bounds, existentes) {
  const margem = r + 4;
  if (x - r < bounds.marginX + margem) return false;
  if (x + r > bounds.marginX + bounds.w - margem) return false;
  if (y - r < bounds.marginY + margem) return false;
  if (y + r > bounds.marginY + bounds.h - margem) return false;

  for (const item of existentes) {
    const dx = x - item.x;
    const dy = y - item.y;
    if (Math.sqrt(dx*dx + dy*dy) < r + item.r + 4) return false;
  }
  // Mantém distância do jogador
  const dpx = x - player.x;
  const dpy = y - player.y;
  if (Math.sqrt(dpx*dpx + dpy*dpy) < r + player.r + 30) return false;

  return true;
}

function _randomPos(r, bounds, existentes) {
  for (let t = 0; t < MAX_TENTATIVAS; t++) {
    const x = bounds.marginX + r + Math.random() * (bounds.w - r * 2);
    const y = bounds.marginY + r + Math.random() * (bounds.h - r * 2);
    if (_posicaoValida(x, y, r, bounds, existentes)) return { x, y };
  }
  // Fallback: centro com pequeno offset
  return {
    x: bounds.marginX + bounds.w / 2 + (Math.random() - 0.5) * 40,
    y: bounds.marginY + bounds.h / 2 + (Math.random() - 0.5) * 40,
  };
}

// -------------------------------------------------------------
// Raio base e tamanho das esferas
// Equivale a tamanhoCelula * 0.8 * MULTIPLICADORTAMANHOESFERAS(2.0)
// -------------------------------------------------------------
let _baseRadius = 20;  // atualizado por itemFactoryInit()

function itemFactoryInit(bounds) {
  // tamanhoCelula = min(w,h) / 10; raio = tamanhoCelula * 0.8 * 2.0
  const celula = Math.min(bounds.w, bounds.h) / 10;
  _baseRadius  = celula * 0.8 * 2.0 / 2;  // div 2 = raio
  player.r     = _baseRadius;
}

// -------------------------------------------------------------
// Popular fase com itens (chamado por main.js ao iniciar fase)
// -------------------------------------------------------------
function itemsPopularFase(config, bounds) {
  itemsReset();

  const todos = [];
  const r = _baseRadius;

  // Laranjas normais
  for (let i = 0; i < config.itensLaranja; i++) {
    const tipo = i < config.laranjaImpostorQuantidade
      ? ITEM_TYPE.LARANJA_IMPOSTOR
      : ITEM_TYPE.LARANJA_NORMAL;
    const p = _randomPos(r, bounds, todos);
    const item = criarItem(tipo, p.x, p.y, r);
    items.laranjas.push(item);
    todos.push(item);
  }

  // Laranjas falsas
  for (let i = 0; i < config.falsaLaranjaQuantidade; i++) {
    const p = _randomPos(r, bounds, todos);
    const item = criarItem(ITEM_TYPE.LARANJA_FALSA, p.x, p.y, r, {
      azuisGerados: config.falsaLaranjaAzuisGerados,
    });
    items.falsas.push(item);
    todos.push(item);
  }

  // Azuis normais (base)
  for (let i = 0; i < config.itensAzuis; i++) {
    const rAzul = r * config.azulBaseMultiplicador;
    const p = _randomPos(rAzul, bounds, todos);
    const item = criarItem(ITEM_TYPE.AZUL_NORMAL, p.x, p.y, rAzul);
    items.azuis.push(item);
    todos.push(item);
  }

  // Azuis extras (AzulExtraConfig)
  for (const extra of config.azulExtras) {
    for (let i = 0; i < extra.quantidade; i++) {
      const rExtra = r * extra.tamanhoMultiplicador;
      const p = _randomPos(rExtra, bounds, todos);
      let tipo = ITEM_TYPE.AZUL_NORMAL;
      if (extra.geraQuatro)           tipo = ITEM_TYPE.AZUL_GERA4;
      else if (extra.geraOito)        tipo = ITEM_TYPE.AZUL_GERA8;
      else if (extra.adicionarEmEspeciais) tipo = ITEM_TYPE.AZUL_ESPECIAL;
      const item = criarItem(tipo, p.x, p.y, rExtra, {
        grande: extra.marcarEsferaGrande,
        movel:  config.azulGrandeMovel,
      });
      items.azuis.push(item);
      todos.push(item);
    }
  }

  // Azuis fase 17 (azuisFase17: true)
  if (config.azuisFase17) {
    for (let i = 0; i < config.itensAzuis; i++) {
      const p = _randomPos(r, bounds, todos);
      const item = criarItem(ITEM_TYPE.AZUL_FASE17, p.x, p.y, r, { crescimento: 0 });
      items.azuisFase17.push(item);
      todos.push(item);
    }
  }

  // Ganha tempo
  for (let i = 0; i < config.ganhaTempoQuantidade; i++) {
    const p = _randomPos(r, bounds, todos);
    const item = criarItem(ITEM_TYPE.GANHA_TEMPO, p.x, p.y, r, {
      segundos: config.ganhaTempoSegundos,
      repulsao: config.ganhaTempoRepulsao,
    });
    items.ganhaTempo.push(item);
    todos.push(item);
  }

  // Perde tempo
  for (let i = 0; i < config.perdeTempoQuantidade; i++) {
    const p = _randomPos(r, bounds, todos);
    const item = criarItem(ITEM_TYPE.PERDE_TEMPO, p.x, p.y, r, {
      segundos: config.perdeTempoSegundos,
    });
    items.perdeTempo.push(item);
    todos.push(item);
  }
}

// -------------------------------------------------------------
// Detecção de colisão círculo-círculo
// Retorna true se o jogador tocou o item
// -------------------------------------------------------------
function itemColideComJogador(item) {
  if (!item.visible) return false;
  const dx = player.x - item.x;
  const dy = player.y - item.y;
  return Math.sqrt(dx*dx + dy*dy) < player.r + item.r;
}

// -------------------------------------------------------------
// Render de todos os itens
// -------------------------------------------------------------
function itemsDrawAll(ctx) {
  const todos = [
    ...items.laranjas,
    ...items.falsas,
    ...items.azuis,
    ...items.azuisFase17,
    ...items.ganhaTempo,
    ...items.perdeTempo,
  ];

  for (const item of todos) {
    if (!item.visible) continue;
    _drawItem(ctx, item);
  }
}

function _drawItem(ctx, item) {
  const assetName = ITEM_ASSET[item.tipo];
  const img       = ITEM_IMGS[assetName];

  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.angle) ctx.rotate(item.angle);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, item.r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, -item.r, -item.r, item.r * 2, item.r * 2);
  } else {
    // Fallback cor sólida
    ctx.beginPath();
    ctx.arc(0, 0, item.r, 0, Math.PI * 2);
    ctx.fillStyle = ITEM_FALLBACK_COLOR[item.tipo] ?? '#888';
    ctx.fill();
  }
  ctx.restore();
}

// Render do jogador
function playerDraw(ctx) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  if (PLAYER_IMG.complete && PLAYER_IMG.naturalWidth > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(PLAYER_IMG, -player.r, -player.r, player.r * 2, player.r * 2);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff3b30';
    ctx.fill();
  }
  ctx.restore();
}

// Conta laranjas visíveis restantes
function laranjasPendentes() {
  return items.laranjas.filter(i => i.visible).length +
         items.falsas.filter(i => i.visible).length;
}
