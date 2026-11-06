(function () {
  // Use only the project's public URL and publishable/anon key here. Never put a service_role key in the site.
  var config = {
    url: '',
    anonKey: ''
  };
  var clientPromise;
  var journalPosts = ['inauguracao-do-blog', 'argila-do-oriente'];

  function isConfigured() {
    return Boolean(config.url && config.anonKey);
  }

  function setStatus(element, message, state) {
    if (!element) return;
    element.textContent = message;
    if (state) {
      element.dataset.state = state;
    } else {
      delete element.dataset.state;
    }
  }

  function loadSupabase() {
    if (!isConfigured()) {
      return Promise.reject(new Error('Configure a URL e a chave pública do Supabase em assets/site-integrations.js.'));
    }
    if (clientPromise) return clientPromise;
    if (window.supabase && window.supabase.createClient) {
      clientPromise = Promise.resolve(window.supabase.createClient(config.url, config.anonKey));
      return clientPromise;
    }

    clientPromise = new Promise(function (resolve, reject) {
      var sdk = document.createElement('script');
      sdk.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      sdk.onload = function () {
        if (!window.supabase || !window.supabase.createClient) {
          clientPromise = null;
          reject(new Error('A biblioteca do Supabase carregou sem disponibilizar o cliente.'));
          return;
        }
        try {
          resolve(window.supabase.createClient(config.url, config.anonKey));
        } catch (error) {
          clientPromise = null;
          reject(error);
        }
      };
      sdk.onerror = function () {
        clientPromise = null;
        reject(new Error('Não foi possível carregar a biblioteca do Supabase. Verifique a conexão e tente novamente.'));
      };
      document.head.appendChild(sdk);
    });
    return clientPromise;
  }

  function setupCouponForm(cartSummary, index) {
    if (cartSummary.querySelector('[data-coupon-form]')) return;

    var form = document.createElement('form');
    form.className = 'cart-coupon';
    form.dataset.couponForm = '';

    var label = document.createElement('label');
    var input = document.createElement('input');
    var inputId = 'cart-coupon-code-' + index;
    label.htmlFor = inputId;
    label.textContent = 'Cupom de desconto';
    input.id = inputId;
    input.name = 'coupon';
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = 'Digite seu código';
    input.maxLength = 40;
    input.required = true;

    var controls = document.createElement('div');
    controls.className = 'cart-coupon-controls';
    var button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Aplicar';
    controls.append(input, button);

    var status = document.createElement('p');
    status.className = 'cart-coupon-message';
    status.dataset.couponStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    var note = document.createElement('p');
    note.className = 'cart-coupon-note';
    note.textContent = 'MORCEGANDO5 dá 5% de desconto. Este carrinho ainda não tem preços nem finaliza pedidos.';

    form.append(label, controls, status, note);
    cartSummary.insertBefore(form, cartSummary.firstChild);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var code = input.value.trim();
      if (!code) {
        setStatus(status, 'Digite um código de cupom.', 'error');
        input.focus();
        return;
      }

      button.disabled = true;
      button.textContent = 'Verificando…';
      setStatus(status, '', '');
      try {
        var client = await loadSupabase();
        var result = await client.rpc('validate_discount_coupon', {
          p_code: code,
          p_subtotal: 0
        });
        if (result.error) throw result.error;
        var coupon = Array.isArray(result.data) ? result.data[0] : result.data;
        if (!coupon) {
          setStatus(status, 'Cupom inválido, inativo ou fora da validade.', 'error');
          return;
        }
        var amount = Number(coupon.discount_amount);
        if (!Number.isFinite(amount)) {
          throw new Error('O Supabase retornou um valor de desconto inválido.');
        }
        setStatus(
          status,
          'Cupom válido: ' + coupon.discount_percent + '% (desconto calculado: ' +
            amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) +
            '). O checkout demonstrativo não aplica descontos a pedidos.',
          'success'
        );
      } catch (error) {
        setStatus(status, error.message || 'Não foi possível validar o cupom.', 'error');
      } finally {
        button.disabled = false;
        button.textContent = 'Aplicar';
      }
    });

    if (!isConfigured()) {
      setStatus(status, 'A validação ficará disponível após configurar o projeto Supabase.', '');
    }
  }

  function setupCoupons() {
    document.querySelectorAll('.cart-summary').forEach(function (summary, index) {
      setupCouponForm(summary, index + 1);
    });
  }

  function renderViewCount(element, value) {
    element.textContent = 'Visualizações: ' + Number(value).toLocaleString('pt-BR');
  }

  async function loadJournalViews(client) {
    var viewElements = Array.from(document.querySelectorAll('[data-post-views]'));
    var articleSection = document.querySelector('[data-journal-comments]');
    var articleSlug = articleSection ? articleSection.dataset.postSlug : '';
    if (!viewElements.length && !articleSlug) return;

    var articleElements = viewElements.filter(function (element) {
      return element.dataset.postSlug === articleSlug;
    });
    if (articleSlug) {
      var viewKey = 'atelier-journal-viewed-' + articleSlug;
      var alreadyCounted = false;
      try {
        alreadyCounted = sessionStorage.getItem(viewKey) === '1';
      } catch (error) {
        setStatus(
          articleElements[0],
          'A contagem por sessão não está disponível neste navegador.',
          'error'
        );
      }

      var result;
      if (alreadyCounted) {
        result = await client.from('journal_posts')
          .select('view_count')
          .eq('slug', articleSlug)
          .single();
        if (result.error) throw result.error;
        articleElements.forEach(function (element) {
          renderViewCount(element, result.data.view_count);
        });
      } else {
        result = await client.rpc('increment_journal_view_count', { p_slug: articleSlug });
        if (result.error) throw result.error;
        articleElements.forEach(function (element) {
          renderViewCount(element, result.data);
        });
        try {
          sessionStorage.setItem(viewKey, '1');
        } catch (error) {
          setStatus(
            articleElements[0],
            'Visualizações: ' + Number(result.data).toLocaleString('pt-BR') +
              '. A contagem pode se repetir neste navegador.',
            ''
          );
        }
      }
    }

    var listingElements = viewElements.filter(function (element) {
      return element.closest('[data-journal-comments]') === null;
    });
    if (listingElements.length) {
      var slugs = Array.from(new Set(listingElements.map(function (element) {
        return element.dataset.postSlug;
      })));
      var listingResult = await client.from('journal_posts')
        .select('slug,view_count')
        .in('slug', slugs);
      if (listingResult.error) throw listingResult.error;
      var counts = new Map(listingResult.data.map(function (post) {
        return [post.slug, post.view_count];
      }));
      listingElements.forEach(function (element) {
        if (!counts.has(element.dataset.postSlug)) {
          throw new Error('Não existe um registro de visualizações para ' + element.dataset.postSlug + '.');
        }
        renderViewCount(element, counts.get(element.dataset.postSlug));
      });
    }
  }

  function renderComments(section, comments) {
    var list = section.querySelector('[data-comment-list]');
    var count = section.querySelector('[data-comment-count]');
    list.replaceChildren();
    count.textContent = comments.length + (comments.length === 1 ? ' comentário' : ' comentários');
    if (!comments.length) {
      var empty = document.createElement('p');
      empty.className = 'journal-comments-empty';
      empty.textContent = 'Seja a primeira pessoa a comentar.';
      list.appendChild(empty);
      return;
    }

    comments.forEach(function (comment) {
      var item = document.createElement('article');
      item.className = 'journal-comment';
      var author = document.createElement('strong');
      author.textContent = comment.journal_profiles.display_name;
      var body = document.createElement('p');
      body.textContent = comment.body;
      var date = document.createElement('time');
      date.dateTime = comment.created_at;
      date.textContent = new Date(comment.created_at).toLocaleString('pt-BR');
      item.append(author, body, date);
      list.appendChild(item);
    });
  }

  async function loadComments(client, section) {
    var result = await client.from('journal_comments')
      .select('id,body,created_at,journal_profiles(display_name)')
      .eq('post_slug', section.dataset.postSlug)
      .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    renderComments(section, result.data);
  }

  function setupCommunity(client) {
    var sections = Array.from(document.querySelectorAll('[data-journal-comments]'));
    var statusElements = Array.from(document.querySelectorAll('[data-community-status]'));
    if (!sections.length) return;

    var signInButtons = Array.from(document.querySelectorAll('[data-journal-sign-in]'));
    var signOutButtons = Array.from(document.querySelectorAll('[data-journal-sign-out]'));
    var commentForms = sections.map(function (section) {
      return section.querySelector('[data-comment-form]');
    });
    var currentUser = null;

    function updateAuthControls() {
      signInButtons.forEach(function (button) {
        button.hidden = Boolean(currentUser);
        button.disabled = false;
      });
      signOutButtons.forEach(function (button) {
        button.hidden = !currentUser;
      });
      commentForms.forEach(function (form) {
        form.hidden = !currentUser;
      });
      if (currentUser) {
        statusElements.forEach(function (element) {
          setStatus(element, 'Você está conectado com Google e pode publicar comentários.', '');
        });
      } else {
        statusElements.forEach(function (element) {
          setStatus(element, 'Entre com Google para publicar um comentário. Os comentários publicados são públicos.', '');
        });
      }
    }

    signInButtons.forEach(function (button) {
      button.addEventListener('click', async function () {
        button.disabled = true;
        try {
          var result = await client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
          });
          if (result.error) throw result.error;
        } catch (error) {
          statusElements.forEach(function (element) {
            setStatus(element, error.message || 'Não foi possível iniciar o login com Google.', 'error');
          });
          button.disabled = false;
        }
      });
    });

    signOutButtons.forEach(function (button) {
      button.addEventListener('click', async function () {
        button.disabled = true;
        try {
          var result = await client.auth.signOut();
          if (result.error) throw result.error;
        } catch (error) {
          statusElements.forEach(function (element) {
            setStatus(element, error.message || 'Não foi possível encerrar a sessão.', 'error');
          });
          button.disabled = false;
        }
      });
    });

    commentForms.forEach(function (form, index) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (!currentUser) {
          setStatus(statusElements[index], 'Entre com Google antes de publicar.', 'error');
          return;
        }
        var body = form.elements.body.value.trim();
        if (!body) {
          form.elements.body.focus();
          return;
        }
        var submitButton = form.querySelector('[type="submit"]');
        submitButton.disabled = true;
        try {
          var result = await client.from('journal_comments').insert({
            post_slug: sections[index].dataset.postSlug,
            author_id: currentUser.id,
            body: body
          });
          if (result.error) throw result.error;
          form.reset();
          await loadComments(client, sections[index]);
          setStatus(statusElements[index], 'Comentário publicado.', 'success');
        } catch (error) {
          setStatus(statusElements[index], error.message || 'Não foi possível publicar o comentário.', 'error');
        } finally {
          submitButton.disabled = false;
        }
      });
    });

    client.auth.onAuthStateChange(function (_event, session) {
      currentUser = session ? session.user : null;
      updateAuthControls();
      window.setTimeout(function () {
        sections.forEach(function (section, index) {
          loadComments(client, section).catch(function (error) {
            setStatus(statusElements[index], error.message || 'Não foi possível carregar os comentários.', 'error');
          });
        });
      }, 0);
    });

    client.auth.getSession().then(function (result) {
      if (result.error) throw result.error;
      currentUser = result.data.session ? result.data.session.user : null;
      updateAuthControls();
      return Promise.all(sections.map(function (section, index) {
        return loadComments(client, section).catch(function (error) {
          setStatus(statusElements[index], error.message || 'Não foi possível carregar os comentários.', 'error');
        });
      }));
    }).catch(function (error) {
      statusElements.forEach(function (element) {
        setStatus(element, error.message || 'Não foi possível iniciar os comentários.', 'error');
      });
    });
  }

  async function initialize() {
    setupCoupons();
    var viewElements = document.querySelectorAll('[data-post-views]');
    var commentSections = document.querySelectorAll('[data-journal-comments]');
    if (!isConfigured()) {
      viewElements.forEach(function (element) {
        setStatus(element, 'Visualizações indisponíveis: configure o Supabase.', '');
      });
      commentSections.forEach(function (section) {
        var status = section.querySelector('[data-community-status]');
        setStatus(status, 'Login, comentários e visualizações serão ativados após configurar o Supabase.', '');
        var count = section.querySelector('[data-comment-count]');
        setStatus(count, 'Comentários indisponíveis enquanto o Supabase não estiver configurado.', '');
      });
      document.querySelectorAll('[data-journal-sign-in]').forEach(function (button) {
        button.disabled = true;
      });
      return;
    }

    var client;
    try {
      client = await loadSupabase();
    } catch (error) {
      viewElements.forEach(function (element) {
        setStatus(element, error.message || 'Não foi possível carregar as visualizações.', 'error');
      });
      commentSections.forEach(function (section) {
        setStatus(
          section.querySelector('[data-community-status]'),
          error.message || 'Não foi possível conectar aos comentários.',
          'error'
        );
      });
      return;
    }

    setupCommunity(client);
    try {
      await loadJournalViews(client);
    } catch (error) {
      viewElements.forEach(function (element) {
        setStatus(element, error.message || 'Não foi possível carregar as visualizações.', 'error');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
