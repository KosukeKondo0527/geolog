import { isProduction } from './utils.js';

/**
 * Mapbox GL マップのインスタンスを初期化
 */
export function initializeMap() {
  // APIキーの設定
  if (isProduction()) {
    mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY;
  } else {
    mapboxgl.accessToken = SECRET.MAPBOX_API_KEY_DEV;
  }
  
  // 地図インスタンスの作成
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ko2ke/cm9q4nl5d006t01s02gas72xe',
    center: [20, 30],
    zoom: 2,
    renderWorldCopies: true
  });
  
  return map;
}