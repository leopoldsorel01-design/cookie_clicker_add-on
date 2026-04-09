# Cookie Clicker Ultimate Bot & Visual Assistant

Un mod tout-en-un pour Cookie Clicker, doté d'une interface minimaliste, d'un moteur mathématique intelligent (système de ROI) et d'une automatisation robuste des ascensions et des mini-jeux.

## Installation / Injection 

Pour injecter ce bot dans votre partie Cookie Clicker en cours :

1. Ouvrez Cookie Clicker dans votre navigateur.
2. Ouvrez la Console pour Développeurs (F12, puis onglet "Console").
3. Copiez-collez le script suivant puis appuyez sur **Entrée** :

```javascript
fetch('https://raw.githubusercontent.com/leopoldsorel01-design/cookie_clicker_add-on/main/dist/mod.js')
  .then(r => r.text())
  .then(eval);
```



## Fonctionnalités

* **Smart Auto-Buy** : Calcule le ROI (*Payback Period*) exact de chaque bâtiment et amélioration.
* **Anti-Switch Safety** : Contourne le fameux "Bug des Permutateurs". Le bot filtre mathématiquement et via une liste noire tous les interrupteurs (Golden Switch, Saisons, etc.) pour ne jamais détruire votre génération.
* **Auto-Ascend** : State Machine gérant l'achat céleste automatisé et le bypass forcé des popup de confirmation de réincarnation. Fini le bot bloqué au paradis !
* **Mini-jeux (Grimoire & Bourse)** : Utilise les "Force the Hand of Fate" à bon escient et trade le marché en mode loup de Wall Street.
* **UI Moderne** : Menu d'options flottant non-intrusif, s'intégrant au jeu natif sans le transformer en sapin de Noël.

## Développement

Le projet est divisé en modules (`src/`) :
- `core/` : Etat de l'application et Moteur d'économie.
- `bot/` : Architectures d'Ascension et des mini-jeux.
- `ui/` : Menus et patch des Tooltips natifs.

Pour construire le projet depuis les sources (concatène et enveloppe les modules dans une closure de production) :
```bash
python3 build.py
```
Le code compilé sortira dans `dist/mod.js`.
