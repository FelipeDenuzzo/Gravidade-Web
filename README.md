# Gravidade Web

Versão web do jogo **Gravidade** (iOS → browser).

🎮 **[Jogar agora](https://felipedenuzzo.github.io/Gravidade-Web/)**

---

## Estrutura

```
Gravidade-Web/
├── index.html          # Entry point
├── style.css           # Layout e componentes visuais
├── assets/             # Imagens e vídeos (ver assets/README.md)
├── js/
│   ├── GameState.js       # Estado global + dificuldade
│   ├── PhaseManager.js    # Configurações das 17 fases
│   ├── Physics.js         # Loop físico (acelerômetro + requestAnimationFrame)
│   ├── MagnetSystem.js    # Magnetos por fase
│   ├── BlackHole.js       # Buraco negro
│   ├── ItemFactory.js     # Tipos e spawning de itens
│   ├── HUD.js             # Tempo, fase, botão sair
│   ├── OverlayManager.js  # Telas de menu, vitória, derrota
│   ├── IntroSystem.js     # Vídeos de transição
│   └── main.js            # Orquestrador principal
└── copiar_assets.sh    # Script para copiar assets do repo iOS
```

## Adicionar os assets

```bash
# Clone ambos os repos lado a lado
git clone https://github.com/FelipeDenuzzo/Gravidade.git
git clone https://github.com/FelipeDenuzzo/Gravidade-Web.git

cd Gravidade-Web
bash copiar_assets.sh

git add assets/
git commit -m "assets: adiciona imagens e vídeos"
git push
```

O deploy é automático via GitHub Actions a cada `git push` na branch `main`.
