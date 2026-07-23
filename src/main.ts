import { Calculator } from './calculator';

// Declare feather global for TypeScript
declare const feather: any;

document.addEventListener('DOMContentLoaded', () => {
  const calculator = new Calculator();

  // DOM Elements
  const displayEl = document.getElementById('display') as HTMLDivElement;
  const historyPreviewEl = document.getElementById('history-preview') as HTMLDivElement;
  const angleModeIndicator = document.getElementById('angle-mode-indicator') as HTMLSpanElement;
  
  const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement;
  const historyToggleBtn = document.getElementById('history-toggle') as HTMLButtonElement;
  const historyCloseBtn = document.getElementById('history-close') as HTMLButtonElement;
  const clearHistoryBtn = document.getElementById('clear-history') as HTMLButtonElement;
  const scientificToggleBtn = document.getElementById('scientific-toggle') as HTMLButtonElement;
  
  const calcContainer = document.getElementById('calculator') as HTMLDivElement;
  const historyDrawer = document.getElementById('history-drawer') as HTMLDivElement;
  const historyListEl = document.getElementById('history-list') as HTMLDivElement;
  
  const keys = document.querySelectorAll('.key');

  // Initialize display
  updateDisplay();
  updateHistoryDrawer();

  // Bind key actions
  keys.forEach(key => {
    key.addEventListener('click', () => {
      const val = key.getAttribute('data-val');
      if (val) {
        handleInput(val);
        // Play small keypress haptic click emulation
        key.classList.add('active-simulation');
        setTimeout(() => key.classList.remove('active-simulation'), 150);
      }
    });
  });

  // Handle calculator operations
  function handleInput(val: string): void {
    if (val === 'clear') {
      calculator.clear();
    } else if (val === 'backspace') {
      calculator.backspace();
    } else if (val === 'negate') {
      calculator.negate();
    } else if (val === 'equals') {
      // Current formula before evaluation
      const formulaBefore = calculator.expression;
      const result = calculator.evaluate();
      
      if (result !== 'Error' && formulaBefore !== result) {
        historyPreviewEl.textContent = `${formulaBefore} =`;
      } else if (result === 'Error') {
        historyPreviewEl.textContent = 'エラー';
      }
      updateHistoryDrawer();
    } else if (val === 'rad-deg') {
      calculator.toggleAngleMode();
    } else if (val === 'sqr') {
      calculator.append('^2');
    } else if (val === 'cube') {
      calculator.append('^3');
    } else {
      calculator.append(val);
    }
    updateDisplay();
  }

  // Update display values
  function updateDisplay(): void {
    // Standard visual mapping for nicer screen presentation
    let expr = calculator.expression;
    if (!expr) {
      displayEl.textContent = '0';
    } else {
      // Clean up operator display visually
      let formatted = expr
        .replace(/\*/g, ' × ')
        .replace(/\//g, ' ÷ ')
        .replace(/-/g, ' − ')
        .replace(/\+/g, ' + ')
        .replace(/\^/g, ' ^ ');
      displayEl.textContent = formatted;
    }

    // Scroll display to the right when input is long
    displayEl.scrollLeft = displayEl.scrollWidth;

    // Handle DEG/RAD mode visibility and indicator
    if (calculator.isDegMode) {
      angleModeIndicator.textContent = 'DEG';
      angleModeIndicator.classList.add('visible');
    } else {
      angleModeIndicator.textContent = 'RAD';
      angleModeIndicator.classList.add('visible');
    }
  }

  // Render history list inside drawer
  function updateHistoryDrawer(): void {
    historyListEl.innerHTML = '';
    const history = calculator.history;
    
    if (history.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-history-msg';
      emptyMsg.textContent = '履歴はありません';
      historyListEl.appendChild(emptyMsg);
      return;
    }

    history.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      
      const formulaEl = document.createElement('span');
      formulaEl.className = 'history-item-formula';
      formulaEl.textContent = item.formula
        .replace(/\*/g, ' × ')
        .replace(/\//g, ' ÷ ')
        .replace(/-/g, ' − ')
        .replace(/\+/g, ' + ');
        
      const resultEl = document.createElement('span');
      resultEl.className = 'history-item-result';
      resultEl.textContent = `= ${item.result}`;

      itemEl.appendChild(formulaEl);
      itemEl.appendChild(resultEl);

      // Restore clicked history
      itemEl.addEventListener('click', () => {
        calculator.expression = item.result;
        historyPreviewEl.textContent = `${item.formula} =`;
        updateDisplay();
        // Automatically close history drawer on mobile to focus on screen
        if (window.innerWidth <= 768) {
          historyDrawer.classList.remove('open');
        }
      });

      historyListEl.appendChild(itemEl);
    });
  }

  // Scientific panel toggle
  scientificToggleBtn.addEventListener('click', () => {
    calcContainer.classList.toggle('scientific-active');
  });

  // History panel toggle
  historyToggleBtn.addEventListener('click', () => {
    historyDrawer.classList.add('open');
  });

  historyCloseBtn.addEventListener('click', () => {
    historyDrawer.classList.remove('open');
  });

  clearHistoryBtn.addEventListener('click', () => {
    calculator.clearHistory();
    updateHistoryDrawer();
  });

  // Theme Toggler
  themeToggleBtn.addEventListener('click', () => {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', newTheme);
  });

  // Keyboard Binding
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Prevent default spacing or form entry
    if (['Enter', ' '].includes(e.key) && document.activeElement === displayEl) {
      e.preventDefault();
    }

    let mappedVal = '';
    let idToHighlight = '';

    // Numeric and standard arithmetic key matching
    if (/^[0-9.()]$/.test(e.key)) {
      mappedVal = e.key;
    } else if (e.key === '+') {
      mappedVal = '+';
      idToHighlight = 'key-add';
    } else if (e.key === '-') {
      mappedVal = '-';
      idToHighlight = 'key-subtract';
    } else if (e.key === '*') {
      mappedVal = '*';
      idToHighlight = 'key-multiply';
    } else if (e.key === '/') {
      mappedVal = '/';
      idToHighlight = 'key-divide';
    } else if (e.key === '^') {
      mappedVal = '^';
    } else if (e.key === '%') {
      mappedVal = '%';
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      mappedVal = 'equals';
      idToHighlight = 'key-equals';
    } else if (e.key === 'Backspace') {
      mappedVal = 'backspace';
      idToHighlight = 'key-backspace';
    } else if (e.key === 'Escape') {
      mappedVal = 'clear';
      idToHighlight = 'key-clear';
    }

    if (mappedVal) {
      handleInput(mappedVal);

      // Key animation triggered visually
      let btnEl: HTMLButtonElement | null = null;
      if (idToHighlight) {
        btnEl = document.getElementById(idToHighlight) as HTMLButtonElement;
      } else {
        btnEl = document.querySelector(`.key[data-val="${mappedVal}"]`) as HTMLButtonElement;
      }

      if (btnEl) {
        btnEl.classList.add('active-simulation');
        setTimeout(() => btnEl.classList.remove('active-simulation'), 150);
      }
    }
  });
});
