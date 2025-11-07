export default function App() {
  if (typeof document === 'undefined') return null;

  const root = document.getElementById('app') ?? document.body;
  root.innerHTML = `
    <div style="padding:16px;font:16px system-ui; color:#e5e7eb;background:#0b0c10">
      Chargement…
    </div>
  `;

  setTimeout(async () => {
    try {
      const mod = await import('./owgg'); // le gros fichier
      if (typeof mod.default === 'function') mod.default();
    } catch (e) {
      console.error(e);
      root.innerHTML = `<pre style="color:#fca5a5;white-space:pre-wrap">Erreur: ${String(e)}</pre>`;
    }
  }, 0);

  return null;
}
