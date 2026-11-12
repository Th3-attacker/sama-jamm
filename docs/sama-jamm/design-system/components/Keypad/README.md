# Keypad

Pavé numérique intégré pour saisir un montant d'un pouce, sans le clavier du téléphone.

- **Le consommateur fournit** : `onTouche` ('0'…'9', '000', 'efface').
- Touches de 56 de haut, fond `surface`, chiffres 24 gras ; la touche « effacer » est sans fond.
- « 000 » accélère les montants en F CFA et en ouguiyas ; pas de virgule si la devise n'a pas de décimales.
- Retour haptique léger à chaque touche (désactivable dans les réglages).
- Toujours avec `AmountDisplay` en mode `saisie` au-dessus.
