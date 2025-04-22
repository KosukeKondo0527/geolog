import { fetchStayData, fetchGeoData } from './dataService.js';
import { initializeMap } from './mapConfig.js';
import { enhanceGeoData, addMapLayers } from './mapLayers.js';
import { setupMapEvents, hideLoadingOverlay } from './ui/uiController.js';
import { initLocationButton, autoDetectLocation } from './ui/components/locationButton.js';

// アプリケーション初期化
async function initApp() {
  // 地図の初期化
  window.map = initializeMap();

  console.log('initApp が呼び出されました');
  
  // マップのロード完了時
  map.on('load', async () => {
    try {
      // データの取得
      const stayData = await fetchStayData();
      const worldGeoJson = await fetchGeoData();
      
      // データの整形とレイヤー追加
      const codeToDays = Object.fromEntries(stayData.map(d => [d.code, d.days]));
      const codeToPosts = Object.fromEntries(stayData.map(d => [d.code, d.instas]));
      const enhancedGeoJson = enhanceGeoData(worldGeoJson, codeToDays, codeToPosts);
      addMapLayers(map, enhancedGeoJson);
      
      // イベントハンドラの設定
      setupMapEvents(map);
      
      // データの読み込みが完全に終わったことを確認するため短い遅延を入れる
      setTimeout(() => {
        console.log('マップデータ完全読み込み完了、現在地ボタンを初期化します');
        window.mapDataFullyLoaded = true; // グローバルフラグを設定
        
        // 現在地ボタンの初期化と自動位置取得
        initLocationButton();
        
        // ローディングオーバーレイを非表示
        hideLoadingOverlay();
      }, 500);
    } catch (error) {
      console.error('アプリケーション初期化エラー:', error);
      alert('マップデータの読み込みに失敗しました。ページを更新してください。');
      hideLoadingOverlay();
    }
  });
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', initApp);

// DOMContentLoadedイベントでの確認
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM完全に読み込まれました');
});