import { fetchStayData, fetchGeoData } from './dataService.js';
import { initializeMap } from './mapConfig.js';
import { enhanceGeoData, addMapLayers } from './mapLayers.js';
import { setupMapEvents, hideLoadingOverlay } from './ui/uiController.js';

// アプリケーション初期化
async function initApp() {
  // 地図の初期化
  const map = initializeMap();
  
  // マップのロード完了時
  map.on('load', async () => {
    try {
      // データの取得
      const stayData = await fetchStayData();
      const worldGeoJson = await fetchGeoData();
      
      // データの整形
      const codeToDays = Object.fromEntries(stayData.map(d => [d.code, d.days]));
      const codeToPosts = Object.fromEntries(stayData.map(d => [d.code, d.instas]));
      
      // 地理データの拡張
      const enhancedGeoJson = enhanceGeoData(worldGeoJson, codeToDays, codeToPosts);
      
      // レイヤーの追加
      addMapLayers(map, enhancedGeoJson);
      
      // イベントハンドラの設定
      setupMapEvents(map);
      
      // ローディングオーバーレイを非表示
      hideLoadingOverlay();
    } catch (error) {
      console.error('アプリケーション初期化エラー:', error);
      alert('マップデータの読み込みに失敗しました。ページを更新してください。');
    }
  });
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', initApp);