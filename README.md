# OLEN OS

Système d'exploitation interne OLEN. Un shell, plusieurs modules.
Aujourd'hui un seul module est construit : **Creative OS**.

Ce n'est pas un tableau de bord de consultation. C'est l'outil de travail
quotidien d'une seule personne, qui doit trancher sur trente créatives le lundi
matin avec de l'argent réel en jeu.

---

## Démarrer

Node 24 requis. Aucun Node n'était installé sur cette machine et
`/usr/local/bin` n'est pas accessible en écriture : une copie autonome a donc
été posée dans `~/.mzos-tools/node`. Ajoute-la au PATH de la session :

```bash
export PATH="$HOME/.mzos-tools/node/bin:$PATH"
```

Pour la rendre permanente, ajoute cette ligne à `~/.zshrc` (je n'ai pas modifié
ton profil). Si tu installes Node autrement (nvm, Homebrew), le dossier
`~/.mzos-tools` peut être supprimé.

```bash
npm install
npx prisma migrate dev     # crée dev.db et applique le schéma
npm run db:seed            # 12 périodes commerciales + les 3 offres de référence
npm run dev                # http://localhost:3000
```

Jeu de démonstration facultatif (19 créatives, 14 accroches, 35 semaines) :

```bash
npx tsx prisma/seed-demo.ts            # insérer
npx tsx prisma/seed-demo.ts --clear    # retirer
```

### Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et exécution en production |
| `npm test` | tests unitaires (94) |
| `npm run typecheck` | TypeScript strict, sans émission |
| `npm run db:migrate` | créer et appliquer une migration |
| `npm run db:seed` | données de départ |
| `npm run db:studio` | inspecter la base |

---

## Ce qui décide de tout

Trois seuils de ROAS, dérivés de **l'offre active** à chaque calcul, jamais
stockés sur une créative. Changer un prix reclasse instantanément toute la
librairie.

```
contribution  = prix / (1 + TVA) × (1 − PSP − autres frais) − COGS
roasBreakEven = prix / contribution
roasMinMargin = prix / (contribution − margeMini × prix)
roasTarget    = prix / (contribution − margeCible × prix)
```

Un dénominateur ≤ 0 renvoie `null` et l'interface affiche « marge inatteignable
à ce prix ». Jamais `Infinity`.

Les trois offres de référence du cahier des charges sont vérifiées par test :

| Offre | BE | Min | Cible |
|---|---|---|---|
| 1 | 1.29 | 1.61 | 1.75 |
| 2 | 1.35 | 1.70 | 1.86 |
| 3 | 1.34 | 1.67 | 1.82 |

Si ces tests tombent, tout le reste de l'app est faux — c'est le portail de
tout le reste.

### Verdict

Ordre impératif, appliqué sur les cumuls de la créative :

```
spend < 30 €          → TEST_EN_COURS
roas ≥ cible          → WINNER
roas ≥ marge mini     → GARDER
roas ≥ break-even     → SOUS_MARGE
spend ≥ 60 €          → KILL
sinon                 → SURVEILLER
```

`SOUS_MARGE` est le cran qui compte : rentable mais insuffisant, ni tuer ni
scaler.

---

## Architecture

```
app/(os)/            shell commun : sidebar, topbar, ⌘K
  creative/          le module (9 vues)
  strategy/ finance/ supply/    placeholders « bientôt »
modules/registry.ts  déclaration des modules → pilote la sidebar et ⌘K
lib/                 logique métier pure, testée
  economics.ts       les trois seuils
  verdict.ts         la cascade
  derive.ts          isoWeek, metaName, codes hiérarchiques
  lineage.ts         l'arbre de descendance
  scoreboard.ts      agrégations + seuil de significativité
  paste-import.ts    lecture d'un export Meta collé
  simulator.ts       funnel + diagnostic écrit
  actions/           server actions (écritures)
prisma/              schéma, migrations, seeds
```

**Ajouter un module** = ajouter un objet dans `modules/registry.ts` et créer un
dossier sous `app/(os)/`. Rien d'autre : la sidebar, le fil d'ariane et ⌘K le
prennent en compte automatiquement.

---

## Décisions qui ne sont pas négociables dans le code

- **Le nom Meta est calculé, jamais saisi.** Il n'existe aucun champ de saisie
  pour lui, seulement un bouton copier. Renommer une annonce en diffusion
  remet son apprentissage à zéro : `legacyMetaName` fait le pont avec
  l'existant, la nouvelle nomenclature ne s'applique qu'aux créatives à venir.
- **Une hypothèse est obligatoire** à la création d'un élément de production.
  Le formulaire refuse, il ne tolère pas. Un test sans hypothèse écrite
  n'apprend rien.
- **Une semaine déjà saisie s'ouvre en lecture seule.** On n'écrase jamais
  l'historique par inadvertance ; « Corriger » est un geste explicite.
- **Sous le seuil de significativité (150 € cumulés), une ligne d'enseignement
  est grisée, badgée « données insuffisantes » et exclue du tri.** Sans ça,
  l'écran fabrique des conclusions à partir de bruit.
- **`26W00` est réservé** à l'historique importé en cumulé : exclu des courbes
  hebdomadaires, compté dans les cumuls et donc dans les verdicts.
- **Deux différences vis-à-vis du parent = test invalide**, signalé en rouge sur
  la fiche. Aucun résultat ne peut être attribué à l'un plutôt qu'à l'autre.

---

## Direction artistique

Salle de contrôle, pas tableau de bord d'investisseur.

- Dark par défaut, fond très sombre légèrement bleuté, deux niveaux de surface.
- **Un seul accent**, réservé aux actions primaires et à l'état actif.
- Les six verdicts sont le seul endroit où la couleur porte de l'information.
  Leur échelle est une progression continue **froid → chaud** (capital mort →
  capital qui compose), pas trois catégories rouge/orange/vert.
- **Monospace pour tous les chiffres et tous les codes.** Ce n'est pas
  décoratif : ça aligne les colonnes et rend `C01.2.1` et `26W33` lisibles d'un
  coup d'œil.
- Les chiffres restent petits et tabulaires : ils se comparent entre eux.
- **Élément signature :** le fil de généalogie, tracé partout où une créative
  apparaît. C'est le seul endroit où l'interface dépense de l'ambition visuelle.
- Mouvement quasi nul, `prefers-reduced-motion` respecté partout.

Le focus est traité par un `outline` défini hors couche Tailwind. C'est
délibéré : la couche `utilities` bat `@layer base`, et l'anneau par défaut de
shadcn (`ring-ring/50`) se résout en ombre transparente dans certains moteurs.
Un outline, lui, se peint toujours.

---

## Vérification

```bash
npm test        # 94 tests
npm run build   # build de production
```

Couvert par les tests : les trois offres de référence, la cascade de verdicts
et ses bornes exactes, les dérivations ISO (y compris les bascules d'année et
les années à 53 semaines), les codes hiérarchiques, l'arbre de lignée, la
lecture d'un export Meta en format européen comme anglo-saxon, la
neutralisation des lignes non significatives et l'invariant de marché.

Vérifié en navigateur : ⌘K trouve une créative par code et une accroche par
verbatim ; le collage d'un export Meta brut remplit la grille ; le changement
d'offre annonce puis applique exactement le même nombre de reclassements ;
84 éléments focusables ont tous un indicateur visible ; aucun défilement
horizontal au niveau de la page à 900 px.

---

## Ce qui n'est volontairement pas construit

Pas d'API Meta — la saisie est manuelle et assumée. Pas de multi-utilisateur,
pas de rôles. Pas d'IA générative. Pas d'export PDF, pas de notifications, pas
de page marketing, pas de tour guidé.

Chaque fonctionnalité ajoutée est une fonctionnalité retirée de la vitesse de
saisie hebdomadaire, qui est la seule chose qui décide si ce produit est
utilisé ou abandonné.
