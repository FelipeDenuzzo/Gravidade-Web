// =============================================================
// MagnetSystem.js
// Equivalente a: MagnetSystem.swift + MagnetObstacleView.swift
//
// Gerencia criação visual dos magnetos no canvas e aplica
// repulsão na velocidade do jogador a cada frame.
// =============================================================

'use strict';

// Estado dos magnetos na fase atual
const magnetState = {
  direito:   null,  // { x, y, w, h, activeRect, orientation }
  esquerdo:  null,
  inferior:  null,
  superior:  null,
  // forcaMultiplicador da config atual
  forcaMultiplicador: 1.0,
};

// Imagens dos magnetos (usa assets existentes do repo Swift)
const MAGNET_IMGS = {};
['imamG', 'imamP'].forEach(name => {
  MAGNET_IMGS[name] = new Image();
  MAGNET_IMGS[name].src = `assets/${name}.png`;
});

// -------------------------------------------------------------
// Criação dos magnetos
// Equivalente a MagnetSystem.adicionarObstaculos()
// -------------------------------------------------------------
function magnetCriar(config, bounds) {
  magnetReset();
  if (!config.obstaculos) return;
  const obs  = config.obstaculos;
  magnetState.forcaMultiplicador = obs.forcaMultiplicador;

  const W = bounds.w;
  const H = bounds.h;
  // Magnetos laterais: ~20% da largura, ~55% da altura
  const magW_lat  = W * 0.20 * obs.tamanhoMultiplicador;
  const magH_lat  = H * 0.55;
  // Magnetos verticais: ~42% da largura, ~22% da altura
  const magW_vert = W * 0.42;
  const magH_vert = H * 0.22 * obs.tamanhoMultiplicador;

  function activeRect(x, y, w, h, orient) {
    // Equivale a magnetCollisionFrame() do Swift
    if (orient === 'right' || orient === 'left') {
      return { x: x + w * 0.18, y: y + h * 0.24,
               w: w * 0.64,    h: h * 0.52 };
    }
    return { x: x + w * 0.12, y: y + h * 0.08,
             w: w * 0.76,    h: h * 0.84 };
  }

  if (obs.incluirDireito) {
    const x = bounds.marginX + W - magW_lat;
    const y = bounds.marginY + (H - magH_lat) / 2;
    magnetState.direito = { x, y, w: magW_lat, h: magH_lat,
      activeRect: activeRect(x, y, magW_lat, magH_lat, 'right'),
      orientation: 'right' };
    physicsAdicionarObstaculo(magnetState.direito.activeRect);
  }
  if (obs.incluirEsquerdo) {
    const x = bounds.marginX;
    const y = bounds.marginY + (H - magH_lat) / 2;
    magnetState.esquerdo = { x, y, w: magW_lat, h: magH_lat,
      activeRect: activeRect(x, y, magW_lat, magH_lat, 'left'),
      orientation: 'left' };
    physicsAdicionarObstaculo(magnetState.esquerdo.activeRect);
  }
  if (obs.incluirInferior) {
    const x = bounds.marginX + (W - magW_vert) / 2;
    const y = bounds.marginY + H - magH_vert + 8;
    magnetState.inferior = { x, y, w: magW_vert, h: magH_vert,
      activeRect: activeRect(x, y, magW_vert, magH_vert, 'bottom'),
      orientation: 'bottom' };
    physicsAdicionarObstaculo(magnetState.inferior.activeRect);
  }
  if (obs.incluirSuperior) {
    const x = bounds.marginX + (W - magW_vert) / 2;
    const y = bounds.marginY - 8;
    magnetState.superior = { x, y, w: magW_vert, h: magH_vert,
      activeRect: activeRect(x, y, magW_vert, magH_vert, 'top'),
      orientation: 'top' };
    physicsAdicionarObstaculo(magnetState.superior.activeRect);
  }
}

// -------------------------------------------------------------
// Repulsão por frame
// Equivale a MagnetSystem.aplicarRepulsao() do Swift
// -------------------------------------------------------------
function magnetAplicarRepulsao(_dt) {
  const ativos = [magnetState.direito, magnetState.esquerdo,
                  magnetState.inferior, magnetState.superior].filter(Boolean);
  if (!ativos.length) return;

  const mult = magnetState.forcaMultiplicador;
  let ajusteDX = 0, ajusteDY = 0;

  for (const mag of ativos) {
    const ar = mag.activeRect;
    const midX = ar.x + ar.w / 2;
    const midY = ar.y + ar.h / 2;

    const alcanceBase = Math.max(ar.w, ar.h) * 0.55 * mult;
    const alcanceX    = Math.max(ar.w / 2 + alcanceBase, 1);
    const alcanceY    = Math.max(ar.h / 2 + alcanceBase, 1);

    const dx = player.x - midX;
    const dy = player.y - midY;
    const distNorm = Math.sqrt((dx * dx) / (alcanceX * alcanceX) +
                               (dy * dy) / (alcanceY * alcanceY));
    if (distNorm >= 1.0) continue;

    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.001);
    const nx = dx / dist;
    const ny = dy / dist;
    const prox = Math.max(0, 1.0 - distNorm);
    const fMin = 0.35 * mult;
    const fMax = 2.4  * mult;
    let   f    = fMin + (fMax - fMin) * prox;

    // Frente do magneto é mais forte (equivale ao boost 1.2x do Swift)
    if      (mag.orientation === 'right'  && dx < 0) f *= 1.2;
    else if (mag.orientation === 'left'   && dx > 0) f *= 1.2;
    else if (mag.orientation === 'bottom' && dy < 0) f *= 1.2;
    else if (mag.orientation === 'top'    && dy > 0) f *= 1.2;

    ajusteDX += nx * f;
    ajusteDY += ny * f;
  }

  const lim = Math.max(2.8, 4.0 * mult);
  // Converte para px/s e aplica à velocidade (grav já está em px/s²)
  player.vx += Math.max(-lim, Math.min(lim, ajusteDX)) * PHYSICS.GRAVIDADE_ESCALA * 0.016;
  player.vy += Math.max(-lim, Math.min(lim, ajusteDY)) * PHYSICS.GRAVIDADE_ESCALA * 0.016;
}

// -------------------------------------------------------------
// Render dos magnetos no canvas
// -------------------------------------------------------------
function magnetDraw(ctx) {
  const ativos = [magnetState.direito, magnetState.esquerdo,
                  magnetState.inferior, magnetState.superior].filter(Boolean);
  for (const mag of ativos) {
    const img = MAGNET_IMGS['imamG'];
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      const cx = mag.x + mag.w / 2;
      const cy = mag.y + mag.h / 2;
      ctx.translate(cx, cy);
      // Espelha magneto esquerdo e superior (equivale a rotationAngle: .pi do Swift)
      if (mag.orientation === 'left' || mag.orientation === 'top') {
        ctx.rotate(Math.PI);
      }
      ctx.drawImage(img, -mag.w / 2, -mag.h / 2, mag.w, mag.h);
      ctx.restore();
    } else {
      // Fallback visual (retangulo vermelho, igual ao Swift)
      ctx.save();
      ctx.fillStyle = 'rgba(220, 33, 40, 0.88)';
      ctx.beginPath();
      _roundRect(ctx, mag.activeRect.x, mag.activeRect.y,
                      mag.activeRect.w, mag.activeRect.h, 10);
      ctx.fill();
      ctx.restore();
    }
  }
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function magnetReset() {
  magnetState.direito = magnetState.esquerdo =
  magnetState.inferior = magnetState.superior = null;
  magnetState.forcaMultiplicador = 1.0;
  physicsLimparObstaculos();
}
