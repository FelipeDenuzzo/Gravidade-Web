// =============================================================
// PhaseManager.js
// Equivalente a: FaseConfig, AzulExtraConfig, ObstaculosConfig,
//   BuracoNegroConfig, GanhaTempoRepulsaoConfig,
//   PhaseCatalog, AutoPhaseFactory, AutoPhaseGroup (Swift)
//
// Todos os valores são lidos diretamente dos arquivos Swift
// originais do repo FelipeDenuzzo/Gravidade.
// =============================================================

'use strict';

// -------------------------------------------------------------
// Helpers de config (equivale aos structs de models do Swift)
// -------------------------------------------------------------

function obstaculosConfig({
  incluirDireito = false,
  incluirEsquerdo = false,
  incluirInferior = false,
  incluirSuperior = false,
  tamanhoMultiplicador = 1.0,
  forcaMultiplicador = 1.0,
} = {}) {
  return { incluirDireito, incluirEsquerdo, incluirInferior, incluirSuperior, tamanhoMultiplicador, forcaMultiplicador };
}

function buracoNegroConfig({
  tamanhoMultiplicador = 10,
  forcaMinima = 0.6,
  forcaMaxima = 2.8,
  quantidade = 1,
  centroYRelativo = 0.5,
  centroYSuperiorRelativo = null,
} = {}) {
  return { tamanhoMultiplicador, forcaMinima, forcaMaxima, quantidade, centroYRelativo, centroYSuperiorRelativo };
}

function azulExtraConfig({
  quantidade = 1,
  tamanhoMultiplicador = 1.0,
  geraQuatro = false,
  geraOito = false,
  marcarEsferaGrande = false,
  adicionarEmEspeciais = false,
} = {}) {
  return { quantidade, tamanhoMultiplicador, geraQuatro, geraOito, marcarEsferaGrande, adicionarEmEspeciais };
}

function ganhaTempoRepulsao({
  habilitado = false,
  forcaLenta = 0.9,
  raioMultiplicador = 3.0,
} = {}) {
  return { habilitado, forcaLenta, raioMultiplicador };
}

function faseConfig({
  itensLaranja,
  itensAzuis = 0,
  buracoNegro = null,
  obstaculos = null,
  laranjaImpostorQuantidade = 0,
  azulBaseMultiplicador = 1.0,
  azulExtras = [],
  azulGrandeMovel = false,
  azulEspecialImpostor = false,
  azuisFase17 = false,
  falsaLaranjaQuantidade = 0,
  falsaLaranjaAzuisGerados = 2,
  ganhaTempoQuantidade = 0,
  ganhaTempoSegundos = 0,
  ganhaTempoLimiteAparicao = null,
  ganhaTempoRepulsaoConfig = ganhaTempoRepulsao(),
  perdeTempoQuantidade = 0,
  perdeTempoSegundos = 0,
} = {}) {
  return {
    itensLaranja, itensAzuis, buracoNegro, obstaculos,
    laranjaImpostorQuantidade, azulBaseMultiplicador, azulExtras,
    azulGrandeMovel, azulEspecialImpostor, azuisFase17,
    falsaLaranjaQuantidade, falsaLaranjaAzuisGerados,
    ganhaTempoQuantidade, ganhaTempoSegundos, ganhaTempoLimiteAparicao,
    ganhaTempoRepulsao: ganhaTempoRepulsaoConfig,
    perdeTempoQuantidade, perdeTempoSegundos,
  };
}

// -------------------------------------------------------------
// Fases manuais 1–17, 23, 29, 35 (PhaseCatalog.manualConfigs)
// -------------------------------------------------------------

const FASES_MANUAIS = {

  // Fases 1–5: progressão simples de laranjas
  1:  faseConfig({ itensLaranja: 2 }),
  2:  faseConfig({ itensLaranja: 4 }),
  3:  faseConfig({ itensLaranja: 6 }),
  4:  faseConfig({ itensLaranja: 8 }),
  5:  faseConfig({ itensLaranja: 10 }),

  // Fase 6 — falsa laranja, ganha/perde tempo, azuis extras geraOito
  6: faseConfig({
    itensLaranja: 10,
    itensAzuis: 2,
    azulBaseMultiplicador: 4.0,
    falsaLaranjaQuantidade: 1,
    falsaLaranjaAzuisGerados: 3,
    ganhaTempoQuantidade: 1,
    ganhaTempoSegundos: 8,
    ganhaTempoLimiteAparicao: 1,
    ganhaTempoRepulsaoConfig: ganhaTempoRepulsao({ habilitado: true, forcaLenta: 1.0, raioMultiplicador: 3.4 }),
    perdeTempoQuantidade: 1,
    perdeTempoSegundos: 5,
    azulExtras: [
      azulExtraConfig({ quantidade: 2, tamanhoMultiplicador: 1.0, geraOito: true }),
    ],
  }),

  // Fase 7 — magneto direito, esfera azul grande×4 (esferaGrande, geraQuatro)
  7: faseConfig({
    itensLaranja: 12,
    itensAzuis: 2,
    obstaculos: obstaculosConfig({ incluirDireito: true, tamanhoMultiplicador: 1.0, forcaMultiplicador: 1.0 }),
    azulExtras: [
      azulExtraConfig({ quantidade: 2, tamanhoMultiplicador: 4.0, geraQuatro: true, marcarEsferaGrande: true, adicionarEmEspeciais: true }),
    ],
  }),

  // Fase 8 — magneto forte direito, azul gigante×8 (movível), 2 falsas, ganha/perde tempo
  8: faseConfig({
    itensLaranja: 14,
    itensAzuis: 3,
    obstaculos: obstaculosConfig({ incluirDireito: true, tamanhoMultiplicador: 1.0, forcaMultiplicador: 2.0 }),
    azulExtras: [
      azulExtraConfig({ quantidade: 1, tamanhoMultiplicador: 8.0, geraOito: true, marcarEsferaGrande: true }),
    ],
    falsaLaranjaQuantidade: 2,
    falsaLaranjaAzuisGerados: 2,
    ganhaTempoQuantidade: 2,
    ganhaTempoSegundos: 6,
    ganhaTempoLimiteAparicao: 1,
    ganhaTempoRepulsaoConfig: ganhaTempoRepulsao({ habilitado: true, forcaLenta: 0.8, raioMultiplicador: 3.0 }),
    perdeTempoQuantidade: 1,
    perdeTempoSegundos: 4,
  }),

  // Fase 9 — magnetos esquerdo+direito, 18 laranjas, 4 azuis
  9: faseConfig({
    itensLaranja: 18,
    itensAzuis: 4,
    obstaculos: obstaculosConfig({ incluirDireito: true, incluirEsquerdo: true, tamanhoMultiplicador: 1.0, forcaMultiplicador: 2.0 }),
  }),

  // Fase 10 — magneto direito, impostoras, azulEspecialImpostor
  10: faseConfig({
    itensLaranja: 18,
    itensAzuis: 4,
    obstaculos: obstaculosConfig({ incluirDireito: true, tamanhoMultiplicador: 1.0, forcaMultiplicador: 2.0 }),
    laranjaImpostorQuantidade: 2,
    azulEspecialImpostor: true,
  }),

  // Fase 11 — magneto grande direito (×2), impostoras
  11: faseConfig({
    itensLaranja: 18,
    itensAzuis: 4,
    obstaculos: obstaculosConfig({ incluirDireito: true, tamanhoMultiplicador: 2.0, forcaMultiplicador: 2.0 }),
    laranjaImpostorQuantidade: 2,
    azulEspecialImpostor: true,
  }),

  // Fase 12 — magneto grande direito+inferior, impostoras
  12: faseConfig({
    itensLaranja: 18,
    itensAzuis: 4,
    obstaculos: obstaculosConfig({ incluirDireito: true, incluirInferior: true, tamanhoMultiplicador: 2.0, forcaMultiplicador: 2.0 }),
    laranjaImpostorQuantidade: 2,
    azulEspecialImpostor: true,
  }),

  // Fase 13 — magnetos inferior+superior, 6 azuis
  13: faseConfig({
    itensLaranja: 18,
    itensAzuis: 6,
    obstaculos: obstaculosConfig({ incluirInferior: true, incluirSuperior: true, tamanhoMultiplicador: 2.0, forcaMultiplicador: 2.0 }),
  }),

  // Fase 14 — 1 buraco negro central
  14: faseConfig({
    itensLaranja: 18,
    itensAzuis: 4,
    buracoNegro: buracoNegroConfig({ tamanhoMultiplicador: 10, forcaMinima: 0.6, forcaMaxima: 2.8, quantidade: 1, centroYRelativo: 0.5 }),
  }),

  // Fase 15 — 1 buraco negro forte (inferior)
  15: faseConfig({
    itensLaranja: 18,
    itensAzuis: 6,
    buracoNegro: buracoNegroConfig({ tamanhoMultiplicador: 12, forcaMinima: 0.6, forcaMaxima: 3.8, quantidade: 1, centroYRelativo: 0.75 }),
  }),

  // Fase 16 — 2 buracos negros (superior + inferior)
  16: faseConfig({
    itensLaranja: 18,
    itensAzuis: 8,
    buracoNegro: buracoNegroConfig({ tamanhoMultiplicador: 10, forcaMinima: 0.6, forcaMaxima: 2.8, quantidade: 2, centroYRelativo: 0.75, centroYSuperiorRelativo: 0.25 }),
  }),

  // Fase 17 — modo especial: azuis crescem e têm gravidade invertida
  17: faseConfig({ itensLaranja: 18, itensAzuis: 8, azuisFase17: true }),

  // Fase 23, 29, 35 — placeholders (só esfera vermelha, sem itens)
  23: faseConfig({ itensLaranja: 0, itensAzuis: 0 }),
  29: faseConfig({ itensLaranja: 0, itensAzuis: 0 }),
  35: faseConfig({ itensLaranja: 0, itensAzuis: 0 }),
};

// -------------------------------------------------------------
// Fases automáticas (AutoPhaseFactory + AutoPhaseGroup)
// Grupos: 18-22 | 24-28 | 30-34
// -------------------------------------------------------------

function buildImpostoraComMagneto(index) {
  const itensLaranja    = 16 + (index * 2);
  const itensAzuis      = 2  + Math.floor(index / 2);
  const impostoras      = Math.min(6 + (index * 2), itensLaranja);
  const forcaMagneto    = 1.1 + (index * 0.2);

  return faseConfig({
    itensLaranja,
    itensAzuis,
    obstaculos: obstaculosConfig({ incluirDireito: true, tamanhoMultiplicador: 1.1, forcaMultiplicador: forcaMagneto }),
    laranjaImpostorQuantidade: impostoras,
  });
}

function buildTempoComAzuisGrandesMoveis(index) {
  const itensLaranja   = 14 + index;
  const itensAzuis     = 3  + index;
  const ganhaQuantidade = 1 + Math.floor(index / 2);
  const perdeQuantidade = 1 + Math.floor(index / 2);
  const perdeSegundos  = 3  + index;

  return faseConfig({
    itensLaranja,
    itensAzuis,
    azulExtras: [
      azulExtraConfig({ quantidade: 1, tamanhoMultiplicador: 6.0 + index, geraOito: true, marcarEsferaGrande: true }),
    ],
    azulGrandeMovel: true,
    ganhaTempoQuantidade: ganhaQuantidade,
    ganhaTempoSegundos: 4,
    ganhaTempoLimiteAparicao: 1,
    ganhaTempoRepulsaoConfig: ganhaTempoRepulsao({ habilitado: true, forcaLenta: 0.85, raioMultiplicador: 3.0 }),
    perdeTempoQuantidade: perdeQuantidade,
    perdeTempoSegundos: perdeSegundos,
  });
}

function buildLaranjasComBuracoNegro(index) {
  const itensLaranja   = 20 + (index * 2);
  const itensAzuis     = 2  + Math.floor(index / 2);
  const perdeQuantidade = 1 + Math.floor(index / 2);
  const forcaMaxima    = 2.9 + (index * 0.25);

  return faseConfig({
    itensLaranja,
    itensAzuis,
    buracoNegro: buracoNegroConfig({ tamanhoMultiplicador: 10, forcaMinima: 0.6, forcaMaxima, quantidade: 1, centroYRelativo: 0.5 }),
    perdeTempoQuantidade: perdeQuantidade,
    perdeTempoSegundos: 4 + index,
  });
}

function autoConfig(fase) {
  if (fase >= 18 && fase <= 22) return buildImpostoraComMagneto(fase - 18);
  if (fase >= 24 && fase <= 28) return buildTempoComAzuisGrandesMoveis(fase - 24);
  if (fase >= 30 && fase <= 34) return buildLaranjasComBuracoNegro(fase - 30);
  return null;
}

// -------------------------------------------------------------
// API pública — getConfig(fase) equivale a PhaseManager.config(for:)
// -------------------------------------------------------------

function getConfig(fase) {
  return FASES_MANUAIS[fase] ?? autoConfig(fase) ?? faseConfig({ itensLaranja: 2 });
}

const NUMERO_MAXIMO_FASES = 35;
