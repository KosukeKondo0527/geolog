import { getISO2Code, getCountryName } from './utils.js';

/**
 * 地理データを拡張して国のプロパティを追加
 */
export function enhanceGeoData(worldGeoJson, codeToDays, codeToPosts) {
  return {
    type: 'FeatureCollection',
    features: worldGeoJson.features.map(f => {
      const code = getISO2Code(f.properties);
      const name = getCountryName(f.properties);
      const days = codeToDays[code] ?? 0;
      const urls = codeToPosts[code] ?? [];
      
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
}

/**
 * 地図のレイヤーを追加
 */
export function addMapLayers(map, enhancedGeoJson) {
  // 国データのソース追加
  map.addSource('visited-countries', {
    type: 'geojson',
    data: enhancedGeoJson
  });

  // 滞在日数グラデーション塗りつぶし
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

  // 未訪問国の枠線
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

  // 訪問済み国の枠線
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
  
  // 滞在日数ラベル用のデータを作成
  const labelFeatures = createLabelFeatures(enhancedGeoJson);
  
  // ラベルのソース追加
  map.addSource('stay-labels', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: labelFeatures
    }
  });

  // 滞在日数ラベル
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
}

/**
 * ラベル用の特徴点を作成
 */
function createLabelFeatures(enhancedGeoJson) {
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
  
  return labelFeatures;
}