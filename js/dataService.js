// モックデータ（実際のAPIが利用可能になるまでのプレースホルダー）
const mockScrapboxData = {
  "JP": [
    {
      title: "東京の思い出",
      image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26",
      preview: "from [blog]:2025-03-10\n日本の首都である東京を訪れた際の記録です...",
      blogDate: "2025-03-10",
      url: "https://scrapbox.io/gyoku-log/東京の思い出"
    },
    {
      title: "京都旅行2024",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      preview: "from [blog]:2025-02-15\n歴史ある寺社仏閣が多く残る京都...",
      blogDate: "2025-02-15",
      url: "https://scrapbox.io/gyoku-log/京都旅行2024"
    }
  ],
  "US": [
    {
      title: "ニューヨーク観光",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9",
      preview: "from [blog]:2025-01-05\nマンハッタンを中心に、自由の女神やセントラルパークなど...",
      blogDate: "2025-01-05",
      url: "https://scrapbox.io/gyoku-log/ニューヨーク観光"
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
    
    // まず、cc${countryCode}ページのJSONデータを取得
    const pageUrl = `https://scrapbox.io/api/pages/gyoku-log/cc${countryCode}`;
    console.log(`国ページURL: ${pageUrl}`);
    
    const pageResponse = await fetch(proxyUrl + pageUrl);
    
    // 404エラーは静かに処理（ページが存在しないだけなので警告なし）
    if (pageResponse.status === 404) {
      console.log(`cc${countryCode}ページは存在しません`);
      return [];
    }
    
    // その他のエラーは引き続き記録
    if (!pageResponse.ok) {
      console.error(`cc${countryCode}ページの取得に失敗しました`, pageResponse.status);
      return [];
    }
    
    const pageData = await pageResponse.json();
    
    // links1hopの各エントリを処理して、画像を持つもののみをフィルタリング
    const blogArticles = pageData.relatedPages.links1hop
      .filter(link => {
        // ccで始まるタイトルは除外
        if (link.title.startsWith('cc')) return false;
        
        // 画像があるかどうかをチェック
        return link.image && link.image.trim() !== '';
      })
      .map(link => {
        // ブログ日付を抽出 (あれば使用)
        let blogDate = null;
        if (link.descriptions && link.descriptions.length > 0) {
          for (const desc of link.descriptions) {
            const match = desc.match(/\[blog\]:\[(\d{4}-\d{2}-\d{2})\]/);
            if (match && match[1]) {
              blogDate = match[1];
              break;
            }
          }
        }
        
        // blogDateが見つからない場合は作成日時を使用
        if (!blogDate && link.created) {
          const createdDate = new Date(link.created * 1000); // Unix timestampをDateオブジェクトに変換
          const year = createdDate.getFullYear();
          const month = String(createdDate.getMonth() + 1).padStart(2, '0');
          const day = String(createdDate.getDate()).padStart(2, '0');
          blogDate = `${year}-${month}-${day}`;
        }
        
        // それでも日付がない場合は現在日付をデフォルトとする
        if (!blogDate) {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          blogDate = `${year}-${month}-${day}`;
        }
        
        // 画像URL（必ず存在する）
        const imageUrl = link.image;
        
        // 説明文の処理
        let preview = '内容がありません...';
        if (link.descriptions && link.descriptions.length > 0) {
          // 複数の説明文を結合
          preview = link.descriptions
            .filter(desc => {
              // 画像リンクを含む行を除外
              if (/\[https?:\/\/.*?\.(png|jpg|jpeg|gif)]/i.test(desc)) return false;
              
              // gyazoリンクを含む行を除外
              if (/\[https?:\/\/.*?gyazo\.com/i.test(desc)) return false;
              
              // country:リンクを除外
              if (desc.startsWith('[cc')) return false;
              
              // blogタグを含む行を除外
              if (desc.includes('[blog]:')) return false;
              
              return true;
            })
            .join(' ')
            .substring(0, 100) + '...';
        }
        
        return {
          title: link.title,
          image: imageUrl,
          preview: preview,
          blogDate: blogDate,
          // 作成日のUnixタイムスタンプも保持（ソート用）
          created: link.created || 0,
          url: `https://scrapbox.io/gyoku-log/${encodeURIComponent(link.title)}`
        };
      });
    
    // 日付でソート（blogDateが同じ場合は作成日でソート）
    blogArticles.sort((a, b) => {
      if (a.blogDate > b.blogDate) return -1;
      if (a.blogDate < b.blogDate) return 1;
      // blogDateが同じ場合は作成日の降順
      return b.created - a.created;
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