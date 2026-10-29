# Atelier Morcego

Site estático do Atelier Morcego, feito com HTML, CSS e JavaScript. Não precisa de instalação de dependências nem de etapa de build.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie para ele o conteúdo desta pasta, mantendo a estrutura de arquivos.
2. No repositório, acesse **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch principal (`main` ou `master`) e a pasta **/(root)**; clique em **Save**.
5. Aguarde a publicação. O endereço do site aparecerá na própria página de configurações do GitHub Pages.

Se preferir enviar pelo terminal, execute estes comandos nesta pasta, substituindo a URL pelo endereço do seu repositório:

```bash
git init
git add .
git commit -m "Publica o site do Atelier Morcego"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Depois, configure o GitHub Pages seguindo os passos acima. Em atualizações futuras, envie as alterações para a branch publicada; o GitHub Pages fará uma nova publicação automaticamente.

## Estrutura

- `index.html`: página inicial, que redireciona para Cerâmicas selecionadas.
- `assets/`: estilos, JavaScript, imagens e fontes.
- `sobre/`, `ceramicas-selecionadas/`, `comissoes/`, `lessons/`, `shop/`, `journal/` e demais pastas: páginas do site.

Os caminhos dos arquivos são relativos, então o site pode ser publicado tanto na raiz de um domínio quanto em um repositório de projeto no GitHub Pages.
