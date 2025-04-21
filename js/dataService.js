// モックデータ（実際のAPIが利用可能になるまでのプレースホルダー）
const mockScrapboxData = {
  "JP": [
    {
      title: "東京の思い出",
      image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26",
      preview: "from [blog]:2025-03-10\n日本の首都である東京を訪れた際の記録です...",
      blogDate: "2025-03-10",
      url: "https://scrapbox.io/ko2ke-log/東京の思い出"
    },
    {
      title: "京都旅行2024",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      preview: "from [blog]:2025-02-15\n歴史ある寺社仏閣が多く残る京都...",
      blogDate: "2025-02-15",
      url: "https://scrapbox.io/ko2ke-log/京都旅行2024"
    }
  ],
  "US": [
    {
      title: "ニューヨーク観光",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9",
      preview: "from [blog]:2025-01-05\nマンハッタンを中心に、自由の女神やセントラルパークなど...",
      blogDate: "2025-01-05",
      url: "https://scrapbox.io/ko2ke-log/ニューヨーク観光"
    }
  ]
};

/**
 * 滞在データを取得
 */
export async function fetchStayData() {
  const res = await fetch(CONFIG.DATA_API_URL);
  return await res.json();
}

/**
 * 国の地理データを取得
 */
export async function fetchGeoData() {
  const res = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
  return await res.json();
}

/**
 * テキスト行からblogタグと日付を抽出
 * @param {string} text テキスト行
 * @returns {string|null} 日付文字列または null
 */
function extractBlogDate(text) {
  // [blog]:[2025-04-13] のような形式にマッチする正規表現
  const blogDateMatch = text.match(/\[blog\]:\[(\d{4}-\d{2}-\d{2})\]/);
  if (blogDateMatch && blogDateMatch[1]) {
    return blogDateMatch[1];
  }
  return null;
}

// Scrapbox記事を取得する関数を完全に修正

/**
 * Scrapbox記事を取得
 */
export async function fetchScrapboxArticles(countryCode) {
  try {
    // 指定されたCORSプロキシを使用
    const proxyUrl = 'https://cors-ploxy.desunokora527.workers.dev/';
    
    // まず、country:${countryCode}ページのJSONデータを取得
    const pageUrl = `https://scrapbox.io/api/pages/ko2ke-log/country:${countryCode}`;
    console.log(`国ページURL: ${pageUrl}`);
    
    const pageResponse = await fetch(proxyUrl + pageUrl);
    
    // 404エラーは静かに処理（ページが存在しないだけなので警告なし）
    if (pageResponse.status === 404) {
      console.log(`country:${countryCode}ページは存在しません`);
      return [];
    }
    
    // その他のエラーは引き続き記録
    if (!pageResponse.ok) {
      console.error(`country:${countryCode}ページの取得に失敗しました`, pageResponse.status);
      return [];
    }
    
    const pageData = await pageResponse.json();
    
    // relatedPages.links1hopから関連記事を抽出
    if (!pageData.relatedPages || !pageData.relatedPages.links1hop || pageData.relatedPages.links1hop.length === 0) {
      console.log(`country:${countryCode}に関連するページはありません`);
      return [];
    }

    // links1hopの各エントリを処理して、blogタグを持つもののみをフィルタリング
    const blogArticles = pageData.relatedPages.links1hop
      .filter(link => {
        // country:で始まるタイトルは除外
        if (link.title.startsWith('country:')) return false;
        
        // ページがdescriptionsを持っていない場合は除外
        if (!link.descriptions || link.descriptions.length === 0) return false;
        
        // descriptionsの中にblogタグを持つものがあるか検索
        const hasBlogTag = link.descriptions.some(desc => desc.includes('[blog]:'));
        
        return hasBlogTag;
      })
      .map(link => {
        // ブログ日付を抽出
        let blogDate = null;
        for (const desc of link.descriptions) {
          const match = desc.match(/\[blog\]:\[(\d{4}-\d{2}-\d{2})\]/);
          if (match && match[1]) {
            blogDate = match[1];
            break;
          }
        }
        
        // blogDateが見つからない場合（通常はここには来ないはず）
        if (!blogDate) {
          console.warn(`ブログ日付が見つかりませんでした: ${link.title}`);
          blogDate = '1970-01-01'; // フォールバック日付
        }
        
        // 画像URL（すでにlinkオブジェクトに含まれている）
        const imageUrl = link.image || '';
        
        // 説明文の処理
        const preview = link.descriptions
          .filter(desc => {
            // 画像リンクを含む行を除外（拡張子で判定）
            if (/\[https?:\/\/.*?\.(png|jpg|jpeg|gif)]/i.test(desc)) return false;
            
            // gyazoリンクを含む行を除外（ドメインで判定）
            if (/\[https?:\/\/.*?gyazo\.com/i.test(desc)) return false;
            
            // country:リンクを除外
            if (desc.startsWith('[country:')) return false;
            
            // blogタグを含む行を除外
            if (desc.includes('[blog]:')) return false;
            
            return true;
          })
          .join(' ')
          .substring(0, 100) + '...';
        
        return {
          title: link.title,
          image: imageUrl,
          preview: preview,
          blogDate: blogDate,
          url: `https://scrapbox.io/ko2ke-log/${encodeURIComponent(link.title)}`
        };
      });
    
    // 日付でソート（新しい順）
    blogArticles.sort((a, b) => {
      if (a.blogDate > b.blogDate) return -1;
      if (a.blogDate < b.blogDate) return 1;
      return 0;
    });
    
    return blogArticles;
    
  } catch (error) {
    console.error('Scrapboxデータの取得中にエラーが発生しました:', error);
    console.log('モックデータにフォールバック');
    
    // モックデータも日付でソート
    const mockArticles = mockScrapboxData[countryCode] || [];
    return mockArticles.sort((a, b) => {
      if (a.blogDate > b.blogDate) return -1;
      if (a.blogDate < b.blogDate) return 1;
      return 0;
    });
  }
}