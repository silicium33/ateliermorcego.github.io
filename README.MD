# Atelier Morcego

Site do Atelier Morcego, com páginas sobre o atelier, cerâmicas, comissões, aulas, loja e journal.

## Tecnologias

- HTML
- CSS
- JavaScript

O site é estático: não requer instalação de dependências nem etapa de build.

## Visualizar localmente

Na pasta do projeto, inicie um servidor local com Python:

```bash
python -m http.server 8000
```

Abra [http://localhost:8000](http://localhost:8000) no navegador. A página inicial redireciona para **Cerâmicas selecionadas**. Para encerrar o servidor, pressione `Ctrl+C` no terminal.

## Publicação

O projeto pode ser publicado pelo GitHub Pages usando os arquivos da raiz do repositório. Em **Settings → Pages**, selecione **Deploy from a branch**, escolha a branch principal e a pasta **/(root)**.

## Estrutura

- `index.html`: entrada do site e redirecionamento para Cerâmicas selecionadas.
- `assets/`: folhas de estilo, JavaScript, imagens e fontes.
- `sobre/`, `ceramicas-selecionadas/`, `comissoes/`, `lessons/`, `shop/`, `journal/` e outras pastas: páginas do site.
