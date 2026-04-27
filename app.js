import PasswordQualityCalculator from './Lib/PasswordQualityCalculator.js';

const passwordInput = document.getElementById('password');
const eyeButton = document.getElementById('eyeButton');
const customCaret = document.getElementById('customCaret');
const passwordWrapper = document.querySelector('.password-wrapper');
const entropyValue = document.getElementById('entropyValue');
const entropyProgress = document.getElementById('entropyProgress');
const entropyBackground = document.querySelector('.entropy-ring-background');
const suggestionEl = document.getElementById('suggestion');
const modeButtons = document.querySelectorAll('.mode-button');
const textMeasureCanvas = document.createElement('canvas');
const textMeasureContext = textMeasureCanvas.getContext('2d');

// 随机提示文案
const placeholders = [
  '放心，所有计算均处于本地',
  '放心，开发者无法得到你的密码',
];

// 密码建议列表
const suggestions = [
  '使用大小写字母、数字和特殊字符的组合',
  '避免使用常见的单词或个人信息',
  '长度至少12个字符会大幅提升安全性',
  '定期更换密码可以提高账户安全',
  '避免在多个网站使用相同的密码',
  '密码中的每个额外字符都会指数级增加安全性',
  '使用密码管理器可以安全地保存复杂密码',
  '避免使用键盘上相邻的字符（如qwerty）',
];

// 根据熵值获取颜色
function getColorByEntropy(entropy) {
  if (entropy < 50) return '#ff3b30';    // 红色
  if (entropy < 100) return '#ffcc00';   // 黄色
  return '#34c759';                      // 绿色
}

// 初始化：设置随机placeholder
function initializeRandomPlaceholder() {
  const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
  passwordInput.placeholder = randomPlaceholder;
}

// 初始化：设置随机建议
function setRandomSuggestion() {
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  suggestionEl.textContent = randomSuggestion;
}

function getRenderedTextUntilCaret(inputEl, caretPos) {
  const rawText = (inputEl.value ?? '').slice(0, caretPos);
  if (inputEl.type === 'password') {
    return '•'.repeat(rawText.length);
  }
  return rawText;
}

function measureInputTextWidth(inputEl, text) {
  if (!textMeasureContext) return 0;
  const styles = window.getComputedStyle(inputEl);
  textMeasureContext.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
  const textWidth = textMeasureContext.measureText(text).width;
  const letterSpacing = Number.parseFloat(styles.letterSpacing) || 0;
  const spacingWidth = text.length > 1 ? letterSpacing * (text.length - 1) : 0;
  return textWidth + spacingWidth;
}

function updateCustomCaretPosition() {
  if (!customCaret || !passwordWrapper) return;

  const isFocused = document.activeElement === passwordInput;
  const hasSelection = passwordInput.selectionStart !== passwordInput.selectionEnd;
  const hasValue = (passwordInput.value ?? '').length > 0;
  if (!isFocused || hasSelection || !hasValue) {
    passwordWrapper.classList.remove('caret-visible');
    return;
  }

  const caretPos = passwordInput.selectionStart ?? 0;
  const renderedText = getRenderedTextUntilCaret(passwordInput, caretPos);
  const textWidth = measureInputTextWidth(passwordInput, renderedText);
  const styles = window.getComputedStyle(passwordInput);
  const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
  const maxLeft = passwordInput.clientWidth - paddingRight - 8;
  const left = Math.max(
    paddingLeft,
    Math.min(paddingLeft + textWidth - passwordInput.scrollLeft, maxLeft),
  );

  customCaret.style.left = `${left}px`;
  passwordWrapper.classList.add('caret-visible');
}

// 更新进度环
function updateEntropyRing(entropy) {
  // 计算进度（当强度达到100时，进度为满）
  const maxEntropy = 100;
  const progress = Math.min(entropy / maxEntropy, 1);
  const progressCircle = entropyProgress;
  const radius = Number(progressCircle.getAttribute('r'));
  const circumference = 2 * Math.PI * radius;

  // 留出缺口，展示非完整圆环
  const gapRatio = 0.2;
  const ringLength = circumference * (1 - gapRatio);

  // 根据进度计算offset
  const offset = ringLength * (1 - progress);
  progressCircle.style.strokeDasharray = `${ringLength} ${circumference}`;
  progressCircle.style.strokeDashoffset = `${offset}`;
  if (entropyBackground) {
    entropyBackground.style.strokeDasharray = `${ringLength} ${circumference}`;
  }

  // 更新颜色
  const color = getColorByEntropy(entropy);
  progressCircle.style.stroke = color;
  entropyValue.style.color = color;
}

// 评估密码强度
function evaluate() {
  const pwd = passwordInput.value ?? '';
  const bits = PasswordQualityCalculator(pwd);
  entropyValue.textContent = String(Math.round(bits));
  updateEntropyRing(Math.round(bits));
}

// 眼睛按钮点击处理
eyeButton.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  eyeButton.classList.toggle('is-visible', isPassword);
  eyeButton.setAttribute('aria-label', isPassword ? '隐藏密码' : '显示密码');
  updateCustomCaretPosition();
});

// 切换按钮处理
modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    modeButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    // 目前只需要实现组件，不需要实际功能
  });
});

// 密码输入事件
passwordInput.addEventListener('input', evaluate);
['focus', 'click', 'keyup', 'input', 'select', 'scroll'].forEach((eventName) => {
  passwordInput.addEventListener(eventName, updateCustomCaretPosition);
});
passwordInput.addEventListener('blur', () => {
  passwordWrapper?.classList.remove('caret-visible');
});

// 页面加载完成时的初始化
initializeRandomPlaceholder();
setRandomSuggestion();
evaluate();
updateCustomCaretPosition();

// 异步加载常见密码词典（非必需，不影响基础功能）
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
      return;
    }

    PopularPasswords.load(list);
  } catch {
    // 忽略错误，不影响基础功能
  }
}

tryLoadPopularPasswordDictionary();
