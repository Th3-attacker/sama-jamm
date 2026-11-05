// Connexion avec Google (navigateur du système, flux PKCE) et avec Apple (feuille native, iPhone seulement).
// Aucun mot de passe ne passe par l'app ; Supabase reçoit un code ou un jeton signé par le fournisseur.
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/services/supabase/client';

import { lireRetourOAuth } from './validation';

/** Résultat d'une connexion : réussie, ou abandonnée par la personne (pas une erreur). */
export type IssueConnexion = 'connecte' | 'annule';

/** Adresse de retour à déclarer dans Supabase (Auth > URL Configuration) : samajamm://auth en build. */
export const adresseRetour = () => Linking.createURL('auth');

export async function connecterGoogle(): Promise<IssueConnexion> {
  const retour = adresseRetour();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: retour, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const resultat = await WebBrowser.openAuthSessionAsync(data.url, retour);
  if (resultat.type !== 'success') return 'annule';
  const lu = lireRetourOAuth(resultat.url);
  if (!lu) throw new Error('Retour de Google sans code.');
  if ('erreur' in lu) throw new Error(lu.erreur);
  const echange = await supabase.auth.exchangeCodeForSession(lu.code);
  if (echange.error) throw echange.error;
  return 'connecte';
}

/** Connexion Apple possible sur ce téléphone (iPhone avec iOS 13 ou plus). */
export async function appleDisponible(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

function annuleParApple(erreur: unknown): boolean {
  return typeof erreur === 'object' && erreur !== null && 'code' in erreur && erreur.code === 'ERR_REQUEST_CANCELED';
}

export async function connecterApple(): Promise<IssueConnexion> {
  // Nonce : Apple signe son empreinte, Supabase vérifie qu'elle correspond au nonce brut.
  const nonce = Crypto.randomUUID();
  const empreinte = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  let jeton: string | null;
  try {
    const identite = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: empreinte,
    });
    jeton = identite.identityToken;
  } catch (erreur: unknown) {
    if (annuleParApple(erreur)) return 'annule';
    throw erreur;
  }
  if (!jeton) throw new Error('Apple n’a pas renvoyé de jeton.');
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: jeton, nonce });
  if (error) throw error;
  return 'connecte';
}
