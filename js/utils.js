/**
 * 国のISO2コードを取得
 */
export function getISO2Code(props) {
  const raw = props.code || props["ISO3166-1-Alpha-2"] || props["iso_3166_1"] || props["iso_3166_1_alpha_2"] || null;
  if (raw === "CN-TW") return "TW";
  return raw;
}

/**
 * 国名を取得
 */
export function getCountryName(props) {
  return props["name_en"] || props["ADMIN"] || props["name"] || "Unknown";
}

/**
 * 環境が本番かどうか判定
 */
export function isProduction() {
  return window.location.hostname.includes('github.io') || 
         window.location.hostname.includes('yourdomain.com') ||
         !window.location.hostname.includes('localhost');
}