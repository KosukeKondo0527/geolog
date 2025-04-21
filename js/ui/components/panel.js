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
 * Scrapboxリンクボタンを作成する
 * @param {string} countryCode - 国コード
 * @returns {HTMLElement} - リンクボタン
 */
export function createScrapboxLinkButton(countryCode) {
  const scrapboxLink = document.createElement('a');
  scrapboxLink.href = `https://scrapbox.io/gyoku-log/cc${countryCode}`;
  scrapboxLink.innerHTML = `<i class="bi bi-box-arrow-up-right me-1"></i>Scrapboxで詳細を見る`;
  scrapboxLink.target = '_blank';
  scrapboxLink.className = 'btn btn-outline-info d-block mx-auto mt-4';
  return scrapboxLink;
}