(function() {
  const PROXY_URL = 'https://news-proxy.zaylinkhant02.workers.dev';

  const categorySelect = document.getElementById('category-select');
  const refreshBtn = document.getElementById('refresh-btn');
  const newsGrid = document.getElementById('news-grid');
  const loadMoreContainer = document.getElementById('load-more-container');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const errorMessage = document.getElementById('error-message');

  const categories = [
    { value: 'top', label: 'Top Stories' },
    { value: 'world', label: 'World' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'science', label: 'Science' },
    { value: 'health', label: 'Health' },
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'environment', label: 'Environment' },
    { value: 'politics', label: 'Politics' }
  ];

  let currentCategory = 'top';
  let nextPageToken = null;
  let isFetching = false;
  const seenTitles = new Set();

  function populateCategories() {
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.value;
      option.textContent = cat.label;
      if (cat.value === currentCategory) option.selected = true;
      categorySelect.appendChild(option);
    });
  }

  function renderSkeletons() {
    newsGrid.innerHTML = Array(6).fill(0).map(() => `
      <div class="news-card animate-pulse">
        <div class="w-full h-[180px] bg-slate-200"></div>
        <div class="card-body p-5">
          <div class="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div class="h-3 bg-slate-200 rounded w-full mb-2"></div>
          <div class="h-3 bg-slate-200 rounded w-5/6 mb-2"></div>
          <div class="h-3 bg-slate-200 rounded w-2/3 mb-6"></div>
          <div class="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
            <div class="h-3 bg-slate-200 rounded w-1/3"></div>
            <div class="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function showError(message) {
    errorMessage.classList.remove('hidden');
    errorMessage.textContent = message;
    if (!nextPageToken) newsGrid.innerHTML = '';
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function filterDuplicates(articles) {
    return articles.filter(article => {
      const titleKey = (article.title || '').trim().toLowerCase();
      if (!titleKey || seenTitles.has(titleKey)) {
        return false;
      }
      seenTitles.add(titleKey);
      return true;
    });
  }

  function renderArticles(articles, append = false) {
    if (!append && articles.length === 0) {
      newsGrid.innerHTML = `
        <div class="col-span-full text-center py-16 text-slate-500">
          <p class="text-lg font-medium">No articles found for this category.</p>
          <p class="text-sm text-slate-400 mt-1">Try another category or refresh.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    articles.forEach(article => {
      const card = document.createElement('div');
      card.className = 'news-card';

      const imageUrl = article.image_url || article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop&crop=center&q=80';
      const title = article.title || 'Untitled';
      const description = article.description || article.content || 'No description available.';
      const source = article.source_name || article.source_id || 'Unknown source';
      const pubDate = article.pubDate || article.publishedAt || '';
      const link = article.link || article.url || '#';

      card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop&crop=center&q=80'" />
        <div class="card-body">
          <h3 class="card-title">${title}</h3>
          <p class="card-description">${description}</p>
          <div class="card-meta">
            <span>${source} ${pubDate ? '· ' + formatDate(pubDate) : ''}</span>
            <a href="${link}" target="_blank" rel="noopener noreferrer">
              Read More
              <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
            </a>
          </div>
        </div>
      `;
      fragment.appendChild(card);
    });

    if (!append) {
      newsGrid.innerHTML = '';
    }
    
    newsGrid.appendChild(fragment);
    lucide.createIcons();
  }

  async function fetchNews(category, page = null) {
    if (isFetching) return;
    isFetching = true;
    errorMessage.classList.add('hidden');

    const isLoadMore = Boolean(page);

    if (!isLoadMore) {
      seenTitles.clear();
      renderSkeletons();
      loadMoreContainer.classList.add('hidden');
    } else {
      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = `<span>Loading...</span> <div class="loader !w-4 !h-4 !border-2"></div>`;
    }

    try {
      let url = `${PROXY_URL}?category=${encodeURIComponent(category)}`;
      if (page) url += `&page=${encodeURIComponent(page)}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) throw new Error('Too many requests. Please wait a minute.');
        throw new Error(`Server error (${response.status})`);
      }

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message || 'Unknown API error');
      }

      nextPageToken = data.nextPage || null;
      const articles = filterDuplicates(data.results || []);

      renderArticles(articles, isLoadMore);

      if (nextPageToken) {
        loadMoreContainer.classList.remove('hidden');
      } else {
        loadMoreContainer.classList.add('hidden');
      }
    } catch (error) {
      console.error('News fetch error:', error);
      showError('⚠️ ' + (error.message || 'Failed to load news. Please try again later.'));
    } finally {
      isFetching = false;
      loadMoreBtn.disabled = false;
      loadMoreBtn.innerHTML = `<span>Load More Articles</span> <i data-lucide="chevron-down" class="w-4 h-4"></i>`;
      lucide.createIcons();
    }
  }

  function handleCategoryChange() {
    const selected = categorySelect.value;
    if (selected === currentCategory) return;
    currentCategory = selected;
    nextPageToken = null;
    fetchNews(currentCategory);
  }

  function handleRefresh() {
    nextPageToken = null;
    fetchNews(currentCategory);
  }

  function handleLoadMore() {
    if (nextPageToken) {
      fetchNews(currentCategory, nextPageToken);
    }
  }

  function init() {
    populateCategories();
    lucide.createIcons();
    fetchNews(currentCategory);

    categorySelect.addEventListener('change', handleCategoryChange);
    refreshBtn.addEventListener('click', handleRefresh);
    loadMoreBtn.addEventListener('click', handleLoadMore);
  }

  document.addEventListener('DOMContentLoaded', init);
})();