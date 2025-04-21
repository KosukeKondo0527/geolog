/**
 * ブログ記事カードを作成する
 * @param {Object} article - 記事データ
 * @returns {HTMLElement} - カード要素
 */
export function createBlogCard(article) {
    // カードコンポーネントを作成
    const card = document.createElement('div');
    card.className = 'card bg-dark text-white border-secondary mb-3 shadow-lg';
    
    // デフォルトでエンボス効果を付与
    card.style.cssText = `
      border: 1px solid rgba(100, 100, 100, 0.5);
      border-radius: 12px;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), 
                  0 2px 8px rgba(255, 255, 255, 0.1), 
                  0 0 4px rgba(255, 255, 255, 0.05),
                  inset 0 1px 2px rgba(255, 255, 255, 0.15);
      transition: box-shadow 0.3s ease-in-out;
      position: relative;
    `;
    
    // 追加の光沢効果（カードの上部に白いグラデーション）
    const gloss = document.createElement('div');
    gloss.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 30px;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      pointer-events: none;
      z-index: 1;
    `;
    card.appendChild(gloss);
    
    let cardHTML = '';
    
    // 画像があれば表示
    if (article.image) {
      cardHTML += `
        <div class="position-relative">
          <img src="${article.image}" class="card-img-top" 
               style="height: 160px; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px; position: relative; z-index: 0;" 
               alt="${article.title}">
          <div class="position-absolute top-0 end-0 m-2" style="z-index: 2;">
            <span class="badge bg-info text-dark">${article.blogDate || ''}</span>
          </div>
        </div>
      `;
    }
    
    // カード本文
    cardHTML += `
      <div class="card-body" style="background: linear-gradient(to bottom, #343a40, #2c3238); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; position: relative; z-index: 0;">
        <h5 class="card-title">${article.title}</h5>
        <p class="card-text small">${article.preview}</p>
        <a href="${article.url}" class="btn btn-sm btn-outline-info" target="_blank">記事を読む</a>
      </div>
    `;
    
    card.innerHTML += cardHTML;
    
    return card;
  }
  
  /**
   * クリック可能なカードラッパーを作成する
   * @param {HTMLElement} card - カード要素
   * @param {string} url - リンク先URL
   * @returns {HTMLElement} - ラッパー要素
   */
  export function createCardWrapper(card, url) {
    const cardWrapper = document.createElement('a');
    cardWrapper.href = url;
    cardWrapper.target = '_blank';
    cardWrapper.className = 'text-decoration-none';
    
    // ホバー時にエンボスの高さを上げる
    cardWrapper.onmouseenter = () => {
      card.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.4), 
                            0 4px 12px rgba(255, 255, 255, 0.15), 
                            0 0 8px rgba(255, 255, 255, 0.1),
                            inset 0 1px 3px rgba(255, 255, 255, 0.25)`;
    };
    
    cardWrapper.onmouseleave = () => {
      card.style.boxShadow = `0 6px 12px rgba(0, 0, 0, 0.3), 
                            0 2px 8px rgba(255, 255, 255, 0.1), 
                            0 0 4px rgba(255, 255, 255, 0.05),
                            inset 0 1px 2px rgba(255, 255, 255, 0.15)`;
    };
    
    cardWrapper.appendChild(card);
    return cardWrapper;
  }