Extensão validada em ambiente controlado

# Privacy Monitor — Extensão Firefox

**Disciplina:** Tecnologias Hackers · Insper 2026  

Extensão WebExtension para Firefox que detecta e apresenta em tempo real as principais ameaças à privacidade e rastreamento presentes na navegação web moderna.

---

## Funcionalidades implementadas

### 1. Domínios de Terceira Parte 
Intercepta todas as requisições de rede via `webRequest` API e identifica cada domínio externo contactado pela página, listando:
- Nome do domínio e identificação do rastreador (ex: "Google DoubleClick — ALTO RISCO")
- Tipo de recurso carregado: Script, Imagem, iframe, XHR, CSS, Beacon
- Número de requisições por domínio
- Categoria do rastreador (Publicidade, Analytics, Infraestrutura, etc.)
- Descrição em linguagem simples do que cada rastreador faz

Base de dados com mais de 30 rastreadores conhecidos mapeados.

### 2. Detecção de Hijacking e Hooking
Monitora tentativas de sequestro do navegador via `MutationObserver` e monkey-patching:
- Scripts externos adicionados dinamicamente ao DOM com padrões suspeitos (BeEF, XSS, cryptominers, keyloggers)
- Redirecionamentos não autorizados via `location.replace()`
- Uso de `eval()` — técnica comum em scripts maliciosos e ofuscados

### 3. Web Storage API
Coleta e exibe todos os dados armazenados localmente pelo site:
- **localStorage**: chave, valor (truncado) e tamanho em bytes — persiste após fechar o browser
- **sessionStorage**: chave, valor e tamanho — some ao fechar a aba
- **IndexedDB**: lista todos os bancos de dados com nome e versão

### 4. Cookies *(1 ponto)*
Monitora cabeçalhos `Set-Cookie` de todas as respostas HTTP e classifica:
- **Primeira parte** vs. **Terceira parte**
- **Sessão** (sem `Expires`/`Max-Age`) vs. **Persistente**
- **Supercookies**: HSTS (max-age > 1 ano) e ETag de domínios de terceiros — sobrevivem à limpeza de cookies

### 5. Browser Fingerprinting 
Detecta chamadas às APIs via monkey-patching executado em `document_start`:
- **Canvas API**: `toDataURL()` e `getImageData()` — fingerprinting via diferenças de renderização de GPU
- **WebGL**: `getParameter(RENDERER)` e `getParameter(VENDOR)` — identificação do modelo da placa de vídeo
- **AudioContext**: `createOscillator()` e `createDynamicsCompressor()` — fingerprinting via processamento de áudio

### 6. Privacy Score 

**Metodologia:** pontuação começa em 100 e recebe penalidades subtrativas.

| Fator detectado | Penalidade | Teto |
|---|---|---|
| Cada domínio de 3ª parte | −3 pts | −30 pts |
| Cada cookie de 3ª parte | −5 pts | −20 pts |
| Canvas fingerprinting | −15 pts | — |
| WebGL fingerprinting | −15 pts | — |
| AudioContext fingerprinting | −10 pts | — |
| Cada evento de cookie syncing | −10 pts | −20 pts |
| Cada supercookie detectado | −10 pts | −20 pts |
| Cada evento de hijacking | −20 pts | −40 pts |
| Security header crítico ausente | −10 pts | — |
| Security header alto ausente | −5 pts | — |

**Classificação final:**

| Score | Classificação |
|---|---|
| 85 – 100 | ✓ Excelente |
| 70 – 84 | ↑ Bom |
| 55 – 69 | ~ Razoável |
| 35 – 54 | ↓ Ruim |
| 0 – 34 | ✗ Crítico |

**Justificativa:** a metodologia é aditiva por categoria — domínios de terceiros têm teto de −30 pts para não punir desproporcionalmente sites com muitos recursos estáticos de CDN. Fingerprinting recebe penalidade fixa elevada pois é a técnica mais invasiva: identifica o usuário mesmo após limpar cookies ou usar modo privado. Hijacking tem a maior penalidade unitária por representar risco de segurança ativo, não apenas de privacidade.

### Funcionalidades adicionais implementadas
- **Security Headers**: verifica 7 cabeçalhos HTTP de segurança (CSP, X-Frame-Options, HSTS, etc.) e explica qual ataque cada ausência permite
- **Stack Tecnológico**: reconhecimento passivo do stack do site via headers HTTP, variáveis JS e meta tags (servidor, linguagem, CMS, frameworks, analytics)
- **Cookie Syncing**: detecta passagem de IDs de usuário entre domínios via parâmetros de URL
- **Recomendações**: painel com ações práticas baseadas no que foi detectado (uBlock Origin, configurações do Firefox, etc.)
- **Sidebar persistente**: funciona como painel lateral fixo, não desaparece durante a navegação

---

## Arquitetura

```
privacy-monitor-final/
├── manifest.json          ← Configuração MV2 (permissões, sidebar, scripts)
├── privacy_monitor.js     ← Background script: intercepta rede, analisa headers, calcula score
├── content_script.js      ← Injetado nas páginas: monkey-patch de APIs, coleta storage e tech stack
├── popup.html             ← Interface da sidebar
├── popup.js               ← Lógica da interface e renderização
├── icons/
│   ├── icon48.png
│   └── icon96.png
├── README.md              ← Este arquivo
└── validacao.txt          ← Data de início do desenvolvimento
```

**Fluxo de dados:**
```
Página web
    │
    ├── content_script.js (monkey-patch APIs, coleta DOM/storage)
    │       └── browser.runtime.sendMessage → privacy_monitor.js
    │
    └── Requisições de rede
            └── webRequest API → privacy_monitor.js
                    │
                    └── tabData[tabId] (estrutura por aba)
                            │
                            └── popup.js (GET_DATA) → renderiza sidebar
```

---

## Por que Firefox?

O Firefox mantém suporte ao **Manifest V2** e à **`webRequest` API** completa, essencial para interceptar e inspecionar requisições de rede em tempo real. O Chrome migrou para MV3, que substitui `webRequest` pela `declarativeNetRequest` — uma API declarativa que impede leitura do conteúdo das requisições, tornando inviável construir este tipo de extensão naquele browser.

---

## Instalação

### Pré-requisitos
- Firefox 109 ou superior

### Passos

1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd privacy-monitor-final
   ```

2. Abra o Firefox e acesse `about:debugging`

3. Clique em **"Este Firefox"** → **"Carregar complemento temporário..."**

4. Selecione o arquivo `manifest.json` dentro da pasta do projeto

5. O ícone 🛡 aparecerá na barra de ferramentas

> **Nota:** instalação temporária, é removida ao fechar o Firefox.

---

## Como usar

1. Clique no ícone 🛡 na barra de ferramentas para abrir/fechar a sidebar
2. Navegue até qualquer site e os dados já são coletados automaticamente
4. Clique em cada seção para expandir os detalhes
5. Use **↺** para atualizar os dados manualmente após alguns segundos dentro da página. Você provavelmente verá algumas mudanças.
6. Consulte a seção **"💡 O que fazer?"** para recomendações baseadas no que foi detectado

---

## APIs e Permissões utilizadas

| Permissão | Uso |
|---|---|
| `webRequest` + `webRequestBlocking` | Interceptar e analisar requisições de rede |
| `cookies` | Leitura e classificação de cookies |
| `tabs` | Identificar a aba ativa e sua URL |
| `storage` | Armazenamento interno da extensão |
| `<all_urls>` | Monitorar todas as páginas |

---

## Referências

- [MDN — WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API)
- [MDN — webRequest API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest)
- [fingerprintable.org](https://fingerprintable.org) — Testes de fingerprinting
- [Am I Unique?](https://amiunique.org) — Verificação de fingerprint
- [Cover Your Tracks (EFF)](https://coveryourtracks.eff.org)
