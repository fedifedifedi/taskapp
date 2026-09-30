// Applique le thème avant le premier rendu (évite un flash clair en mode sombre).
// Fichier externe : compatible avec la Content-Security-Policy (pas de script inline).
(function () {
  try {
    var stored = localStorage.getItem('taskapp-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || ((stored === null || stored === 'system') && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
  } catch {
    /* stockage indisponible : thème clair par défaut */
  }
})();
