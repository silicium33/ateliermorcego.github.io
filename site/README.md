# Atelier Morcego

Site oficial do Atelier Morcego, com páginas sobre o atelier, cerâmicas selecionadas, comissões, aulas, loja, journal, contato e orientações.

## Site

O projeto é um site estático desenvolvido em HTML, CSS e JavaScript, sem dependências ou etapa de build. A página inicial direciona para **Cerâmicas selecionadas**.

## Publicação

O site é publicado pelo GitHub Pages. O workflow em `.github/workflows/deploy-pages.yml` envia automaticamente os arquivos do repositório para publicação quando há alterações nas branches `main` ou `master`.

Para habilitar a publicação no repositório, acesse **Settings → Pages** e selecione **GitHub Actions** como fonte de deploy. Depois da primeira execução bem-sucedida, o endereço público fica disponível nessa mesma página.

## Conteúdo

- `index.html` e pastas de páginas: conteúdo do site.
- `assets/`: estilos, scripts, imagens e fontes.

## SEO

As páginas públicas incluem descrição, URL canônica e metadados para compartilhamento. O [`sitemap.xml`](./sitemap.xml) lista as páginas públicas canônicas e o [`robots.txt`](./robots.txt) informa sua localização aos mecanismos de busca. Ao criar ou remover páginas públicas, atualize o sitemap e os metadados da página. As páginas de pagamento e reserva usam `noindex` e ficam fora do sitemap.

## Publicação do Journal

Para uma publicação quinzenal, mantenha cada artigo como uma página HTML própria: isso preserva URLs estáveis e metadados para busca e compartilhamento. Ao publicar:

1. Duplique uma página de artigo existente em `journal/` para criar o novo slug e atualize título, descrição, data, imagem, conteúdo e dados estruturados.
2. Adicione o post à lista em `journal/index.html`.
3. Atualize o item e a data de `lastBuildDate` em [`feed.xml`](./feed.xml), e inclua a nova URL em [`sitemap.xml`](./sitemap.xml).
4. Publique na branch `main` ou `master`; o GitHub Pages fará o deploy.

XML não substitui os artigos HTML: o [`feed.xml`](./feed.xml) é um feed RSS para leitores e assinantes descobrirem novas publicações. Para duas publicações por mês, editar esse conjunto pequeno de arquivos é mais simples do que introduzir um CMS ou um gerador de site.

## Aplicativo instalável

O site inclui um manifesto e um service worker para instalação e cache das páginas visitadas. O service worker requer HTTPS; no GitHub Pages, ele fica disponível após o deploy. A primeira visita precisa de conexão para instalar o cache offline.

## Journal, login e cupons (Supabase)

O Journal usa o Supabase para contagem de visualizações, comentários e login com Google. Para ativar:

O arquivo do Journal é estático e organiza os textos nas seções **Todos os posts**, **Revisão** e **Opinião**, com busca local por título, resumo, assunto e categoria. Cada texto tem uma página própria; ao publicar outro post, atualize também o arquivo em `journal/index.html` e atribua a categoria correspondente nos filtros.

1. Crie um projeto Supabase e execute [`supabase/schema.sql`](./supabase/schema.sql) no SQL Editor.
2. Em **Authentication → Providers**, habilite Google e configure as credenciais OAuth do Google. No Google Cloud, use como callback a URL `https://<project-ref>.supabase.co/auth/v1/callback` mostrada pelo Supabase.
3. Configure em **Authentication → URL Configuration** as URLs do site publicado e do endereço local de desenvolvimento (por exemplo, `http://localhost:8000/**`). Para testar localmente, rode `python -m http.server` na pasta do site.
4. Em [`assets/site-integrations.js`](./assets/site-integrations.js), preencha `url` e `anonKey` com a URL do projeto e a chave pública `anon`/publishable. Nunca use a chave `service_role` no site.

O schema cadastra o cupom `MORCEGANDO5` com 5% de desconto. O carrinho e o pagamento ainda são demonstrativos, sem preços de produtos nem criação de pedidos; portanto, o cupom pode ser validado, mas não altera um pagamento. Um checkout real precisa validar o subtotal e aplicar o desconto no servidor/provedor de pagamento, não confiar no valor calculado pelo navegador.

As visualizações são contadas uma vez por post e sessão de navegador; não são uma métrica antifraude. Os comentários são públicos para leitura e ficam vinculados à conta Google que os publicou.
