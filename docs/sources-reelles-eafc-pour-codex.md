# Sources réelles du Studio Intranet EAFC

## Diagnostic du Studio actuel

Le fichier `Drupal studio.html` ne lit actuellement aucun véritable fichier `.xlsx`.

Les deux causes sont explicites dans le code :

1. La détection des fichiers Excel repose presque uniquement sur le nom du fichier :

```js
if (lower.endsWith('.xlsx') || lower.endsWith('.xls'))
  return lower.includes('recensement') || lower.includes('suivi')
    ? 'recensement_excel'
    : 'demande_modification_excel';
```

Le fichier Sofia-FMO `EAFC Formation Export plan et sessions (66).xlsx` est donc classé à tort comme demande éditoriale.

2. Le parseur XLSX est seulement un stub :

```js
async function parseXlsxDiagnostic(file, type) {
  return {
    rows: [],
    pages: [],
    warnings: [
      'Lecture XLSX structurelle préparée : le parseur complet sera activé avec les fixtures du classeur réel absent du dépôt.'
    ]
  };
}
```

Par conséquent, tous les fichiers Excel produisent zéro ligne, même lorsque leur type est choisi manuellement.

La correction doit conserver l'interface actuelle du Studio, mais remplacer ce faux parseur par une lecture XLSX réelle.

---

# Correspondance exacte entre les fichiers et les sources

## 1. JSON OVP

### Fichier réel

`plan_emi_26_27_rdv_12_06_deploiement.ovp(1).json`

### Type interne attendu

`json_ovp`

### Signature de détection fiable

Le JSON contient :

```json
{
  "version": "1.0",
  "plan": {
    "title": "Plan EMI 26-27 RDV 12/06",
    "courses": []
  }
}
```

La détection doit reposer sur :

```js
obj?.plan && Array.isArray(obj.plan.courses)
```

et non uniquement sur le nom ou l’extension.

### Structure d'un parcours

```json
{
  "id": "aed879c8-6c62-417b-b666-425de0145427",
  "title": "EMI - SA- Réseaux sociaux et santé mentale",
  "presentiel": 6,
  "distanciel": 3,
  "sessionsPresentiel": 1,
  "sessionsDistanciel": 1,
  "effectif": 40,
  "dureeTotale": 9,
  "niveauDeploiement": "Bi départemental",
  "priorite": "Haute",
  "typeCandidature": "Candidature individuelle",
  "meta": {
    "objectif": "Découvrir les enjeux...",
    "contenu": "Conférence, table ronde et ateliers...",
    "accessibilite": "",
    "prerequis": "Aucun",
    "publicConcerne": "",
    "datesLieux": "02 Novembre 2026",
    "contact": "Responsable de formation..."
  }
}
```

### Mapping obligatoire

| Champ Studio | Chemin JSON |
|---|---|
| ID intention | `course.id` |
| Titre | `course.title` |
| Objectif | `course.meta.objectif` |
| Contenu | `course.meta.contenu` |
| Accessibilité | `course.meta.accessibilite` |
| Prérequis | `course.meta.prerequis` |
| Public éditorial | `course.meta.publicConcerne` |
| Contact | `course.meta.contact` |
| Dates et lieux indicatifs | `course.meta.datesLieux` |
| Effectif | `course.effectif` |
| Présentiel | `course.presentiel` |
| Distanciel | `course.distanciel` |
| Durée totale | `course.dureeTotale` |
| Nombre de sessions présentielles | `course.sessionsPresentiel` |
| Nombre de sessions distancielles | `course.sessionsDistanciel` |
| Niveau de déploiement | `course.niveauDeploiement` |
| Type de candidature | `course.typeCandidature` |

Attention : dans ce fichier réel, `sessionsPresentiel` et `sessionsDistanciel` sont des nombres, pas toujours des tableaux.

---

## 2. Recensement Drupal

### Fichier réel

`260717_Suivi_parcours_intranet_VF_colonne_subdivisee(1)(5).xlsx`

### Type interne attendu

`recensement_excel`

### Structure du classeur

Le classeur contient 14 feuilles :

- deux feuilles de synthèse ;
- douze feuilles de données nommées `T1_...` à `T12_...`.

Les feuilles de synthèse ne doivent pas être importées comme pages Drupal.

Une feuille de données doit être reconnue par la présence simultanée de colonnes comme :

- `Statut`
- `Node ID Drupal`
- `Lien de la page`
- `Titre`
- `Chapo`
- `Objectif général du parcours`
- `Contenu de la formation`
- `Accessibilité de la formation`
- `Mise en place de la formation`
- `Effectif :`
- `Durée totale du parcours :`
- `Durée du présentiel`
- `Durée du distanciel :`
- `Public concerné :`
- `Prérequis du parcours :`
- `Contact de la formation`
- `Thématiques saisies`
- `Métiers`
- `Départements`
- `Début préinscription`
- `Dépublication`
- `Identifiant parcours export`
- `Source OVP`
- `Plan`
- `Date export`

### Rôle

Ce fichier représente l’état actuel des pages Drupal.

Il fournit notamment :

- le `Node ID Drupal`, clé principale de toute mise à jour ;
- l’URL Drupal ;
- le titre réel de la page ;
- le contenu actuellement publié ;
- les thématiques actuelles ;
- les métiers/publics actuels ;
- l’identifiant OVP source ;
- le département ou la déclinaison départementale.

### Règles d'import

- Parcourir toutes les feuilles.
- Ignorer les feuilles ne contenant pas `Node ID Drupal`, `Lien de la page` et `Titre`.
- Conserver le nom de la feuille et le numéro de ligne dans `excelOrigin`.
- Ne pas fusionner les déclinaisons départementales ayant des Node ID différents.
- Le Node ID doit être conservé comme chaîne de caractères.
- Les titres `16 -`, `17 -`, `79 -`, `86 -`, `16/17 -` ou `79/86 -` restent distincts comme cibles Drupal, même si leur titre normalisé est identique.

### Mapping obligatoire

| Champ Studio | Colonne |
|---|---|
| Node ID | `Node ID Drupal` |
| URL Drupal | `Lien de la page` |
| Titre Drupal | `Titre` |
| Chapo | `Chapo` |
| Objectif actuel | `Objectif général du parcours` |
| Contenu actuel | `Contenu de la formation` |
| Accessibilité actuelle | `Accessibilité de la formation` |
| Mise en place actuelle | `Mise en place de la formation` |
| Effectif actuel | `Effectif :` |
| Durée totale actuelle | `Durée totale du parcours :` |
| Présentiel actuel | `Durée du présentiel` |
| Distanciel actuel | `Durée du distanciel :` |
| Public éditorial actuel | `Public concerné :` |
| Prérequis actuels | `Prérequis du parcours :` |
| Contact actuel | `Contact de la formation` |
| Thématiques actuelles | `Thématiques saisies` |
| Métiers/publics actuels | `Métiers` |
| Départements | `Départements` |
| Identifiant OVP | `Source OVP` |
| Identifiant export | `Identifiant parcours export` |

---

## 3. Excel des demandes éditoriales

### Fichier réel

`plan_emi_26_27_rdv_12_06_export.xlsx`

### Type interne attendu

`demande_modification_excel`

### Feuille réelle

`Plan EMI 26-27 RDV 12 06`

### En-têtes réels

- `Dispositif code`
- `ID intention`
- `Titre du parcours`
- `Parcours composés liés`
- `Objectif général`
- `Contenu`
- `Accessibilité`
- `Prérequis`
- `Public concerné`
- `Mise en place`
- `Dates & lieux envisagés`
- `Contact`
- `Type de candidature`
- `Priorité`
- `Effectif (nb)`
- `Présentiel (h)`
- `Distanciel (h)`
- `Nb sessions présentiel`
- `Nb sessions distanciel`
- `Durée totale (h)`
- `Nb intervenants extérieurs`

### Rôle

Ce fichier sert uniquement à demander des modifications éditoriales sur des pages Drupal existantes.

Les champs autorisés sont :

- titre ;
- objectif ;
- contenu ;
- accessibilité ;
- mise en place ;
- effectif ;
- durée totale ;
- présentiel ;
- distanciel ;
- public éditorial ;
- prérequis ;
- contact.

### Colonnes à utiliser

| Champ éditorial | Colonne |
|---|---|
| Identifiant de rapprochement | `ID intention` |
| Code dispositif secondaire | `Dispositif code` |
| Titre demandé | `Titre du parcours` |
| Objectif demandé | `Objectif général` |
| Contenu demandé | `Contenu` |
| Accessibilité demandée | `Accessibilité` |
| Prérequis demandés | `Prérequis` |
| Public éditorial demandé | `Public concerné` |
| Mise en place demandée | `Mise en place` |
| Contact demandé | `Contact` |
| Effectif demandé | `Effectif (nb)` |
| Présentiel demandé | `Présentiel (h)` |
| Distanciel demandé | `Distanciel (h)` |
| Durée totale demandée | `Durée totale (h)` |

### Colonnes présentes mais non utilisées dans ce workflow

- `Dates & lieux envisagés`
- `Type de candidature`
- `Priorité`
- `Nb sessions présentiel`
- `Nb sessions distanciel`
- `Nb intervenants extérieurs`
- `Parcours composés liés`

Elles peuvent être affichées comme contexte, mais ne doivent pas générer d’opérations Drupal dans le workflow éditorial.

### Règles importantes

- Une cellule vide signifie : ne pas modifier.
- Une suppression nécessite un marqueur explicite.
- Une valeur comme `23` est une vraie demande saisie dans la cellule et ne doit pas être interprétée comme vide.
- La correspondance principale se fait entre `ID intention` et la colonne `Source OVP` du recensement.
- Ensuite seulement : code dispositif et titre normalisé.
- Les préfixes départementaux du recensement doivent être ignorés pour comparer les titres, mais chaque déclinaison départementale garde son propre Node ID.

---

## 4. Export Sofia-FMO plan et sessions

### Fichier réel

`EAFC Formation Export plan et sessions (66).xlsx`

### Type interne attendu

`plan_sessions_sofia`

### Feuille réelle

`Liste des dispositifs`

### En-têtes caractéristiques obligatoires

La détection doit reconnaître ce type par la présence d’un ensemble de colonnes, et non uniquement par le nom :

- `Dispositif : code`
- `Dispositif : libellé`
- `Module : code`
- `Module : libellé`
- `Groupe : identifiant`
- `Groupe : libellé`
- `Session`
- `Début`
- `Fin`
- `Durée`
- `Modalité`
- `UAI`
- `Lieu`
- `Préinscriptions : Préinscrits : nombre maximal`
- `Préinscriptions : Préinscrits : nombre total`
- `Préinscriptions : Publication : début`
- `Préinscriptions : Publication : fin`
- `Préinscriptions : Publication : lien préinscription`

### Rôle exclusif

Ce fichier sert à mettre à jour :

- les dates ;
- les horaires ;
- les modalités ;
- les lieux ;
- le nombre maximal de places ;
- le nombre de préinscrits ;
- les places restantes ;
- la date de début de publication ;
- la date de fin de publication ;
- le lien de préinscription.

Il ne doit jamais modifier les champs éditoriaux, les thématiques ou les publics/métiers.

### Particularité essentielle

Une même combinaison dispositif/module/groupe peut avoir plusieurs lignes de sessions.

Exemple réel :

- même dispositif ;
- même module ;
- même groupe ;
- une session présentielle ;
- une session à distance ;
- une autre session présentielle dans un second lieu.

Il faut donc regrouper les lignes pertinentes et ne jamais prendre arbitrairement la première ligne.

### Conversion des dates Excel

Les colonnes `Début`, `Fin`, dates de publication et date de statut peuvent être stockées comme nombres Excel, par exemple :

```text
46260.25
```

Le parseur doit convertir les numéros de série Excel en dates et heures réelles.

La partie décimale représente l’heure.

### Calcul des places restantes

```text
places restantes = nombre maximal - nombre total
```

- calculer seulement lorsque les deux valeurs sont numériques ;
- ne pas transformer les cellules vides en zéro ;
- signaler une valeur négative ;
- ne pas confondre `Nombre de stagiaires` avec les préinscriptions.

---

# Détection de type par contenu

Le type doit être déterminé après lecture des en-têtes.

## Recensement Drupal

Reconnu si une feuille contient au minimum :

```text
Node ID Drupal
Lien de la page
Titre
```

et idéalement :

```text
Thématiques saisies
Métiers
Source OVP
```

## Demande éditoriale

Reconnue si une feuille contient au minimum :

```text
ID intention
Titre du parcours
Objectif général
Contenu
```

## Sofia-FMO plan et sessions

Reconnu si une feuille contient au minimum :

```text
Dispositif : code
Module : code
Groupe : identifiant
Session
Début
Fin
Modalité
UAI
Lieu
```

## Priorité de détection

1. Lire le classeur.
2. Lire les feuilles et les en-têtes.
3. Détecter le type par signatures de colonnes.
4. Utiliser le nom du fichier uniquement comme indice secondaire.
5. Permettre une correction manuelle du type.
6. Lors d’une correction manuelle, reparsing obligatoire du fichier avec le bon adaptateur.

---

# Correction technique obligatoire dans le Studio

Conserver l’interface et l’apparence du Studio actuel.

Remplacer complètement :

```js
parseXlsxDiagnostic()
```

par un vrai parseur XLSX côté navigateur.

Le parseur doit au minimum :

- ouvrir le ZIP XLSX ;
- lire `xl/workbook.xml` ;
- lire les relations des feuilles ;
- lire `sharedStrings.xml` ;
- lire les cellules inline et numériques ;
- lire les formules sans les exécuter ;
- conserver les noms et l’ordre des feuilles ;
- conserver le numéro de ligne d’origine ;
- identifier la vraie ligne d’en-têtes ;
- convertir les lignes en objets ;
- convertir les dates Excel pour les colonnes de dates Sofia ;
- retourner de vraies valeurs dans `rows`, `pages`, `workbook` et `diagnostics`.

Réutiliser si possible le parseur structurel déjà présent dans l’ancienne version de `studio-intranet-eafc-v2.html` ou dans les sources antérieures du dépôt, plutôt que de recréer un stub.

Après import :

- le recensement doit produire plusieurs centaines de pages, réparties sur les feuilles `T1_...` à `T12_...` ;
- l’Excel éditorial fourni doit produire 10 demandes ;
- l’export Sofia-FMO fourni doit produire 3 lignes ;
- le JSON OVP fourni doit produire 10 parcours.

Le nombre exact de lignes Sofia dépend du fichier de test fourni ici : la feuille contient un en-tête et trois lignes de données.

---

# Tests d’acceptation obligatoires

## Test 1 — JSON OVP

- Importer `plan_emi_26_27_rdv_12_06_deploiement.ovp(1).json`.
- Détecter `json_ovp`.
- Importer 10 parcours.
- Lire les données dans `course.meta`.
- Ne pas supposer que les compteurs de sessions sont des tableaux.

## Test 2 — recensement

- Importer `260717_Suivi_parcours_intranet_VF_colonne_subdivisee(1)(5).xlsx`.
- Détecter `recensement_excel`.
- Ignorer les deux feuilles de synthèse.
- Importer les lignes des feuilles `T1_...` à `T12_...`.
- Conserver chaque Node ID.
- Conserver le nom de feuille et le numéro de ligne.

## Test 3 — demande éditoriale

- Importer `plan_emi_26_27_rdv_12_06_export.xlsx`.
- Détecter `demande_modification_excel`.
- Importer 10 demandes.
- Utiliser `ID intention` pour les rapprocher de `Source OVP`.
- Générer uniquement les champs éditoriaux autorisés.
- Ignorer les cellules vides.
- Ne pas générer de dates, lieux, liens, thématiques ou métiers.

## Test 4 — Sofia-FMO

- Importer `EAFC Formation Export plan et sessions (66).xlsx`.
- Détecter `plan_sessions_sofia`, malgré l’absence du mot `Sofia` au début du nom.
- Importer 3 lignes.
- Convertir les dates Excel.
- Regrouper les lignes partageant dispositif/module/groupe.
- Conserver chaque session, modalité et lieu.
- Générer uniquement les champs Sofia autorisés.

## Test 5 — changement manuel de type

- Importer un Excel volontairement mal nommé.
- Changer son type dans l’interface.
- Reparser réellement le fichier.
- Mettre à jour les lignes, pages et diagnostics.
- Ne pas seulement changer le libellé affiché.

---

# Résultat attendu

Le Studio ne doit plus afficher :

```text
Lecture XLSX structurelle préparée
le parseur complet sera activé
fixtures du classeur réel absent
```

Ces phrases sont fausses puisque les structures réelles sont désormais documentées.

Aucun fichier Excel valide ne doit retourner silencieusement :

```js
rows: []
pages: []
```
