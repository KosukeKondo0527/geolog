/**
 * 記事カードのHTMLテンプレートを生成する
 * @param {Object} article - 記事データ
 * @returns {string} - HTMLテンプレート文字列
 */
export function getArticleCardTemplate(article) {
  let template = '';
  
  // 画像があれば表示（カードの上部）
  if (article.image) {
    template += `
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
  template += `
    <div class="card-body" style="background: linear-gradient(to bottom, #343a40, #2c3238); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; position: relative; z-index: 0;">
      <h5 class="card-title">${article.title}</h5>
      <p class="card-text small">${article.preview}</p>
      <a href="${article.url}" class="btn btn-sm btn-outline-info" target="_blank">記事を読む</a>
    </div>
  `;
  
  return template;
}