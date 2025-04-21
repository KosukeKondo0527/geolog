// main.js

// モックデータ（実際のAPIが利用可能になるまでのプレースホルダー）
const mockScrapboxData = {
  "JP": [
    {
      title: "東京の思い出",
      image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26",
      preview: "日本の首都である東京を訪れた際の記録です。スカイツリーや渋谷のスクランブル交差点など、様々な観光スポットを巡りました...",
      url: "https://scrapbox.io/ko2ke-log/東京の思い出"
    },
    {
      title: "京都旅行2024",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      preview: "歴史ある寺社仏閣が多く残る京都。金閣寺や清水寺を訪れ、日本の伝統文化に触れる機会となりました...",
      url: "https://scrapbox.io/ko2ke-log/京都旅行2024"
    }
  ],
  "US": [
    {
      title: "ニューヨーク観光",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9",
      preview: "マンハッタンを中心に、自由の女神やセントラルパークなど有名な観光地を巡りました...",
      url: "https://scrapbox.io/ko2ke-log/ニューヨーク観光"
    }
  ]
};

// Scrapbox記事を取得する関数を更新
async function fetchScrapboxArticles(countryCode) {
  try {
    // 指定されたCORSプロキシを使用
    const proxyUrl = 'https://cors-ploxy.desunokora527.workers.dev/';
    
    // まず、country:${countryCode}ページのJSONデータを取得
    const pageUrl = `https://scrapbox.io/api/pages/ko2ke-log/country:${countryCode}`;
    console.log(`国ページURL: ${pageUrl}`);
    
    const pageResponse = await fetch(proxyUrl + pageUrl);
    
    if (!pageResponse.ok) {
      console.error(`country:${countryCode}ページの取得に失敗しました`, pageResponse.status);
      return [];
    }
    
    const pageData = await pageResponse.json();
    console.log('国ページデータ:', pageData);
    
    // relatedPages.links1hopから関連記事を抽出
    if (!pageData.relatedPages || !pageData.relatedPages.links1hop || pageData.relatedPages.links1hop.length === 0) {
      console.log(`country:${countryCode}に関連するページはありません`);
      return [];
    }
    
    // 関連ページからデータを抽出 (30文字以下の説明は除外)
    const articles = pageData.relatedPages.links1hop
      .filter(link => {
        // country:で始まるタイトルは除外
        if (link.title.startsWith('country:')) return false;
        
        // descriptions配列を確認
        if (!link.descriptions || link.descriptions.length === 0) return false;
        
        // 全descriptionsを結合した文字数をカウント
        const totalLength = link.descriptions.join('').length;
        
        // 30文字以下なら除外
        return totalLength > 30;
      })
      .map(link => {
        const pageTitle = link.title;
        const imageUrl = link.image || '';
        
        // 説明文の処理
        let preview = '内容がありません...';
        if (link.descriptions && link.descriptions.length > 0) {
          // 複数の説明文を結合
          preview = link.descriptions
            .filter(desc => !desc.startsWith('[country:')) // country:リンクは除外
            .join(' ')
            .substring(0, 100) + '...';
        }
        
        return {
          title: pageTitle,
          image: imageUrl,
          preview: preview,
          url: `https://scrapbox.io/ko2ke-log/${encodeURIComponent(pageTitle)}`
        };
      });
    
    return articles;
    
  } catch (error) {
    console.error('Scrapboxデータの取得中にエラーが発生しました:', error);
    console.log('モックデータにフォールバック');
    return mockScrapboxData[countryCode] || [];
  }
}

function getISO2Code(props) {
    const raw = props.code || props["ISO3166-1-Alpha-2"] || props["iso_3166_1"] || props["iso_3166_1_alpha_2"] || null;
    if (raw === "CN-TW") return "TW";
    return raw;
  }
  
  function getCountryName(props) {
    return props["name_en"] || props["ADMIN"] || props["name"] || "Unknown";
  }
  
  const isProd = window.location.hostname.includes('github.io') || 
                 window.location.hostname.includes('yourdomain.com') ||
                 !window.location.hostname.includes('localhost');
  
  if (isProd) {
    mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY;
  } else {
    mapboxgl.accessToken = SECRET.MAPBOX_API_KEY_DEV;
  }
  
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ko2ke/cm9q4nl5d006t01s02gas72xe',
    center: [20, 30],
    zoom: 2,
    renderWorldCopies: true
  });
  
  async function fetchStayData() {
    const res = await fetch(CONFIG.DATA_API_URL);
    return await res.json();
  }
  
  map.on('load', async () => {
    const stayData = await fetchStayData();
    const codeToDays = Object.fromEntries(stayData.map(d => [d.code, d.days]));
    const codeToPosts = Object.fromEntries(stayData.map(d => [d.code,d.instas]));
  
    const res = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
    const worldGeoJson = await res.json();
  
    const enhancedGeoJson = {
      type: 'FeatureCollection',
      features: worldGeoJson.features.map(f => {
        const code = getISO2Code(f.properties);
        const name = getCountryName(f.properties);
        const days = codeToDays[code] ?? 0;
        const urls = codeToPosts[code] ?? [];
        if (urls.length > 0) {
            console.log(urls);
        }
        return {
          ...f,
          properties: {
            ...f.properties,
            code,
            name,
            stayDays: days,
          }
        };
      })
    };
  
    map.addSource('visited-countries', {
      type: 'geojson',
      data: enhancedGeoJson
    });
  
    map.addLayer({
      id: 'visited-fill-gradient',
      type: 'fill',
      source: 'visited-countries',
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['get', 'stayDays'],
          0, '#eeeeee', 10, '#4dd0e1', 30, '#00acc1', 60, '#006064'
        ],
        'fill-opacity': 0.8,
        'fill-outline-color': '#ffffff'
      }
    });

    map.addLayer({
        id: 'unvisited-outline',
        type: 'line',
        source: 'visited-countries',
        filter: ['<=', ['get', 'stayDays'], 0],
        paint: {
          'line-color': '#888888',
          'line-width': 0.5
        }
    });
  
    map.addLayer({
        id: 'visited-outline',
        type: 'line',
        source: 'visited-countries',
        filter: ['>', ['get', 'stayDays'], 0],
        paint: {
          'line-color': '#00FF88',
          'line-width': 0.5
        }
    });


  
    const labelFeatures = [];
    const seenCodes = new Set();
    enhancedGeoJson.features.forEach(f => {
      const props = f.properties;
      const code = props.code;
      const days = props.stayDays;
      const name = props.name;
      if (!seenCodes.has(code) && days > 0) {
        const center = turf.centroid(f);
        center.properties = { stayDays: days, name };
        labelFeatures.push(center);
        seenCodes.add(code);
      }
    });
  
    map.addSource('stay-labels', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: labelFeatures
      }
    });
  
    map.addLayer({
      id: 'stay-days-large-label',
      type: 'symbol',
      source: 'stay-labels',
      layout: {
        'text-field': ['concat', ['get', 'stayDays'], 'd'],
        'text-font': ['Open Sans Bold'],
        'text-size': 19,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    });
  
    map.on('click', 'visited-fill-gradient', async (e) => {
      const props = e.features[0].properties;
      console.log(props);
      const code = props.code;
      const name = props.name;
      
      const panelTitle = document.getElementById('panelTitle');
      const panelBody = document.getElementById('panelBody');
      panelTitle.innerText = name;
      
      // ローディング表示
      panelBody.innerHTML = '<div class="d-flex justify-content-center my-5"><div class="spinner-border text-info" role="status"><span class="visually-hidden">読み込み中...</span></div></div>';
      
      // パネルを先に表示
      try {
        // まずMDBの方法で試す
        if (typeof mdb !== 'undefined' && mdb.Offcanvas) {
          const offcanvas = new mdb.Offcanvas(document.getElementById('infoPanel'));
          offcanvas.show();
        } else {
          // フォールバックとしてBootstrapのOffcanvasを使用
          const offcanvas = new bootstrap.Offcanvas(document.getElementById('infoPanel'));
          offcanvas.show();
        }
      } catch (error) {
        console.warn('Offcanvas初期化エラー:', error);
        // 直接DOMメソッドを使用してパネルを表示
        document.getElementById('infoPanel').classList.add('show');
      }
           
      // Scrapbox記事を取得（新機能）
      const scrapboxArticles = await fetchScrapboxArticles(code);
      
      // パネル内容をクリア
      panelBody.innerHTML = '';
      
      // Scrapbox記事があれば表示
      if (scrapboxArticles.length > 0) {
        // スクロール可能なコンテナを作成
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'overflow-auto' // mdbのスクロールクラス
        cardsContainer.style.maxHeight = '70vh'; // 唯一のカスタムスタイル
        
        scrapboxArticles.forEach(article => {
          // mdbのカードコンポーネントを作成
          const card = document.createElement('div');
          card.className = 'card bg-dark text-white border-secondary mb-3';
          
          let cardHTML = '';
          
          // 画像があれば表示（カードの上部）
          if (article.image) {
            cardHTML += `<img src="${article.image}" class="card-img-top" style="height: 160px; object-fit: cover;" alt="${article.title}">`;
          }
          
          // カード本文
          cardHTML += `
            <div class="card-body">
              <h5 class="card-title">${article.title}</h5>
              <p class="card-text small">${article.preview}</p>
              <a href="${article.url}" class="btn btn-sm btn-outline-info" target="_blank">記事を読む</a>
            </div>
          `;
          
          card.innerHTML = cardHTML;
          
          // カードをクリック可能にするラッパーで囲む
          const cardWrapper = document.createElement('a');
          cardWrapper.href = article.url;
          cardWrapper.target = '_blank';
          cardWrapper.className = 'text-decoration-none';
          cardWrapper.appendChild(card);
          
          cardsContainer.appendChild(cardWrapper);
        });
        
        panelBody.appendChild(cardsContainer);
      }  else {
        // 何も投稿がない場合
        const noContent = document.createElement('div');
        noContent.className = 'alert alert-secondary text-center';
        noContent.innerText = 'この国の投稿はありません。';
        panelBody.appendChild(noContent);
      }
      
      // Scrapboxへのリンク（既存機能を改良）
      const scrapboxLink = document.createElement('a');
      scrapboxLink.href = `https://scrapbox.io/ko2ke-log/country:${code}`;
      scrapboxLink.innerHTML = `<i class="bi bi-box-arrow-up-right me-1"></i>Scrapboxで詳細を見る`;
      scrapboxLink.target = '_blank';
      scrapboxLink.className = 'btn btn-outline-info d-block mx-auto mt-4';
      panelBody.appendChild(scrapboxLink); 
    });
  
    map.on('mouseenter', 'visited-fill-gradient', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'visited-fill-gradient', () => {
      map.getCanvas().style.cursor = '';
    });
  
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('d-none');
  });
