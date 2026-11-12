# Dons

Sama Jàmm reste gratuite et sans publicité ; elle vit de dons libres. L'app n'encaisse rien : elle affiche les wallets où envoyer un don (Bankily, Masrvi, Wave…), l'utilisateur envoie depuis son propre wallet, puis déclare le numéro de transaction pour être remercié. Un don ne débloque jamais rien.

## Principes

- **Aucun paiement dans l'app** : pas de bouton « Payer », pas de prélèvement, pas de carte, pas de code secret, pas de numéro de téléphone du donateur.
- **Aucune contrepartie** : tout est gratuit pour tous, donateurs ou non. Rien ne se débloque, rien ne change dans l'app après un don (sinon c'est un achat, soumis aux règles des stores).
- **Discret** : jamais de fenêtre qui interrompt la lecture, la prière ou le dhikr ; jamais de relance. L'entrée est dans le menu Plus (« Soutenir Sama Jàmm ») et dans À propos.
- **Transparent** : l'écran dit à qui va l'argent (titulaire des comptes) et à quoi il sert ; un bilan annuel est publié.
- **Pas de promesse religieuse** : on remercie (« Sant Yàlla. »), on ne promet pas de récompense.

## Parcours

1. **Soutenir** (`plus/soutenir`) : pourquoi donner, en deux phrases ; les wallets du pays de l'utilisateur en premier (selon la devise du budget, sinon la langue et la position), les autres pays repliés plus bas. Choisir un wallet ouvre sa carte : numéro, titulaire, « Copier le numéro ».
2. L'utilisateur ouvre lui-même l'app de son wallet, colle le numéro, envoie le montant qu'il veut, puis revient.
3. **Déclarer** (`plus/soutenir/declarer`), facultatif : wallet utilisé, montant, **numéro de transaction** (obligatoire), prénom et message (facultatifs). « Envoyer la déclaration ».
4. **Merci** (`plus/soutenir/merci`) : « Sant Yàlla. », récapitulatif, statut « En attente de vérification ». Quand l'équipe a vérifié, le statut passe à « Reçu, merci » sur ce téléphone.

Montants suggérés (aide au choix, jamais imposés) : MRU 100, 200, 500 ; F CFA 1 000, 2 000, 5 000 ; ou un autre montant.

## Wallets

Les wallets, numéros et titulaires viennent de la table distante `wallets_dons`, jamais du code : on en ajoute un ou on change un numéro sans nouvelle version. Liste de départ à confirmer avec le titulaire des comptes :

| Pays · devise | Wallets proposés |
| --- | --- |
| Mauritanie · MRU | Bankily, Masrvi, Sedad, [autre wallet] |
| Sénégal · F CFA | Wave, Orange Money, Free Money |

- Monogramme (deux lettres) à la place du logo ; le logo officiel d'un opérateur seulement avec son accord écrit.
- Le titulaire affiché doit être exactement le nom que le wallet montre avant l'envoi, pour que le donateur vérifie qu'il ne se trompe pas.
- Hors ligne : la liste en cache reste visible, avec la date de mise à jour.

## Numéro de transaction

- Champ texte, collé depuis le SMS ou le reçu du wallet ; espaces retirés, lettres en majuscules.
- Contrôle simple : 6 à 30 caractères, lettres et chiffres. Un format propre à chaque wallet peut être ajouté dans `wallets_dons.format_reference` (expression régulière) avec un exemple affiché sous le champ.
- Le même numéro ne peut pas être déclaré deux fois pour le même wallet.
- Erreur : « Ce numéro ne ressemble pas à une référence Bankily. Copiez-le depuis le SMS de confirmation. »

## Données (Supabase)

```sql
CREATE TABLE wallets_dons (
  id text PRIMARY KEY, nom text NOT NULL, pays text NOT NULL, devise text NOT NULL,
  numero text NOT NULL, titulaire text NOT NULL, format_reference text, exemple_reference text,
  ordre int NOT NULL DEFAULT 0, actif boolean NOT NULL DEFAULT true, maj_le timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE dons_declares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id text NOT NULL REFERENCES wallets_dons,
  montant bigint NOT NULL CHECK (montant > 0),      -- plus petite unité de la devise
  devise text NOT NULL,
  reference text NOT NULL,
  prenom text, message text,
  appareil text NOT NULL,                            -- identifiant anonyme haché, pour le statut et la limite
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','recu','introuvable')),
  cree_le timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_id, reference)
);
```

- Lecture publique de `wallets_dons` (actifs seulement). Écriture dans `dons_declares` par une fonction serveur seulement : 5 déclarations par appareil et par jour au plus, aucun compte requis. Un appareil ne lit que ses propres déclarations.
- Vérification : l'équipe compare avec les relevés des wallets dans un back-office et passe le statut à `recu` ou `introuvable` (« Nous ne trouvons pas ce numéro. Vérifiez-le ou écrivez-nous. »).
- Hors ligne : la déclaration est gardée sur le téléphone et envoyée au retour du réseau.

## Règles des stores (à décider avant la publication)

- **Google Play** : la facturation Google est obligatoire pour les achats numériques ; elle ne l'est pas pour les **dons défiscalisés**. Un don sans contrepartie, reçu par une **association déclarée**, est la situation la plus solide ; reçu par un particulier, c'est une zone grise qu'il faut accepter en connaissance de cause.
- **App Store** : seules les associations agréées par Apple peuvent collecter des dons dans l'app, et avec Apple Pay. Afficher des numéros de wallet pour recevoir de l'argent expose à un refus. Recommandation : la version iOS ne contient pas l'écran Soutenir ; À propos peut renvoyer vers une page web de soutien si le projet est porté par une association.
- Le choix iOS se fait dans le build envoyé en revue (`Platform.OS`), jamais par un interrupteur activé après validation : montrer après la revue une fonction que l'examinateur n'a pas vue est interdit et peut faire retirer l'app.
- Dans les deux fiches confidentialité : déclarer « contenu fourni par l'utilisateur » (prénom, message, référence), non lié à l'identité, sans suivi.
- Conseil : ouvrir les comptes de wallet au nom d'une association (Mauritanie ou Sénégal) ; c'est plus clair pour les donateurs et pour les stores.

## Textes

| Moment | Texte |
| --- | --- |
| Titre | Soutenir Sama Jàmm |
| Pourquoi | L'app est gratuite, sans publicité, pour tous. Vos dons paient l'hébergement, l'audio et les droits des récitations. |
| Après copie | Numéro copié. Ouvrez votre wallet pour envoyer votre don. |
| Déclarer | Vous avez envoyé un don ? Donnez-nous le numéro de transaction pour que nous puissions vous remercier. |
| Merci | Sant Yàlla. Merci pour votre soutien. |
| Statut | En attente de vérification · Reçu, merci · Numéro introuvable |
