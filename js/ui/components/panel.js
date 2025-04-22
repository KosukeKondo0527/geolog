import { lookupCountryFromCoords } from '../../geo/locationService.js';

/**
 * オフキャンバスパネルを表示する
 * @param {string} id - パネルのID
 */
export function showOffcanvasPanel(id = 'infoPanel') {
  try {
    // まずMDBの方法で試す
    if (typeof mdb !== 'undefined' && mdb.Offcanvas) {
      const offcanvas = new mdb.Offcanvas(document.getElementById(id));
      offcanvas.show();
    } else {
      // フォールバックとしてBootstrapのOffcanvasを使用
      const offcanvas = new bootstrap.Offcanvas(document.getElementById(id));
      offcanvas.show();
    }
  } catch (error) {
    console.warn('Offcanvas初期化エラー:', error);
    // 直接DOMメソッドを使用してパネルを表示
    document.getElementById(id).classList.add('show');
  }
}

/**
 * 空の状態メッセージを生成する
 * @param {string} message - 表示メッセージ
 * @returns {HTMLElement} - メッセージ要素
 */
export function createEmptyStateMessage(message) {
  const noContent = document.createElement('div');
  noContent.className = 'alert alert-secondary text-center';
  noContent.innerText = message || 'この国の投稿はありません。';
  return noContent;
}

/**
 * 現在地情報をlocalStorageから取得
 * @returns {Object|null} 現在地情報またはnull
 */
function getLocationFromCache() {
  const cached = localStorage.getItem('currentLocationData');
  if (cached) {
    try {
      const data = JSON.parse(cached);
      // キャッシュの有効期限を24時間とする
      if (data.timestamp && (Date.now() - data.timestamp < 24 * 60 * 60 * 1000)) {
        return data;
      }
    } catch (e) {
      console.error('キャッシュデータの解析エラー:', e);
    }
  }
  return null;
}

/**
 * 現在地情報をlocalStorageに保存
 * @param {string} countryCode - 国コード
 * @param {string} countryName - 国名（オプション）
 */
function saveLocationToCache(countryCode, countryName = '') {
  const data = {
    countryCode,
    countryName,
    timestamp: Date.now()
  };
  localStorage.setItem('currentLocationData', JSON.stringify(data));
}

/**
 * ISO 8601準拠のUTCオフセット文字列を返す
 * @returns {string} UTC±HH:MM形式のタイムゾーン文字列
 */
function getISOTimezoneOffset() {
  const date = new Date();
  const offsetMinutes = date.getTimezoneOffset();
  const absOffsetMinutes = Math.abs(offsetMinutes);
  
  const hours = Math.floor(absOffsetMinutes / 60);
  const minutes = absOffsetMinutes % 60;
  
  const sign = offsetMinutes <= 0 ? '+' : '-';
  
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}