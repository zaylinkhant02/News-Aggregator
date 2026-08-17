(function() {
  const PROXY_URL = 'https://news-proxy.zaylinkhant02.workers.dev';

  const categorySelect = document.getElementById('category-select');
  const refreshBtn = document.getElementById('refresh-btn');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const featuredStory = document.getElementById('featured-story');
  const newsGrid = document.getElementById('news-grid');
  const scrollSentinel = document.getElementById('scroll-sentinel');
  const sentinelLoader = document.getElementById('sentinel-loader');
  const errorMessage = document.getElementById('error-message');
  const lastUpdatedEl = document.getElementById('last-updated');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  const lightIcon = document.getElementById('theme-toggle-light-icon');
  const backToTopBtn = document.getElementById('back-to-top');

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
  let currentSearchQuery = '';
  let nextPageToken = null;
  let isFetching = false;
  let observer = null;
  const seenTitles = new Set();

  function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.body.classList.add('dark');
      darkIcon?.classList.add('hidden');
      lightIcon?.classList.remove('hidden');
    } else {
      document.body.classList.remove('dark');
      darkIcon?.classList.remove('hidden');
      lightIcon?.classList.add('hidden');
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    if (isDark) {
      darkIcon?.classList.add('hidden');
      lightIcon?.classList.remove('hidden');
    } else {
      darkIcon?.classList.remove('hidden');
      lightIcon?.classList.add('hidden');
    }
  }

  function populateCategories() {
    categorySelect.innerHTML = categories.map(cat => 
      `<option value="${cat.value}" ${cat.value === currentCategory ? 'selected' : ''}>${cat.label}</option>`
    ).join('');
  }

  function updateLastUpdatedTimestamp() {
    if (!lastUpdatedEl) return;
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    lastUpdatedEl.textContent = `Refreshed at ${formattedTime}`;
  }

  function renderSkeletons() {
    featuredStory.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse flex flex-col md:flex-row gap-6">
        <div class="w-full md:w-1/2 h-64 bg-slate-200 rounded-xl"></div>
        <div class="w-full md:w-1/2 flex flex-col justify-center space-y-4">
          <div class="h-4 bg-slate-200 rounded w-1/4"></div>
          <div class="h-7 bg-slate-200 rounded w-5/6"></div>
          <div class="h-4 bg-slate-200 rounded w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-4/5"></div>
          <div class="h-4 bg-slate-200 rounded w-1/3 pt-4"></div>
        </div>
      </div>
    `;

    newsGrid.innerHTML = Array(6).fill(0).map(() => `
      <div class="news-card animate-pulse">
        <div class="w-full h-[180px] bg-slate-200"></div>
        <div class="card-body p-5">
          <div class="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div class="h-3 bg-slate-200 rounded w-full mb-2"></div>
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
    if (!nextPageToken) {
      newsGrid.innerHTML = '';
      featuredStory.innerHTML = '';
    }
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

  function createCardHTML(article) {
    const imageUrl = article.image_url || article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop&crop=center&q=80';
    const title = article.title || 'Untitled';
    const description = article.description || article.content || 'No description available.';
    const source = article.source_name || article.source_id || 'Unknown source';
    const pubDate = article.pubDate || article.publishedAt || '';
    const link = article.link || article.url || '#';

    return `
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
  }

  function renderFeaturedStory(article) {
    if (!article) {
      featuredStory.innerHTML = '';
      return;
    }

    const imageUrl = article.image_url || article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000&h=600&fit=crop&crop=center&q=80';
    const title = article.title || 'Untitled';
    const description = article.description || article.content || 'No description available.';
    const source = article.source_name || article.source_id || 'Unknown source';
    const pubDate = article.pubDate || article.publishedAt || '';
    const link = article.link || article.url || '#';

    featuredStory.innerHTML = `
      <div class="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col md:flex-row">
        <div class="w-full md:w-1/2 h-64 md:h-auto relative bg-slate-100 flex-shrink-0">
          <img src="${imageUrl}" alt="${title}" class="w-full h-full object-cover object-center absolute inset-0" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000&h=600&fit=crop&crop=center&q=80'" />
          <span class="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-md z-10">Featured</span>
        </div>
        <div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">${source}</div>
            <h2 class="text-2xl font-bold text-slate-900 leading-tight mb-3 hover:text-blue-600 transition">${title}</h2>
            <p class="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-6">${description}</p>
          </div>
          <div class="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
            <span>${pubDate ? formatDate(pubDate) : ''}</span>
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700">
              Read Full Story
              <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function renderArticles(articles, append = false) {
    let itemsToRender = [...articles];

    if (!append) {
      if (itemsToRender.length > 0) {
        const heroArticle = itemsToRender.shift();
        renderFeaturedStory(heroArticle);
      } else {
        featuredStory.innerHTML = '';
      }

      if (itemsToRender.length === 0) {
        newsGrid.innerHTML = `
          <div class="col-span-full text-center py-16 text-slate-500">
            <p class="text-lg font-medium">No articles found.</p>
            <p class="text-sm text-slate-400 mt-1">Try another search or category.</p>
          </div>
        `;
        return;
      }
    }

    const fragment = document.createDocumentFragment();

    itemsToRender.forEach(article => {
      const card = document.createElement('div');
      card.className = 'news-card';
      card.innerHTML = createCardHTML(article);
      fragment.appendChild(card);
    });

    if (!append) {
      newsGrid.innerHTML = '';
    }

    newsGrid.appendChild(fragment);
    lucide.createIcons();
  }

  async function fetchNews(category, page = null, query = '') {
    if (isFetching) return;
    isFetching = true;
    errorMessage.classList.add('hidden');

    const isLoadMore = Boolean(page);

    if (!isLoadMore) {
      seenTitles.clear();
      renderSkeletons();
    } else {
      sentinelLoader.classList.remove('hidden');
    }

    try {
      let url = `${PROXY_URL}?category=${encodeURIComponent(category)}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
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
      if (!isLoadMore) {
        updateLastUpdatedTimestamp();
      }
    } catch (error) {
      console.error('News fetch error:', error);
      showError('⚠️ ' + (error.message || 'Failed to load news. Please try again later.'));
    } finally {
      isFetching = false;
      sentinelLoader.classList.add('hidden');
      lucide.createIcons();
    }
  }

  function setupIntersectionObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && nextPageToken && !isFetching) {
        fetchNews(currentCategory, nextPageToken, currentSearchQuery);
      }
    }, { rootMargin: '200px' });

    observer.observe(scrollSentinel);
  }

  function handleCategoryChange() {
    currentCategory = categorySelect.value;
    currentSearchQuery = '';
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    nextPageToken = null;
    fetchNews(currentCategory, null, currentSearchQuery);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query && !currentSearchQuery) return;

    currentSearchQuery = query;
    nextPageToken = null;

    if (currentSearchQuery) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }

    fetchNews(currentCategory, null, currentSearchQuery);
  }

  function handleClearSearch() {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.classList.add('hidden');
    nextPageToken = null;
    fetchNews(currentCategory, null, currentSearchQuery);
  }

  function setupBackToTop() {
    if (!backToTopBtn) return;
  
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.add('opacity-100');
      } else {
        backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.remove('opacity-100');
      }
    });
  
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function init() {
    initTheme();
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }
  
    populateCategories();
    lucide.createIcons();
    setupIntersectionObserver();
    setupBackToTop();
  
    fetchNews(currentCategory, null, currentSearchQuery);
  
    categorySelect.addEventListener('change', handleCategoryChange);
    refreshBtn.addEventListener('click', () => fetchNews(currentCategory, null, currentSearchQuery));
    searchForm.addEventListener('submit', handleSearchSubmit);
    clearSearchBtn.addEventListener('click', handleClearSearch);
  }

  document.addEventListener('DOMContentLoaded', init);
})();