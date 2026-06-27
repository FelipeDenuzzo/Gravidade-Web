# assets/

Esta pasta contém todos os arquivos de mídia do jogo.
Os arquivos estão no repo Swift original (`FelipeDenuzzo/Gravidade`) e
devem ser copiados para cá com o script abaixo.

---

## Mapa de assets (origem → destino)

| Arquivo destino (`assets/`) | Origem em `Gravidade/Lab_gravidade iOS/` | Usado por |
|---|---|---|
| `esfera_vermelha.png` | `esfera_vermelha.png` | Jogador |
| `esfera_laranja.png`  | `esfera_laranja.png`  | Laranja normal / impostor |
| `esfera_azul.png`     | `esfera_azul.png`     | Azuis |
| `falsa.png`           | `falsa.png`           | Laranja falsa |
| `ganhatempo.png`      | `ganhatempo.png`      | Bônus de tempo |
| `perdetempo.png`      | `perdetempo.png`      | Penalidade de tempo |
| `imamG.png`           | `imamG.png`           | Magneto grande |
| `imamP.png`           | `imamP.png`           | Magneto pequeno |
| `magneto_grandelateraldireito.png` | `magneto_grandelateraldireito.png` | MagnetSystem fallback |
| `magneto_inferior.png`            | `magneto_inferior.png`            | MagnetSystem fallback |
| `magneto_inferioresuperior.png`   | `magneto_inferioresuperior.png`   | MagnetSystem fallback |
| `bn0.png`             | `bn0.png`             | Buraco negro |
| `fundo.jpg`           | `fundo.jpg`           | Background genérico |
| `icone.png`           | `icone.png`           | Favicon / ícone web |
| `transivitoria.mp4`   | `transivitoria.mp4`   | Vídeo de vitória (todas as fases) |
| `transiderrota.mp4`   | `transiderrota.mp4`   | Vídeo de derrota / fim de tempo |

### Backgrounds por fase (opcionais)
Se não existirem, o jogo usa fundo sólido `#0a0a14`.

| Arquivo destino | Descrição |
|---|---|
| `bg_fase1.png` … `bg_fase17.png` | Fundo de cada fase |

---

## Script de cópia automática

Salve como `copiar_assets.sh` na raiz do projeto e execute uma vez:

```bash
#!/usr/bin/env bash
# Executa na raiz de Gravidade-Web/
# Exige que o repo Gravidade esteja clonado lado a lado:
#   ../Gravidade/

SRC="../Gravidade/Lab_gravidade iOS"
DST="./assets"

mkdir -p "$DST"

ARQUIVOS=(
  "esfera_vermelha.png"
  "esfera_azul.png"
  "esfera_laranja.png"
  "falsa.png"
  "ganhatempo.png"
  "perdetempo.png"
  "imamG.png"
  "imamP.png"
  "magneto_grandelateraldireito.png"
  "magneto_inferior.png"
  "magneto_inferioresuperior.png"
  "bn0.png"
  "fundo.jpg"
  "icone.png"
  "transivitoria.mp4"
  "transiderrota.mp4"
)

for f in "${ARQUIVOS[@]}"; do
  cp -v "$SRC/$f" "$DST/$f"
done

echo "✅ Assets copiados para $DST"
```

> **Após copiar:** faça `git add assets/ && git commit -m "assets: adiciona imagens e vídeos"`

---

## Checklist rápido

Rodando no browser, abra o DevTools (F12) → aba Network.
Qualquer `404` na coluna Name indica um asset faltando.
Todos os sistemas têm **fallback visual** — o jogo funciona mesmo sem os PNGs,
apenas com cores sólidas no lugar das imagens.
