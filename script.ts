interface HistoryItem {
  formula: string;
  result: string;
  timestamp: Date;
}

class Calculator {
  private _expression: string = '';
  private _isDegMode: boolean = true;
  private _history: HistoryItem[] = [];

  constructor() {
    this.loadHistory();
  }

  get expression(): string {
    return this._expression;
  }

  set expression(val: string) {
    this._expression = val;
  }

  get isDegMode(): boolean {
    return this._isDegMode;
  }

  get history(): HistoryItem[] {
    return this._history;
  }

  toggleAngleMode(): void {
    this._isDegMode = !this._isDegMode;
  }

  clear(): void {
    this._expression = '';
  }

  backspace(): void {
    if (this._expression.length === 0) return;

    // Check for multi-character functions at the end of the expression to backspace them fully
    const functions = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt(', 'cbrt('];
    for (const func of functions) {
      if (this._expression.endsWith(func)) {
        this._expression = this._expression.slice(0, -func.length);
        return;
      }
    }

    this._expression = this._expression.slice(0, -1);
  }

  append(value: string): void {
    // Smart validation to prevent obvious invalid inputs
    const lastChar = this._expression.slice(-1);

    // If expression is '0' and we append a number, replace the '0' unless it's decimal
    if (this._expression === '0' && /^[0-9]$/.test(value)) {
      this._expression = value;
      return;
    }

    // Prevent consecutive basic operators
    const basicOps = ['+', '-', '*', '/', '^', '%'];
    if (basicOps.includes(value) && basicOps.includes(lastChar)) {
      // Replace the last operator with the new one
      this._expression = this._expression.slice(0, -1) + value;
      return;
    }

    // Function appends
    const funcList = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'cbrt'];
    if (funcList.includes(value)) {
      this._expression += value + '(';
      return;
    }

    // Constants
    if (value === 'pi') {
      this._expression += 'π';
      return;
    }
    if (value === 'e') {
      this._expression += 'e';
      return;
    }

    // Default append
    this._expression += value;
  }

  negate(): void {
    if (this._expression.length === 0) {
      this._expression = '-';
      return;
    }

    // If expression is just a negative number, toggle it
    if (/^\-[0-9.]+$/.test(this._expression)) {
      this._expression = this._expression.slice(1);
      return;
    }
    // If expression is a positive number, toggle it
    if (/^[0-9.]+$/.test(this._expression)) {
      this._expression = '-' + this._expression;
      return;
    }

    // Otherwise, toggle the last number in the expression if possible
    const match = this._expression.match(/([+-/*^(])?(-?[0-9.]+)$/);
    if (match) {
      const operator = match[1] || '';
      const lastNum = match[2];
      const prefix = this._expression.slice(0, this._expression.length - lastNum.length - operator.length);
      
      if (lastNum.startsWith('-')) {
        this._expression = prefix + operator + lastNum.slice(1);
      } else {
        this._expression = prefix + operator + '-' + lastNum;
      }
    } else {
      // If we can't easily toggle a number, append a minus operator or parenthesis minus
      const lastChar = this._expression.slice(-1);
      if (['+', '-', '*', '/', '^', '('].includes(lastChar)) {
        this._expression += '-';
      } else {
        this._expression += '*-1';
      }
    }
  }

  evaluate(): string {
    if (!this._expression || this._expression.trim() === '') {
      return '0';
    }

    try {
      const sanitized = this.sanitizeExpression(this._expression);
      const tokens = this.tokenize(sanitized);
      const rpn = this.shuntingYard(tokens);
      const resultVal = this.evaluateRPN(rpn);
      
      const formattedResult = this.formatResult(resultVal);

      // Save to history
      const historyItem: HistoryItem = {
        formula: this._expression,
        result: formattedResult,
        timestamp: new Date()
      };
      this._history.unshift(historyItem);
      // Keep only top 50 items
      if (this._history.length > 50) {
        this._history.pop();
      }
      this.saveHistory();

      // Update current expression to the result
      this._expression = formattedResult;
      return formattedResult;
    } catch (e: any) {
      return 'Error';
    }
  }

  clearHistory(): void {
    this._history = [];
    this.saveHistory();
  }

  private sanitizeExpression(expr: string): string {
    let result = expr;
    // Replace visual symbols with parseable characters
    result = result.replace(/π/g, ' pi ');
    result = result.replace(/e/g, ' e ');
    result = result.replace(/×/g, ' * ');
    result = result.replace(/÷/g, ' / ');
    result = result.replace(/−/g, ' - ');
    return result;
  }

  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    
    while (i < expr.length) {
      const char = expr[i];
      
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      
      // Numbers (with support for decimal points)
      if (/[0-9.]/.test(char)) {
        let num = '';
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          num += expr[i];
          i++;
        }
        tokens.push(num);
        continue;
      }
      
      // Words (functions & constants like sin, cos, pi, e)
      if (/[a-zA-Z]/.test(char)) {
        let word = '';
        while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
          word += expr[i];
          i++;
        }
        tokens.push(word);
        continue;
      }
      
      // Operators & Parentheses
      if (['+', '-', '*', '/', '^', '%', '(', ')'].includes(char)) {
        tokens.push(char);
        i++;
        continue;
      }
      
      // Handle unsupported characters gracefully
      i++;
    }
    
    // Unary Operator Resolution (convert '-' to 'u-' where appropriate)
    const processedTokens: string[] = [];
    for (let idx = 0; idx < tokens.length; idx++) {
      const current = tokens[idx];
      if (current === '-') {
        const prev = idx > 0 ? tokens[idx - 1] : null;
        // Unary minus if it's at start or follows an operator or open parenthesis
        if (prev === null || ['+', '-', '*', '/', '^', '%', '('].includes(prev)) {
          processedTokens.push('u-');
        } else {
          processedTokens.push('-');
        }
      } else {
        processedTokens.push(current);
      }
    }
    
    return processedTokens;
  }

  private shuntingYard(tokens: string[]): string[] {
    const outputQueue: string[] = [];
    const operatorStack: string[] = [];
    
    const precedences: Record<string, number> = {
      '+': 2,
      '-': 2,
      '*': 3,
      '/': 3,
      '%': 3,
      'u-': 4,
      '^': 5
    };
    
    const associativities: Record<string, 'L' | 'R'> = {
      '+': 'L',
      '-': 'L',
      '*': 'L',
      '/': 'L',
      '%': 'L',
      'u-': 'R',
      '^': 'R'
    };

    const functions = ['sin', 'cos', 'tan', 'sqrt', 'cbrt', 'log', 'ln'];

    for (const token of tokens) {
      if (this.isNumber(token) || token === 'pi' || token === 'e') {
        outputQueue.push(token);
      } else if (functions.includes(token)) {
        operatorStack.push(token);
      } else if (precedences[token] !== undefined) {
        // Token is operator
        let top = operatorStack[operatorStack.length - 1];
        while (
          top &&
          (functions.includes(top) ||
            (precedences[top] > precedences[token]) ||
            (precedences[top] === precedences[token] && associativities[token] === 'L')) &&
          top !== '('
        ) {
          outputQueue.push(operatorStack.pop()!);
          top = operatorStack[operatorStack.length - 1];
        }
        operatorStack.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        let top = operatorStack[operatorStack.length - 1];
        while (top && top !== '(') {
          outputQueue.push(operatorStack.pop()!);
          top = operatorStack[operatorStack.length - 1];
        }
        if (!top) {
          throw new Error('Mismatched parentheses');
        }
        operatorStack.pop(); // Remove '('
        
        // If top of stack is function, pop it to output
        const nextTop = operatorStack[operatorStack.length - 1];
        if (nextTop && functions.includes(nextTop)) {
          outputQueue.push(operatorStack.pop()!);
        }
      }
    }

    while (operatorStack.length > 0) {
      const op = operatorStack.pop()!;
      if (op === '(' || op === ')') {
        throw new Error('Mismatched parentheses');
      }
      outputQueue.push(op);
    }

    return outputQueue;
  }

  private evaluateRPN(rpn: string[]): number {
    const stack: number[] = [];
    const functions = ['sin', 'cos', 'tan', 'sqrt', 'cbrt', 'log', 'ln'];

    for (const token of rpn) {
      if (this.isNumber(token)) {
        stack.push(parseFloat(token));
      } else if (token === 'pi') {
        stack.push(Math.PI);
      } else if (token === 'e') {
        stack.push(Math.E);
      } else if (token === 'u-') {
        if (stack.length < 1) throw new Error('Invalid expression');
        const val = stack.pop()!;
        stack.push(-val);
      } else if (functions.includes(token)) {
        if (stack.length < 1) throw new Error('Invalid expression');
        const val = stack.pop()!;
        stack.push(this.evalFunction(token, val));
      } else {
        // Binary operator
        if (stack.length < 2) throw new Error('Invalid expression');
        const val2 = stack.pop()!;
        const val1 = stack.pop()!;
        
        switch (token) {
          case '+': stack.push(val1 + val2); break;
          case '-': stack.push(val1 - val2); break;
          case '*': stack.push(val1 * val2); break;
          case '/':
            if (val2 === 0) throw new Error('Division by zero');
            stack.push(val1 / val2);
            break;
          case '%':
            stack.push(val1 % val2);
            break;
          case '^':
            stack.push(Math.pow(val1, val2));
            break;
          default:
            throw new Error(`Unknown operator: ${token}`);
        }
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression');
    }

    return stack[0];
  }

  private evalFunction(func: string, val: number): number {
    let rad = val;
    if (this._isDegMode && ['sin', 'cos', 'tan'].includes(func)) {
      rad = (val * Math.PI) / 180;
    }

    switch (func) {
      case 'sin':
        return this.cleanTrigResult(Math.sin(rad));
      case 'cos':
        return this.cleanTrigResult(Math.cos(rad));
      case 'tan':
        if (this._isDegMode && Math.abs(val % 180) === 90) {
          throw new Error('Tangent undefined');
        }
        return this.cleanTrigResult(Math.tan(rad));
      case 'sqrt':
        if (val < 0) throw new Error('Square root of negative number');
        return Math.sqrt(val);
      case 'cbrt':
        return Math.cbrt(val);
      case 'log':
        if (val <= 0) throw new Error('Logarithm domain error');
        return Math.log10(val);
      case 'ln':
        if (val <= 0) throw new Error('Logarithm domain error');
        return Math.log(val);
      default:
        throw new Error(`Unknown function: ${func}`);
    }
  }

  private cleanTrigResult(val: number): number {
    return Math.abs(val) < 1e-14 ? 0 : val;
  }

  private isNumber(token: string): boolean {
    return !isNaN(parseFloat(token)) && isFinite(Number(token));
  }

  private formatResult(value: number): string {
    if (isNaN(value)) return 'Error';
    if (!isFinite(value)) return 'Infinity';

    const rounded = parseFloat(value.toFixed(12));
    
    const absVal = Math.abs(rounded);
    if (absVal > 1e12 || (absVal < 1e-6 && absVal > 0)) {
      return rounded.toExponential(8);
    }
    
    return rounded.toString();
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('ts_calc_history', JSON.stringify(this._history));
    } catch (e) {
      // Ignore storage errors
    }
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('ts_calc_history');
      if (stored) {
        this._history = JSON.parse(stored);
      }
    } catch (e) {
      this._history = [];
    }
  }
}

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
    let expr = calculator.expression;
    if (!expr) {
      displayEl.textContent = '0';
    } else {
      let formatted = expr
        .replace(/\*/g, ' × ')
        .replace(/\//g, ' ÷ ')
        .replace(/-/g, ' − ')
        .replace(/\+/g, ' + ')
        .replace(/\^/g, ' ^ ');
      displayEl.textContent = formatted;
    }

    displayEl.scrollLeft = displayEl.scrollWidth;

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

      itemEl.addEventListener('click', () => {
        calculator.expression = item.result;
        historyPreviewEl.textContent = `${item.formula} =`;
        updateDisplay();
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
    if (['Enter', ' '].includes(e.key) && document.activeElement === displayEl) {
      e.preventDefault();
    }

    let mappedVal = '';
    let idToHighlight = '';

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
