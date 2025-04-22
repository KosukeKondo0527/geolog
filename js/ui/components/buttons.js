import { getCurrentCountry } from '../../geo/locationService.js';

/**
 * Scrapboxリンクボタンを作成する
 * @param {string} countryCode - 国コード
 * @param {string} countryName - 国名
 * @returns {HTMLElement} - リンクボタン
 */
export function createScrapboxLinkButton(countryCode, countryName = '') {
  // 現在の日付と時間を取得してフォーマット
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  // 日付のみの形式
  const dateStr = `${year}-${month}-${day}`;
  
  // 日付と時刻を含む形式（本文1行目用）
  const dateTimeStr = `${year}-${month}-${day} ${hour}:${minute}`;
  
  // タイトルに国名を含める
  const newPageName = `${countryName || countryCode}-${dateStr}`;
  
  // タイムゾーン
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 
                   now.toString().match(/\(([^)]+)\)/)?.[1] || 
                   'UTC' + (now.getTimezoneOffset() / -60);
  
  // 国旗絵文字のマッピング
  const countryCodeToEmoji = (code) => {
    // 国コードを地域表示子に変換
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    // 絵文字に変換
    return String.fromCodePoint(...codePoints);
  };
  
  // 国旗絵文字を取得
  const emoji = countryCodeToEmoji(countryCode);
  
  // 本文の構成:
  const initialBodyText = encodeURIComponent(
    `${emoji} ${countryCode} ${dateTimeStr} ${timezone}\n[cc${countryCode}]\n\n`
  );
  
  // 新規ページ作成リンクを生成
  const scrapboxLink = document.createElement('a');
  scrapboxLink.href = `https://scrapbox.io/gyoku-log/${encodeURIComponent(newPageName)}?body=${initialBodyText}`;
  scrapboxLink.innerHTML = `<i class="bi bi-box-arrow-up-right me-1"></i>新規記事を作成`;
  scrapboxLink.target = '_blank';
  scrapboxLink.className = 'btn btn-outline-info d-block mx-auto mt-4';
  
  return scrapboxLink;
}

/**
 * 現在地の国向けScrapboxリンクボタンを作成する
 * @returns {HTMLElement} - リンクボタン
 */
export function createCurrentLocationButton() {
  const locationButton = document.createElement('button');
  locationButton.className = 'btn btn-outline-warning d-block mx-auto mt-2';
  locationButton.innerHTML = `<i class="bi bi-geo-alt me-1"></i>現在地の国で記事を作成`;
  
  locationButton.addEventListener('click', async () => {
    try {
      locationButton.disabled = true;
      locationButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 位置情報を取得中...`;
      
      // 現在の国コードを取得
      const countryCode = await getCurrentCountry();
      
      if (!countryCode) {
        alert('現在位置から国を特定できませんでした');
        return;
      }
      
      // 国名を取得（オプション）
      let countryName = '';
      try {
        const feature = map.getSource('visited-countries').data.features.find(
          f => f.properties.code === countryCode
        );
        if (feature) {
          countryName = feature.properties.name;
        }
      } catch (e) {
        console.error('国名の取得に失敗:', e);
      }
      
      // 通常の記事作成リンクと同じロジックで記事作成ページへ移動
      const scrapboxLink = createScrapboxLinkButton(countryCode, countryName);
      scrapboxLink.click();
      
    } catch (error) {
      alert(`エラー: ${error.message}`);
    } finally {
      locationButton.disabled = false;
      locationButton.innerHTML = `<i class="bi bi-geo-alt me-1"></i>現在地の国で記事を作成`;
    }
  });
  
  return locationButton;
}