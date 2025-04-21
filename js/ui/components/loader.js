/**
 * ローディングスピナーを作成する
 * @returns {HTMLElement} - スピナー要素
 */
export function createLoadingSpinner() {
  const spinnerContainer = document.createElement('div');
  spinnerContainer.className = 'd-flex justify-content-center my-5';
  
  const spinner = document.createElement('div');
  spinner.className = 'spinner-border text-info';
  spinner.setAttribute('role', 'status');
  
  const srText = document.createElement('span');
  srText.className = 'visually-hidden';
  srText.textContent = '読み込み中...';
  
  spinner.appendChild(srText);
  spinnerContainer.appendChild(spinner);
  
  return spinnerContainer;
}

/**
 * ローディングオーバーレイの表示・非表示を切り替える
 * @param {boolean} show - 表示する場合はtrue
 */
export function toggleLoadingOverlay(show) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    if (show) {
      loadingOverlay.classList.remove('d-none');
    } else {
      loadingOverlay.classList.add('d-none');
    }
  }
}