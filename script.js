(function() {
    // (not shared; will fix API key to not be hardcoded later)
    const API_KEY = '';
    const BASE_URL = 'https://newsdata.io/api/1/news';
  
    const categorySelect = document.getElementById('category-select');
    const refreshBtn = document.getElementById('refresh-btn');
    const newsGrid = document.getElementById('news-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
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
    let isFetching = false;
  
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
  
    function setLoading(state) {
      if (state) {
        loadingIndicator.classList.remove('hidden');
        newsGrid.innerHTML = '';
        errorMessage.classList.add('hidden');
        newsGrid.style.opacity = '0.3';
      } else {
        loadingIndicator.classList.add('hidden');
        newsGrid.style.opacity = '1';
      }
    }
  
    function showError(message) {
      errorMessage.classList.remove('hidden');
      errorMessage.textContent = message;
      newsGrid.innerHTML = '';
    }
  
    function formatDate(dateString) {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  
    function renderArticles(articles) {
      if (!articles || articles.length === 0) {
        newsGrid.innerHTML = `
          <div class="col-span-full text-center py-16 text-slate-500">
            <p class="text-lg">No articles found for this category.</p>
            <p class="text-sm">Try another category or refresh.</p>
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
  
      newsGrid.innerHTML = '';
      newsGrid.appendChild(fragment);
  
      lucide.createIcons();
    }
  
    async function fetchNews(category) {
      if (isFetching) return;
      isFetching = true;
      setLoading(true);
      errorMessage.classList.add('hidden');
  
      try {
        let url = `${BASE_URL}?apikey=${API_KEY}&language=en&size=10`;
        
        if (category && category !== 'top') {
          url += `&category=${category}`;
        }
  
        const response = await fetch(url);
  
        if (!response.ok) {
          let errMsg = `Server error (${response.status})`;
          if (response.status === 429) errMsg = 'Too many requests. Please wait a moment.';
          else if (response.status === 401) errMsg = 'Invalid API key. Please check your credentials.';
          else if (response.status === 422) errMsg = 'Invalid request. Please check parameters or API tier limits.';
          throw new Error(errMsg);
        }
  
        const data = await response.json();
  
        if (data.status === 'error') {
          throw new Error(data.results?.message || data.message || 'Unknown API error');
        }
  
        const articles = data.results || [];
        renderArticles(articles);
      } catch (error) {
        console.error('News fetch error:', error);
        showError('⚠️ ' + (error.message || 'Failed to load news. Please try again later.'));
      } finally {
        setLoading(false);
        isFetching = false;
      }
    }
  
    function handleCategoryChange() {
      const selected = categorySelect.value;
      if (selected === currentCategory) return;
      currentCategory = selected;
      fetchNews(currentCategory);
    }
  
    function handleRefresh() {
      fetchNews(currentCategory);
    }
  
    function init() {
      populateCategories();
      lucide.createIcons();
      fetchNews(currentCategory);
  
      categorySelect.addEventListener('change', handleCategoryChange);
      refreshBtn.addEventListener('click', handleRefresh);
    }
  
    document.addEventListener('DOMContentLoaded', init);
  })();