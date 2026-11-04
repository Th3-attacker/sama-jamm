// Images importées depuis assets/ : Metro en fait un identifiant de ressource (expo-env.d.ts n'est pas versionné).
declare module '*.png' {
  const ressource: number;
  export default ressource;
}
