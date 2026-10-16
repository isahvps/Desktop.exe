# Desktop.exe — Sistema legado

Jogo curto de analog horror feito com HTML, CSS e JavaScript puro. A história se passa dentro de um desktop retrô fictício: o antigo usuário, M. Vale, desapareceu do índice do sistema, mas vestígios de sua sessão continuam ativos.

## Rodar localmente
1. Extraia os arquivos.
2. Abra `index.html` no navegador. Para uma experiência de desenvolvimento mais confiável, use a extensão Live Server do VS Code.
3. Clique na tela de inicialização e explore os aplicativos.

## Publicar no GitHub Pages
1. Crie um repositório público chamado `desktop-exe`.
2. Envie `index.html`, `css/`, `js/` e `README.md` para a raiz do repositório.
3. Vá em **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`, depois salve.
6. Aguarde o link do Pages aparecer nessa mesma seção.

## Como jogar
- Dê duplo clique nos ícones para abrir aplicativos.
- Explore `LOG_03.TXT`, `imagem_corrompida.bmp`, as propriedades do sistema e o Media Player.
- No Terminal, digite `help`. Experimente `scan`, `whoami`, `home`, `forget` e `restore user`.
- Reúna pelo menos três pistas para restaurar o arquivo na Lixeira.
- O recado restaurado abre a decisão final. Há três finais.
- O progresso é salvo no `localStorage` deste navegador. Use **Iniciar → Reiniciar investigação** para recomeçar.

## Segurança e limitações
- O terminal é fictício: não executa comandos reais.
- Os sustos, efeitos visuais e áudio sintetizado ficam dentro da página.
- O jogo não lê nem modifica arquivos do computador.
- O salvamento é local ao navegador e não sincroniza entre dispositivos.
- Os sons são opcionais e só tocam após ativação pelo jogador.

## Estrutura
- `index.html` — estrutura do desktop
- `css/style.css` — aparência e responsividade
- `js/game.js` — janelas, aplicativos, narrativa, pistas, finais e salvamento
