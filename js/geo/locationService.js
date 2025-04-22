/**
 * 現在地情報を取得し、対応する国コードを特定
 * @returns {Promise<string>} 国コード(例: "JP")
 */
export async function getCurrentCountry() {
  return new Promise((resolve, reject) => {
    // 位置情報の取得をサポートしているか確認
    if (!navigator.geolocation) {
      reject(new Error("お使いのブラウザは位置情報をサポートしていません"));
      return;
    }

    // 位置情報を取得
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // 地図のデータを使って位置情報から国コードを特定
        const countryCode = lookupCountryFromCoords(lat, lng);
        resolve(countryCode);
      },
      (error) => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("位置情報へのアクセスが拒否されました"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("位置情報が取得できませんでした"));
            break;
          case error.TIMEOUT:
            reject(new Error("位置情報の取得がタイムアウトしました"));
            break;
          default:
            reject(new Error("不明なエラーが発生しました"));
            break;
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  });
}

/**
 * 座標から国コードを検索
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @returns {string} 国コード
 */
export function lookupCountryFromCoords(lat, lng) {
  console.log(`位置情報を検索: ${lat}, ${lng}`);
  
  // turf.jsを使用して点がどの国のポリゴン内にあるか判定
  const point = turf.point([lng, lat]);
  
  try {
    // map オブジェクトがグローバルで利用可能か確認
    if (!window.map) {
      console.error('地図が初期化されていません');
      return null;
    }
    
    // マップソースが存在するか確認
    const source = window.map.getSource('visited-countries');
    if (!source) {
      console.error('visited-countriesソースが見つかりません');
      console.log('利用可能なソース:', Object.keys(window.map.style._layers).join(', '));
      return null;
    }
    
    // データへのアクセス方法を修正 (_dataプロパティを直接使用)
    if (!source._data) {
      console.error('ソースデータが見つかりません (_dataプロパティがありません)');
      console.log('ソース情報:', source);
      return null;
    }
    
    const geoJsonData = source._data;
    
    if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
      console.error('features配列が見つかりません');
      console.log('geoJsonData:', geoJsonData);
      return null;
    }
    
    console.log(`検索対象の地物数: ${geoJsonData.features.length}`);
    
    // ポイントが含まれる国を検索
    for (const feature of geoJsonData.features) {
      if (!feature.geometry) continue;
      
      try {
        if (turf.booleanPointInPolygon(point, feature)) {
          const countryCode = feature.properties.code;
          console.log(`国コードを特定: ${countryCode}`);
          return countryCode;
        }
      } catch (e) {
        console.warn(`国のチェックでエラー: ${feature.properties?.name || '不明'}`, e);
        continue;
      }
    }
    
    console.warn('位置が海上または国境外です');
    return null;
  } catch (error) {
    console.error('国コード検索中にエラーが発生しました:', error);
    return null;
  }
}