import { lookupCountryFromCoords } from '../../geo/locationService.js';

/**
 * 現在地情報をlocalStorageから取得
 * @returns {Object|null} 現在地情報またはnull
 */
function getLocationFromCache() {
    console.log('getLocationFromCache が呼び出されました');
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
 * @param {Object} locationData - 位置情報
 */
function saveLocationToCache(locationData) {
    console.log('saveLocationToCache が呼び出されました');
  localStorage.setItem('currentLocationData', JSON.stringify(locationData));
}

/**
 * 現在地の自動取得
 * @returns {Promise<Object|null>} 現在地情報またはnull
 */
export async function autoDetectLocation() {
  console.log('現在地の自動取得を開始...');
  
  // まずキャッシュをチェック
  const cachedLocation = getLocationFromCache();
  if (cachedLocation) {
    console.log('キャッシュから位置情報を取得:', cachedLocation);
    return cachedLocation;
  }
  
  // キャッシュがなければ位置情報を取得試行
  try {
    // ブラウザがサポートしていなければ終了
    if (!navigator.geolocation) {
      console.log('位置情報がサポートされていません');
      return null;
    }
    
    // マップが準備されているか確認
    if (!window.map || !window.map.getSource('visited-countries')) {
      console.log('マップデータがまだ準備できていません');
      return null;
    }
    
    // 位置情報を取得
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, 
        (error) => {
          console.log('自動位置取得エラー:', error.message);
          reject(error);
        }, {
          enableHighAccuracy: false,  // バッテリー消費を抑えるため精度は下げる
          timeout: 5000,              // タイムアウトを短く設定
          maximumAge: 60000           // 1分以内のキャッシュは許容
        });
    });
    
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    console.log(`自動取得した位置情報: ${lat}, ${lng}`);
    
    // 国コードを特定
    const countryCode = lookupCountryFromCoords(lat, lng);
    if (!countryCode) {
      console.log('国を特定できませんでした');
      return null;
    }
    
    // 国名を取得
    let countryName = '';
    try {
      const feature = window.map.getSource('visited-countries')._data.features.find(
        f => f.properties.code === countryCode
      );
      if (feature) {
        countryName = feature.properties.name;
      }
    } catch (e) {
      console.log('国名の取得に失敗:', e);
    }
    
    // キャッシュに保存
    const locationData = {
      countryCode,
      countryName,
      coords: {
        latitude: lat,
        longitude: lng
      },
      timestamp: Date.now()
    };
    
    saveLocationToCache(locationData);
    console.log('位置情報を自動取得しキャッシュしました:', locationData);
    
    return locationData;
  } catch (error) {
    console.log('自動位置取得に失敗:', error);
    return null;
  }
}

/**
 * 現在地ボタンの初期化
 */
export async function initLocationButton() {
  console.log('initLocationButton が呼び出されました');
  
  const locationButton = document.getElementById('currentLocationButton');
  const locationDisplayText = document.getElementById('locationDisplayText');
  const writeLogBtnContainer = document.getElementById('writeLogBtnContainer');
  
  if (!locationButton || !locationDisplayText || !writeLogBtnContainer) {
    console.error('必要な要素が見つかりません');
    return;
  }
  
  // 現在地の自動取得
  const locationData = await autoDetectLocation();
  
  if (locationData) {
    // 現在地ボタンを更新
    updateLocationDisplay(locationDisplayText, locationData.countryCode, locationData.countryName);
    locationButton.classList.remove('btn-dark');
    locationButton.classList.add('btn-outline-info');
    
    // Write Logボタンの作成
    createWriteLogButton(writeLogBtnContainer, locationData);
  }
  
  // 現在地ボタンのクリックイベント
  console.log('クリックイベントを登録中...');
  locationButton.addEventListener('click', async () => {
    console.log('ボタンがクリックされました');
    try {
      // ボタンを無効化
      locationButton.disabled = true;
      locationDisplayText.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 取得中...';
      
      // マップデータが準備されているか確認
      if (!window.map || !window.map.isStyleLoaded() || !window.map.getSource('visited-countries')) {
        throw new Error('地図データがまだ準備できていません。しばらくしてから試してください。');
      }
      
      // 位置情報の取得
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // 国コードを特定
      const countryCode = lookupCountryFromCoords(lat, lng);
      if (!countryCode) {
        throw new Error('国を特定できませんでした');
      }
      
      // 国名を取得
      let countryName = '';
      try {
        const feature = window.map.getSource('visited-countries')._data.features.find(
          f => f.properties.code === countryCode
        );
        if (feature) {
          countryName = feature.properties.name;
        }
      } catch (e) {
        console.error('国名の取得に失敗:', e);
      }
      
      // キャッシュに保存（座標情報を含めて保存）
      const locationData = {
        countryCode,
        countryName,
        coords: {
          latitude: lat,
          longitude: lng
        },
        timestamp: Date.now()
      };
      
      saveLocationToCache(locationData);
      
      // 表示を更新
      updateLocationDisplay(locationDisplayText, countryCode, countryName);
      
      // ボタンスタイル更新
      locationButton.classList.remove('btn-dark');
      locationButton.classList.add('btn-outline-info');
      
      // Write Logボタンの更新または作成
      createWriteLogButton(writeLogBtnContainer, locationData);
      
      // トースト通知
      showToast('success', `現在地（${countryName || countryCode}）を取得しました`);
      
    } catch (error) {
      console.error('位置情報エラー:', error);
      locationDisplayText.innerHTML = `<i class="bi bi-exclamation-triangle"></i> エラー`;
      showToast('danger', error.message);
      
      // 3秒後にリセット
      setTimeout(() => {
        const cached = getLocationFromCache();
        if (cached && cached.countryCode) {
          updateLocationDisplay(locationDisplayText, cached.countryCode, cached.countryName);
        } else {
          locationDisplayText.innerHTML = `<i class="bi bi-geo-alt"></i> 現在地を取得`;
        }
      }, 3000);
    } finally {
      locationButton.disabled = false;
    }
  });
  console.log('クリックイベント登録完了');
}

/**
 * Write Logボタンを作成または更新
 */
function createWriteLogButton(container, locationData) {
  // 既存のボタンがあれば削除
  container.innerHTML = '';
  
  // 新しいボタンを作成
  const writeLogBtn = document.createElement('button');
  
  // レスポンシブなクラス名設定
  const isMobile = window.matchMedia('(max-width: 576px)').matches;
  
  // モバイルならより小さなボタンに
  writeLogBtn.className = `btn btn-success ${isMobile ? 'btn-sm' : 'btn-sm'} rounded-pill shadow-sm d-flex align-items-center justify-content-center`;
  
  writeLogBtn.innerHTML = `
    <i class="bi bi-pencil-fill ${isMobile ? '' : 'me-2'}"></i>
    <span ${isMobile ? 'class="d-none d-sm-inline"' : ''}>Write Log</span>
  `;
  
  // クリックイベント
  writeLogBtn.addEventListener('click', () => {
    openScrapboxWithLocation(locationData);
  });
  
  container.appendChild(writeLogBtn);
}

/**
 * 位置情報付きでScrapboxを開く
 */
async function openScrapboxWithLocation(existingData) {
  try {
    let locationData = existingData;
    let freshLocation = false;
    
    // 新しい位置情報の取得を試みる
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        });
      });
      
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // 国コードを特定
      const countryCode = lookupCountryFromCoords(lat, lng);
      if (countryCode) {
        // 国名を取得
        let countryName = '';
        try {
          const feature = window.map.getSource('visited-countries')._data.features.find(
            f => f.properties.code === countryCode
          );
          if (feature) {
            countryName = feature.properties.name;
          }
        } catch (e) {
          console.error('国名の取得に失敗:', e);
        }
        
        locationData = {
          countryCode,
          countryName,
          coords: {
            latitude: lat,
            longitude: lng
          },
          timestamp: Date.now()
        };
        
        freshLocation = true;
        saveLocationToCache(locationData);
      }
    } catch (error) {
      console.log('最新の位置情報取得に失敗。キャッシュデータを使用します:', error);
      // エラーの場合は既存データを使用するので何もしない
    }
    
    // 現在の日付と時間を取得してフォーマット
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    // 日付と時刻
    const dateStr = `${year}-${month}-${day}`;
    const dateTimeStr = `${year}-${month}-${day} ${hour}:${minute}`;

    const newPageName = `${locationData.countryName || locationData.countryCode}-${dateStr}`;
    
    // タイムゾーン - ISO形式に変更
    const timezone = getISOTimezoneOffset();
    
    // 国旗絵文字のマッピング
    const countryCodeToEmoji = (countryCode) => {
      // 国コードを地域表示子に変換
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
      
      // 絵文字に変換
      return String.fromCodePoint(...codePoints);
    };
    
    // Google Maps座標リンク
    const mapsLink = (coords) => {
      if (!coords) return '';
      return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    };
    
    // 本文の作成
    const emoji = countryCodeToEmoji(locationData.countryCode);
    let body = `${emoji} ${locationData.countryCode} ${dateTimeStr} ${timezone}\n`;
    
    // 座標情報が含まれていれば追加
    if (locationData.coords) {
      body += `[${mapsLink(locationData.coords)} ${locationData.coords.latitude.toFixed(6)},${locationData.coords.longitude.toFixed(6)}]\n`;
    }
    
    // 国コードタグ
    body += `[cc${locationData.countryCode}]\n\n`;
    
    // Scrapboxを開く
    const encodedBody = encodeURIComponent(body);
    window.open(`https://scrapbox.io/gyoku-log/${newPageName}?body=${encodedBody}`, '_blank');
    
    // 成功メッセージ
    if (freshLocation) {
      showToast('success', `最新の位置情報で記録を作成しました`);
    } else {
      showToast('info', `キャッシュした位置情報で記録を作成しました`);
    }
    
  } catch (error) {
    console.error('Scrapbox作成エラー:', error);
    showToast('danger', `エラー: ${error.message}`);
  }
}

/**
 * 場所表示を国旗付きで更新
 */
function updateLocationDisplay(element, countryCode, countryName = '') {
  element.innerHTML = `
    <img src="https://flagcdn.com/w20/${countryCode.toLowerCase()}.png" 
         alt="${countryCode} flag" 
         class="me-2" 
         style="height: 15px; width: auto;"> 
    ${countryName || countryCode}
  `;
}

/**
 * トースト通知を表示
 */
function showToast(type, message) {
  const toastContainer = document.getElementById('toastContainer') || document.body;
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  try {
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  } catch (e) {
    console.error('Toast 初期化エラー:', e);
    alert(message);
  }
  
  // 自動削除
  setTimeout(() => {
    try {
      toastContainer.removeChild(toast);
    } catch (e) {}
  }, 5000);
}

// タイムゾーン取得部分を修正
function getISOTimezoneOffset() {
  const date = new Date();
  
  // getTimezoneOffset()は分単位の値を返し、
  // 負の値はUTCより東（例: 日本は-540分 = UTC+9:00）
  // 正の値はUTCより西（例: アメリカ東部は300分 = UTC-5:00）を意味します
  const offsetMinutes = date.getTimezoneOffset();
  const absOffsetMinutes = Math.abs(offsetMinutes);
  
  // 時間と分に分解
  const hours = Math.floor(absOffsetMinutes / 60);
  const minutes = absOffsetMinutes % 60;
  
  // +/- の符号を決定（JavaScript の getTimezoneOffset() は逆の符号を返す）
  const sign = offsetMinutes <= 0 ? '+' : '-';
  
  // ISO 8601形式に整形 (UTC+HH:MM または UTC-HH:MM)
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}