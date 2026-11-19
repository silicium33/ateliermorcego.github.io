document.addEventListener('DOMContentLoaded', function () {
  var archive = document.querySelector('[data-journal-archive]');
  if (!archive) return;

  var cards = Array.from(archive.querySelectorAll('[data-journal-post]'));
  var grid = archive.querySelector('.journal-grid');
  var filters = Array.from(archive.querySelectorAll('[data-journal-filter]'));
  var search = archive.querySelector('[data-journal-search]');
  var emptyState = archive.querySelector('[data-journal-empty]');
  var emptyTitle = archive.querySelector('[data-journal-empty-title]');
  var emptyDescription = archive.querySelector('[data-journal-empty-description]');
  var resultCount = archive.querySelector('[data-journal-result-count]');
  var category = new URLSearchParams(window.location.search).get('categoria') || 'todos';
  var supportedCategories = ['todos', 'revisao', 'opiniao'];

  if (supportedCategories.indexOf(category) === -1) category = 'todos';

  function updateArchive() {
    var query = search ? search.value.trim().toLocaleLowerCase('pt-BR') : '';
    var visibleCount = 0;

    filters.forEach(function (filter) {
      if (filter.dataset.journalFilter === category) {
        filter.setAttribute('aria-current', 'page');
      } else {
        filter.removeAttribute('aria-current');
      }
    });

    cards.forEach(function (card) {
      var matchesCategory = category === 'todos' || card.dataset.category === category;
      var searchableText = (card.dataset.search + ' ' + card.textContent).toLocaleLowerCase('pt-BR');
      var matchesSearch = !query || searchableText.indexOf(query) !== -1;
      var isVisible = matchesCategory && matchesSearch;

      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (resultCount) {
      resultCount.textContent = visibleCount + (visibleCount === 1 ? ' publicação' : ' publicações');
    }

    if (grid) grid.classList.toggle('is-single-result', visibleCount === 1);

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
      if (query) {
        emptyTitle.textContent = 'Nenhum resultado para esta busca';
        emptyDescription.textContent = 'Tente outra palavra ou escolha uma categoria diferente.';
      } else if (category !== 'todos') {
        emptyTitle.textContent = 'Nenhum post nesta seção ainda';
        emptyDescription.textContent = 'Explore todos os posts enquanto novos textos são preparados.';
      } else {
        emptyTitle.textContent = 'Nenhum post encontrado';
        emptyDescription.textContent = 'Volte em breve para acompanhar os próximos registros do atelier.';
      }
    }
  }

  if (search) {
    var initialQuery = new URLSearchParams(window.location.search).get('q');
    if (initialQuery) search.value = initialQuery;
    search.addEventListener('input', updateArchive);
  }

  updateArchive();
});
