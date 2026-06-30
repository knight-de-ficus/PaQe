import PasswordQualityCalculator from './Lib/PasswordQualityCalculator.js';

const passwordInput = document.getElementById('password');
const eyeButton = document.getElementById('eyeButton');
const customCaret = document.getElementById('customCaret');
const passwordWrapper = document.querySelector('.password-wrapper');
const entropyValue = document.getElementById('entropyValue');
const entropyUnit = document.getElementById('entropyUnit');
const entropyRingLabel = document.getElementById('entropyRingLabel');
const entropyProgress = document.getElementById('entropyProgress');
const entropyBackground = document.querySelector('.entropy-ring-background');
const suggestionEl = document.getElementById('suggestion');
const modeButtons = document.querySelectorAll('.mode-button');
const checkList = document.getElementById('checkList');
const checkUpper = document.getElementById('checkUpper');
const checkLower = document.getElementById('checkLower');
const checkDigit = document.getElementById('checkDigit');
const checkSpecial = document.getElementById('checkSpecial');
const checkNoKeyword = document.getElementById('checkNoKeyword');
const checkNotWeak = document.getElementById('checkNotWeak');
const textMeasureCanvas = document.createElement('canvas');
const textMeasureContext = textMeasureCanvas.getContext('2d');

// 当前模式：'normal' 或 'advanced'
let currentMode = 'normal';

// 正则表达式用于检测密码组成
const regexUpper = /[A-Z]/;
const regexLower = /[a-z]/;
const regexDigit = /[0-9]/;
const regexSpecial = /[^A-Za-z0-9]/;

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

// 带淡入淡出效果更新建议文字
function setSuggestionWithFade(text) {
  if (suggestionEl.textContent === text) return;
  suggestionEl.style.opacity = '0';
  setTimeout(() => {
    suggestionEl.textContent = text;
    suggestionEl.style.opacity = '1';
  }, 180);
}

// 建议轮换定时器
let suggestionTimer = null;
let suggestionIndex = 0;

function startSuggestionRotation() {
  if (suggestionTimer) return;
  // 立即显示一条随机建议
  suggestionIndex = Math.floor(Math.random() * suggestions.length);
  setSuggestionWithFade(suggestions[suggestionIndex]);
  suggestionTimer = setInterval(() => {
    suggestionIndex = (suggestionIndex + 1) % suggestions.length;
    setSuggestionWithFade(suggestions[suggestionIndex]);
  }, 3000);
}

function stopSuggestionRotation() {
  if (suggestionTimer) {
    clearInterval(suggestionTimer);
    suggestionTimer = null;
  }
}

// 获取密码评级（普通模式）
function getRating(bits) {
  if (bits < 50) return { text: '差', color: '#ff3b30' };
  if (bits < 100) return { text: '中等', color: '#ffcc00' };
  return { text: '好', color: '#34c759' };
}

// 更新检测项图标
function updateCheckIcon(element, isPass) {
  element.textContent = isPass ? '✓' : '✗';
  element.className = 'check-icon ' + (isPass ? 'pass' : 'fail');
}

// 检查密码中是否包含词典关键字
function containsDictionaryKeyword(pwd) {
  if (!pwd || pwd.length < 3) return false;
  const PopularPasswords = PasswordQualityCalculator?.PopularPasswords;
  if (!PopularPasswords) return false;

  const lower = pwd.toLowerCase();
  const maxLen = PopularPasswords.getMaxLength();
  for (let nSubLen = Math.min(lower.length, maxLen); nSubLen >= 3; nSubLen--) {
    if (!PopularPasswords.ContainsLength(nSubLen)) continue;
    for (let i = 0; i <= lower.length - nSubLen; i++) {
      const sub = lower.substring(i, i + nSubLen);
      if (PopularPasswords.IsPopularPassword(sub)) return true;
    }
  }
  return false;
}

// 检查整个密码是否是常见弱密码
function isPopularPassword(pwd) {
  if (!pwd || pwd.length === 0) return false;
  const PopularPasswords = PasswordQualityCalculator?.PopularPasswords;
  if (!PopularPasswords) return false;
  return PopularPasswords.IsPopularPassword(pwd.toLowerCase());
}

// 生成针对性的密码加固建议
function getTargetedSuggestion(hasUpper, hasLower, hasDigit, hasSpecial, hasKeyword, isWeak) {
  const issues = [];
  if (!hasUpper) issues.push('添加大写字母');
  if (!hasLower) issues.push('添加小写字母');
  if (!hasDigit) issues.push('添加数字');
  if (!hasSpecial) issues.push('添加特殊字符');
  if (hasKeyword) issues.push('避免使用词典中的常见单词');
  if (isWeak) return '此密码属于常见弱密码，强烈建议更换';

  if (issues.length === 0) return '密码组成良好，继续保持';
  return '建议：' + issues.join('、');
}

// 更新模式UI
function updateModeUI() {
  const isNormal = currentMode === 'normal';
  // 环中心内容始终显示
  entropyRingLabel.style.display = '';
  // 检测列表
  if (isNormal) {
    checkList.classList.remove('visible');
  } else {
    checkList.classList.add('visible');
  }
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
  const roundedBits = Math.round(bits);

  // 更新环内文字（按模式显示不同内容）
  const rating = getRating(roundedBits);
  if (currentMode === 'normal') {
    entropyValue.textContent = rating.text;
    entropyUnit.textContent = '';
    entropyValue.style.color = rating.color;
  } else {
    entropyValue.textContent = String(roundedBits);
    entropyUnit.textContent = 'bits';
    entropyValue.style.color = getColorByEntropy(roundedBits);
  }

  // 更新进度环
  updateEntropyRing(roundedBits);

  if (pwd.length === 0) {
    // 密码为空：轮换通用建议
    stopSuggestionRotation();
    startSuggestionRotation();
    // 重置检测列表
    updateCheckIcon(checkUpper, false);
    updateCheckIcon(checkLower, false);
    updateCheckIcon(checkDigit, false);
    updateCheckIcon(checkSpecial, false);
    updateCheckIcon(checkNoKeyword, false);
    updateCheckIcon(checkNotWeak, false);
    updateModeUI();
    return;
  }

  // 有密码输入时停止轮换
  stopSuggestionRotation();

  // 正则检测密码组成
  const hasUpper = regexUpper.test(pwd);
  const hasLower = regexLower.test(pwd);
  const hasDigit = regexDigit.test(pwd);
  const hasSpecial = regexSpecial.test(pwd);
  const hasKeyword = containsDictionaryKeyword(pwd);
  const isWeak = isPopularPassword(pwd);

  // 更新建议
  const suggestion = getTargetedSuggestion(hasUpper, hasLower, hasDigit, hasSpecial, hasKeyword, isWeak);
  setSuggestionWithFade(suggestion);

  // 更新检测列表
  updateCheckIcon(checkUpper, hasUpper);
  updateCheckIcon(checkLower, hasLower);
  updateCheckIcon(checkDigit, hasDigit);
  updateCheckIcon(checkSpecial, hasSpecial);
  updateCheckIcon(checkNoKeyword, !hasKeyword);
  updateCheckIcon(checkNotWeak, !isWeak);

  // 更新模式UI
  updateModeUI();
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
    const mode = button.dataset.mode;
    currentMode = mode === 'advanced' ? 'advanced' : 'normal';
    evaluate();
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
