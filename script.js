// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const tableSizeSelect = document.getElementById('table-size');
const symbolTypeSelect = document.getElementById('symbol-type');
const orderTypeSelect = document.getElementById('order-type');
const scaleFactorInput = document.getElementById('scale-factor');
const scaleValueDisplay = document.getElementById('scale-value');
const centerDotCheckbox = document.getElementById('center-dot');
const shuffleOnClickCheckbox = document.getElementById('shuffle-on-click');
const applySettingsBtn = document.getElementById('apply-settings');
const resetTableBtn = document.getElementById('reset-table');
const schulteTable = document.getElementById('schulte-table');
const currentSequenceDisplay = document.getElementById('current-sequence');
const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');

// Русский алфавит
const russianLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'];

// State variables
let currentSettings = {
  size: 5,
  symbolType: 'numbers',
  order: 'random',
  scaleFactor: 1.0,
  showCenterDot: true,
  shuffleOnClick: true
};

let startTime = null;
let currentTime = 0;
let timerInterval = null;
let currentSequence = 1;
let isCompleted = false;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  loadThemePreference();
  loadScalePreference();
  applySettings();

  themeToggle.addEventListener('click', toggleTheme);
  settingsToggle.addEventListener('click', toggleSettings);
  applySettingsBtn.addEventListener('click', applySettings);
  resetTableBtn.addEventListener('click', resetTable);
  scaleFactorInput.addEventListener('input', updateScaleValue);

  document.addEventListener('click', (e) => {
    if (settingsPanel.classList.contains('open') &&
      !settingsPanel.contains(e.target) &&
      e.target !== settingsToggle) {
      settingsPanel.classList.remove('open');
    }
  });

  window.addEventListener('resize', handleResize);
});

function loadThemePreference() {
  const savedTheme = localStorage.getItem('schulte-theme');
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('schulte-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  setTimeout(() => { themeToggle.offsetHeight; }, 10);
}

function loadScalePreference() {
  const savedScale = localStorage.getItem('schulte-scale');
  if (savedScale) {
    currentSettings.scaleFactor = parseFloat(savedScale);
    scaleFactorInput.value = currentSettings.scaleFactor;
    scaleValueDisplay.textContent = currentSettings.scaleFactor.toFixed(1);
  }
}

function updateScaleValue() {
  const value = parseFloat(scaleFactorInput.value);
  scaleValueDisplay.textContent = value.toFixed(1);
}

function toggleSettings() {
  settingsPanel.classList.toggle('open');
}

function applySettings() {
  currentSettings.size = parseInt(tableSizeSelect.value);
  currentSettings.symbolType = symbolTypeSelect.value;
  currentSettings.order = orderTypeSelect.value;
  currentSettings.scaleFactor = parseFloat(scaleFactorInput.value);
  currentSettings.showCenterDot = centerDotCheckbox.checked;
  currentSettings.shuffleOnClick = shuffleOnClickCheckbox.checked;

  localStorage.setItem('schulte-scale', currentSettings.scaleFactor.toString());

  document.querySelector('.main-content').style.transform = `scale(${currentSettings.scaleFactor})`;

  generateTable();
  resetGameState();
  settingsPanel.classList.remove('open');
  handleResize();
}

function resetTable() {
  generateTable();
  resetGameState();
  settingsPanel.classList.remove('open');
  handleResize();
}

function resetGameState() {
  currentSequence = 1;
  isCompleted = false;
  currentSequenceDisplay.textContent = getDisplayValue(currentSequence);
  currentSequenceDisplay.style.backgroundColor = '';
  statusDisplay.textContent = '';
  statusDisplay.className = '';

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  startTime = null;
  currentTime = 0;
  timerDisplay.textContent = 'Time: 0.0s';
}

function getDisplayValue(sequence) {
  if (currentSettings.symbolType === 'numbers') {
    return sequence.toString();
  } else {
    if (sequence <= russianLetters.length) {
      return russianLetters[sequence - 1];
    } else {
      const firstIndex = Math.floor((sequence - 1) / russianLetters.length) - 1;
      const secondIndex = (sequence - 1) % russianLetters.length;
      return russianLetters[firstIndex] + russianLetters[secondIndex];
    }
  }
}

function generateTable() {
  const size = currentSettings.size;
  const totalCells = size * size;
  let symbols = [];

  if (currentSettings.symbolType === 'numbers') {
    for (let i = 1; i <= totalCells; i++) symbols.push(i.toString());
  } else {
    for (let i = 0; i < totalCells; i++) {
      symbols.push(getDisplayValue(i + 1));
    }
  }

  if (currentSettings.order === 'random') symbols = shuffleArray(symbols);

  schulteTable.innerHTML = '';
  schulteTable.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  schulteTable.classList.remove('center-dot'); 
  const centerIndex = (size % 2 === 1) ? Math.floor(totalCells / 2) : -1;

  symbols.forEach((symbol, index) => {
    const cell = document.createElement('div');
    cell.className = 'schulte-cell fade-in';
    cell.dataset.value = symbol;
    cell.dataset.index = index;

    if (index === centerIndex && currentSettings.showCenterDot) {
      cell.classList.add('center-cell-with-dot');
      
      const contentSpan = document.createElement('span');
      contentSpan.className = 'cell-content';
      contentSpan.textContent = symbol;
      cell.appendChild(contentSpan);

    } else {
      cell.textContent = symbol;
    }
    

    cell.addEventListener('click', () => handleCellClick(cell));
    schulteTable.appendChild(cell);
  });
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function handleCellClick(cell) {
  if (isCompleted) return;
  if (!startTime) startTimer();

  const cellValue = cell.dataset.value;
  const expectedValue = getDisplayValue(currentSequence);

  if (cellValue === expectedValue) {
    cell.classList.add('correct', 'pulse');
    currentSequence++;
    if (currentSequence <= currentSettings.size * currentSettings.size) {
      currentSequenceDisplay.textContent = getDisplayValue(currentSequence);
      currentSequenceDisplay.style.transform = 'scale(1.1)';
      setTimeout(() => { currentSequenceDisplay.style.transform = 'scale(1)'; }, 300);
    }
    if (currentSequence > currentSettings.size * currentSettings.size) completeGame();
  } else {
    cell.classList.add('incorrect');
    setTimeout(() => cell.classList.remove('incorrect'), 800);
  }

  if (currentSettings.shuffleOnClick && !isCompleted) {
    setTimeout(() => {
      if (!isCompleted) {
        generateTable();
        document.querySelectorAll('.schulte-cell').forEach(cell => {
          const value = cell.dataset.value;
          let shouldHighlight = false;
          if (currentSettings.symbolType === 'numbers') {
            shouldHighlight = parseInt(value) < currentSequence;
          } else {
            let cellIndex;
            if (value.length === 1) {
              cellIndex = russianLetters.indexOf(value) + 1;
            } else {
              const firstCharIndex = russianLetters.indexOf(value[0]) + 1;
              const secondCharIndex = russianLetters.indexOf(value[1]) + 1;
              cellIndex = firstCharIndex * russianLetters.length + secondCharIndex;
            }
            shouldHighlight = cellIndex < currentSequence;
          }
          if (shouldHighlight) cell.classList.add('correct');
        });
      }
    }, 500);
  }
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    currentTime = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = `Time: ${currentTime.toFixed(1)}s`;
  }, 100);
}

function completeGame() {
  isCompleted = true;
  clearInterval(timerInterval);
  currentSequenceDisplay.textContent = '✓';
  currentSequenceDisplay.style.backgroundColor = 'var(--success-color)';
  statusDisplay.textContent = `Выполнено за ${currentTime.toFixed(1)} секунд !`;
  statusDisplay.className = 'fade-in';
  document.querySelectorAll('.schulte-cell').forEach(cell => {
    cell.classList.add('correct', 'pulse');
  });
}

function handleResize() {
  const mainContent = document.querySelector('.main-content');
  const availableHeight = window.innerHeight - 120;
  const availableWidth = window.innerWidth - 40;

  const tempTransform = mainContent.style.transform;
  mainContent.style.transform = 'scale(1)';
  const naturalHeight = mainContent.scrollHeight;
  const naturalWidth = mainContent.scrollWidth;
  mainContent.style.transform = tempTransform;

  const heightScale = availableHeight / naturalHeight;
  const widthScale = availableWidth / naturalWidth;
  const maxScale = Math.min(heightScale, widthScale, 1.5);

  if (currentSettings.scaleFactor === 1.0 || currentSettings.scaleFactor > maxScale) {
    const finalScale = currentSettings.scaleFactor === 1.0 ?
      Math.min(maxScale, 1.0) :
      Math.min(currentSettings.scaleFactor, maxScale);

    mainContent.style.transform = `scale(${finalScale})`;

    if (currentSettings.scaleFactor > maxScale) {
      currentSettings.scaleFactor = finalScale;
      scaleFactorInput.value = finalScale;
      scaleValueDisplay.textContent = finalScale.toFixed(1);
      localStorage.setItem('schulte-scale', finalScale.toString());
    }
  }

  const tableSize = currentSettings.size;
  const cellSize = Math.min(
    (availableHeight * 0.7) / tableSize,
    (availableWidth * 0.7) / tableSize
  );
  const fontSize = Math.max(12, cellSize * 0.4);
  document.documentElement.style.setProperty('--cell-font-size', `${fontSize}px`);
}

generateTable();
handleResize();
