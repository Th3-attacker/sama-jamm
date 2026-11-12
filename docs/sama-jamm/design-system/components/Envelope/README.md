# Envelope

Une enveloppe du budget : un poste du foyer, ce qui est dépensé, ce qui reste avant la prochaine paie.

- **Le consommateur fournit** : `nom`, `icone`, `depense`, `plafond`, `devise`, `fixe`, `onClick` (ouvre le détail).
- États calculés : normal, presque plein (≥ 85 %, texte `alerte`), dépassé (texte `erreur`, icône d'alerte, « Dépassé de 3 500 F CFA »), réglé (`fixe` et plein : « Réglé pour ce cycle », jamais une alerte pour un loyer payé).
- Ligne : pastille d'icône, nom, montant dépensé à droite ; barre fine ; « Reste … » à gauche et « sur … » à droite.
- Postes par défaut : Dépense quotidienne, Loyer, Électricité et eau, Transport, Famille et entraide, Sadaqa.
