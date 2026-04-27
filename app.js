import PasswordQualityCalculator from './Lib/PasswordQualityCalculator.js';

const passwordInput = document.getElementById('password');
const entropyBitsEl = document.getElementById('entropyBits');
const dictStatusEl = document.getElementById('dictStatus');

function evaluate() {
  const pwd = passwordInput.value ?? '';
  const bits = PasswordQualityCalculator(pwd);
  entropyBitsEl.textContent = String(bits);
}

async function tryLoadPopularPasswordDictionary() {
  try {
    const res = await fetch('./Lib/MostPopularPasswords.txt', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const list = text
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter(Boolean);

    const PopularPasswords = PasswordQualityCalculator?.PopularPasswords;
    if (!PopularPasswords || typeof PopularPasswords.load !== 'function') {
      dictStatusEl.textContent = '常见密码词典：不可用（不影响基础评估）';
      return;
    }

    PopularPasswords.load(list);
    dictStatusEl.textContent = `常见密码词典：已加载（${list.length} 条）`;
  } catch {
    dictStatusEl.textContent = '常见密码词典：未加载（不影响基础评估）';
  }
}

passwordInput.addEventListener('input', evaluate);

evaluate();
tryLoadPopularPasswordDictionary();
