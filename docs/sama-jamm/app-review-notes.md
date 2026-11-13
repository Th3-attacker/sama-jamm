# Notes pour l'App Review (Apple, guideline 2.1)

Réponse à « Information Needed – New App Submission ». Le texte anglais ci-dessous se colle dans le champ **Notes** de la section « App Review Information » d'App Store Connect, puis l'app est resoumise.

## À faire avant de coller (par le propriétaire)

- Filmer la vidéo sur un **iPhone réel**, dernier iOS, depuis le **lancement de l'app** : bienvenue, lecture et écoute, horaires de prière, budget, **création de compte, khatm, blocage et signalement d'un membre, suppression du compte**. Mettre le lien de la vidéo à l'endroit indiqué (Drive ou YouTube non répertorié).
- Vérifier la mention **xassaid.com** : elle figure dans l'écran À propos mais le code ne l'appelle pas. Ne la garder que si elle est utilisée.
- Pouvoir produire, si Apple le demande, l'**autorisation écrite** des récitateurs ou ayants droit pour les récitations et l'adhan. Rien dans le dépôt ne la prouve.
- Le build soumis doit contenir le **blocage d'un membre** et le lien « Écrire à l'équipe » dans la fiche d'un khatm (nouveau build).

## Texte à coller

```text
PURPOSE AND AUDIENCE
Sama Jamm is a free, ad-free Muslim companion app for French- and Arabic-speaking users, with Wolof phrases, mainly in West Africa. Users can read the Quran (Arabic text only), listen to recitations, read supplications (invocations), see prayer times and the qibla direction, keep a dhikr counter, follow a shared Quran-completion group (Khatm) and manage a household budget (zakat estimate, debts between relatives). Core features work offline. There are no in-app purchases, no ads and no tracking.

SCREEN RECORDING
[LINK TO THE SCREEN RECORDING, captured on a physical iPhone with the latest iOS, starting at app launch]

HOW TO ACCESS THE MAIN FEATURES
No account or login is required for the main features. On first launch the app asks for a language, then offers location (or a city can be chosen instead), then notification preferences. Tabs: Home, Read (Quran, listening, invocations), Prayer (times, qibla), Budget, More. The household budget stays on the device, is encrypted and is never sent to a server.
An account is optional and only needed for the collective Khatm feature. To test it: More > Account > "Continue with Apple" (Sign in with Apple), or e-mail one-time code. No demo credentials are needed: the reviewer can sign in with their own Apple ID.
Account deletion: More > Account > Delete account. It removes the account and the server-side data.

USER-GENERATED CONTENT AND MODERATION
The only user-generated content is the name and intention of a Khatm group and the first names of its members. In a group screen, every member can:
- Report another member (Report button; the report is stored server-side for review).
- Block another member (Block button; the member's first name is hidden on the device and can be restored with Unblock).
The group creator can also remove a member. A "Write to the team" button in the group screen leads to the Help and contact screen.

EXTERNAL SERVICES
- Supabase: database and authentication for the optional account and Khatm groups
- Sign in with Apple and Google sign-in: optional authentication
- alquran.cloud / Islamic Network: Quran text and verse-by-verse recitation audio
- Tanzil Project: transliteration and Quran markers (CC BY 3.0)
- UmmahAPI: invocations
- Expo / EAS: build and app updates
Prayer times are computed on the device with the open-source adhan library. Location is used on the device only and is never sent anywhere.

REGIONAL DIFFERENCES
The app works the same in all regions. Language (French or Arabic), prayer-time calculation method and budget currency (for example MRU, XOF) are user settings.

THIRD-PARTY MATERIAL
Quran text: alquran.cloud, uthmani edition, reproduced unmodified. Recitations: Islamic Network, used under its terms for free, non-commercial distribution (alquran.cloud/terms-and-conditions). Adhan audio: free recordings provided for Sama Jamm.
```
