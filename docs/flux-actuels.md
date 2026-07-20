# Cartographie des flux actuels

```mermaid
flowchart LR
OVP[JSON OVP] --> MIG[Migration v7]
OVP --> CRE[TM création]
CRE --> DRU[Drupal]
DRU --> RCRE[Rapport création Node ID/URL]
RCRE --> XLS[Recensement Excel]
XLS --> MAP[Mapping]
BIR[BI-RANA] --> MAP
SOF[Sofia-FMO] --> MAP
REQ[Demande modification] --> PREV[Prévisualisation]
PREV --> PAY[Payload update]
PAY --> MAJ[TM mise à jour]
MAJ --> RMJ[Rapport update]
RMJ --> XLS
```

## Points de fragilité
- Données recalculées: titres normalisés, préfixes départementaux, sessions, places restantes.
- Données renommées: métiers/publics, thématiques, dispositif/module/groupe, URL/pageUrl.
- Transformations divergentes: HTML CKEditor, dates françaises/ISO, nombres avec unités.
- Duplications: Node ID dans Excel, mapping, rapports et payloads.
- Pertes: provenance cellulaire, formules/validations Excel, correspondances faibles ignorées.
- Mauvais identifiants: titres et titres préfixés départementaux utilisés comme clés de rapprochement.
