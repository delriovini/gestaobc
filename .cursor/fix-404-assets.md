# Corrigir 404 em layout.css / main-app.js / app-pages-internals.js

Esses arquivos são gerados pelo Next.js. 404 costuma ser cache ou `.next` corrompido.

## Passos (faça na ordem)

1. **Parar o servidor**  
   No terminal: `Ctrl+C`

2. **Apagar cache de build**
   ```powershell
   Remove-Item -Recurse -Force .next
   if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }
   ```

3. **Subir de novo**
   - Desenvolvimento: `npm run dev`
   - Produção: `npm run build` e depois `npm run start`

4. **No navegador**
   - Abra o site (ex.: http://localhost:3000)
   - `Ctrl+Shift+R` (hard refresh) ou F12 → Application → Clear storage → Clear site data
   - Feche e abra a aba (ou o navegador) e acesse de novo

Se o projeto estiver no OneDrive, evite sincronizar a pasta `.next` (clique direito → "Manter sempre neste dispositivo").
