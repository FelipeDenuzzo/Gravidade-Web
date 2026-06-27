// =============================================================
// BlackHole.js
// Equivalente a: BlackHoleSystem.swift
//
// Gerencia criação visual e atração gravitacional do
// buraco negro a cada frame.
// =============================================================

'use strict';

// Estado dos buracos negros na fase atual
const bhState = {
  buracos: [],  // array de { cx, cy, raio, config }
};

// Imagem do buraco negro (asset "bn0" do repo Swift)
const BN_IMG = new Image();
BN_IMG.src = 'assets/bn0.png';

// -------------------------------------------------------------
// Criação
// Equivalente a BlackHoleSystem.adicionarBuracos()
// -------------------------------------------------------------
function blackHoleCriar(config, bounds, playerRadius) {
  bhState.buracos = [];
  if (!config.buracoNegro) return;

  const bn   = config.buracoNegro;
  const W    = bounds.w;
  const H    = bounds.h;

  // Tamanho do buraco: proporcional ao jogador (igual ao Swift)
  const tamanhoJogador = playerRadius * 2;
  const tamanhoBase    = tamanhoJogador * bn.tamanhoMultiplicador;
  const tamanhoMax     = Math.min(W, H) - playerRadius * 2;
  const raio           = Math.min(tamanhoBase, tamanhoMax) / 2;

  const cx = bounds.marginX + W * 0.5;

  // Buraco principal (centroYRelativo)
  const cy1 = bounds.marginY + H * bn.centroYRelativo;
  bhState.buracos.push({ cx: cx, cy: cy1, raio, bnConfig: bn });

  // Segundo buraco (apenas quando quantidade > 1 e centroYSuperiorRelativo informado)
  if (bn.quantidade > 1 && bn.centroYSuperiorRelativo != null) {
    const cy2 = bounds.marginY + H * bn.centroYSuperiorRelativo;
    bhState.buracos.push({ cx: cx, cy: cy2, raio, bnConfig: bn });
  }
}

// -------------------------------------------------------------
// Atração por frame
// Equivale a BlackHoleSystem.aplicarAtracao() do Swift
// -------------------------------------------------------------
function blackHoleAplicarAtracao(_dt) {
  if (!bhState.buracos.length) return;

  for (const bn of bhState.buracos) {
    const dx = bn.cx - player.x;
    const dy = bn.cy - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) continue;

    const raio             = bn.raio;
    const raioInfluenciaMax = raio * 2.0;  // igual ao Swift
    if (dist > raioInfluenciaMax) continue;

    const distNorm    = Math.min(dist / raio, 1.0);
    const forcaMaxima = bn.bnConfig.forcaMaxima;
    const forcaMinima = bn.bnConfig.forcaMinima;
    let   forca       = forcaMinima + (forcaMaxima - forcaMinima) * distNorm;

    // Zona de transição fora do raio (equivale ao progressoTransicao do Swift)
    if (dist > raio) {
      const progresso   = Math.min(Math.max((dist - raio) / raio, 0), 1);
      forca *= (1.0 - progresso);
    }

    const nx = dx / dist;
    const ny = dy / dist;

    // Aplica à velocidade (converte fator para px/s²)
    player.vx += nx * forca * PHYSICS.GRAVIDADE_ESCALA * 0.016;
    player.vy += ny * forca * PHYSICS.GRAVIDADE_ESCALA * 0.016;
  }
}

// -------------------------------------------------------------
// Render
// -------------------------------------------------------------
function blackHoleDraw(ctx) {
  for (const bn of bhState.buracos) {
    if (BN_IMG.complete && BN_IMG.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(bn.cx, bn.cy, bn.raio, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(BN_IMG,
        bn.cx - bn.raio, bn.cy - bn.raio,
        bn.raio * 2,     bn.raio * 2);
      ctx.restore();
    } else {
      // Fallback visual (círculo claro, igual ao Swift)
      ctx.save();
      ctx.beginPath();
      ctx.arc(bn.cx, bn.cy, bn.raio, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220, 220, 220, 0.95)';
      ctx.fill();
      ctx.restore();
    }

    // Halo de influência (aid visual de debug; remova em prod)
    ctx.save();
    ctx.beginPath();
    ctx.arc(bn.cx, bn.cy, bn.raio * 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function blackHoleReset() {
  bhState.buracos = [];
}
