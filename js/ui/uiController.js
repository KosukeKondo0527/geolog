import { fetchScrapboxArticles } from '../dataService.js';
import { createBlogCard, createCardWrapper } from './components/card.js';
import { showOffcanvasPanel, createEmptyStateMessage } from './components/panel.js';
import { createScrapboxLinkButton, createCurrentLocationButton } from './components/buttons.js';
import { createLoadingSpinner, toggleLoadingOverlay } from './components/loader.js';

/**
 * 地図クリックイベント処理をセットアップ
 */
export function setupMapEvents(map) {
  // 国クリック処理
  map.on('click', 'visited-fill-gradient', async (e) => {
    const props = e.features[0].properties;
    console.log(props);
    const code = props.code;
    const name = props.name;
    
    showCountryPanel(name, code);
  });

  // ホバー効果
  map.on('mouseenter', 'visited-fill-gradient', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  
  map.on('mouseleave', 'visited-fill-gradient', () => {
    map.getCanvas().style.cursor = '';
  });
}

/**
 * 国のパネルを表示
 */
async function showCountryPanel(name, code) {
  const panelTitle = document.getElementById('panelTitle');
  const panelBody = document.getElementById('panelBody');
  
  // タイトル部分に国名と国旗を表示
  panelTitle.innerHTML = `
    <div class="d-flex align-items-center">
      <img src="https://flagcdn.com/w40/${code.toLowerCase()}.png" 
           alt="${name} flag" 
           class="me-2 border" 
           style="height: 24px; width: auto;">
      <span>${name}</span>
    </div>
  `;
  
  // ローディング表示
  panelBody.innerHTML = '';
  panelBody.appendChild(createLoadingSpinner());
  
  // パネルを先に表示
  showOffcanvasPanel();
       
  // Scrapbox記事を取得
  const scrapboxArticles = await fetchScrapboxArticles(code);
  
  // パネル内容をクリア
  panelBody.innerHTML = '';
  
  // Scrapbox記事があれば表示
  if (scrapboxArticles.length > 0) {
    displayScrapboxArticles(panelBody, scrapboxArticles);
  } else {
    // 何も投稿がない場合
    panelBody.appendChild(createEmptyStateMessage('この国の投稿はありません。'));
  }
  
  // Scrapboxへのリンクボタン
  panelBody.appendChild(createScrapboxLinkButton(code, name));
  
  // 現在地リンクボタン（オプション）
  // panelBody.appendChild(createCurrentLocationButton());
}

/**
 * Scrapbox記事を表示
 */
function displayScrapboxArticles(container, articles) {
  // スクロール可能なコンテナを作成
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'overflow-auto';
  cardsContainer.style.maxHeight = '70vh'; // 唯一のカスタムスタイル
  
  articles.forEach(article => {
    // カードを作成
    const card = createBlogCard(article);
    
    // カードをクリック可能にするラッパーで囲む
    const cardWrapper = createCardWrapper(card, article.url);
    
    cardsContainer.appendChild(cardWrapper);
  });
  
  container.appendChild(cardsContainer);
}

/**
 * ローディングオーバーレイを非表示
 */
export function hideLoadingOverlay() {
  toggleLoadingOverlay(false);
}