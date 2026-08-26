import { escapeHtml } from './note-utils.js';

interface Expense { id: string; amount: number; category: string; note: string; date: string; }

const STORAGE_KEY = 'pwa-expenses';
const categories: Record<string, { label: string; color: string }> = {
  food: { label: '飲食', color: '#e27d47' }, transport: { label: '交通', color: '#4f8f8a' },
  shopping: { label: '購物', color: '#d6aa45' }, bills: { label: '住屋／帳單', color: '#7d7396' },
  fun: { label: '娛樂', color: '#d46c7b' }, other: { label: '其他', color: '#8c9a91' }
};

const form = document.getElementById('expense-form') as HTMLFormElement;
const amountInput = document.getElementById('expense-amount') as HTMLInputElement;
const categoryInput = document.getElementById('expense-category') as HTMLSelectElement;
const noteInput = document.getElementById('expense-note') as HTMLInputElement;
const dateInput = document.getElementById('expense-date') as HTMLInputElement;
const todayButton = document.getElementById('today-button') as HTMLButtonElement;
const list = document.getElementById('expense-list') as HTMLDivElement;
const chart = document.getElementById('category-chart') as HTMLDivElement;

let expenses = readExpenses();
let period: 'month' | 'year' = 'month';
let periodDate = new Date();
dateInput.value = getToday();

function readExpenses(): Expense[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Expense[]; } catch { return []; }
}

function getToday(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function money(value: number): string { return `$${value.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function saveExpenses(): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }
function sum(items: Expense[]): number { return items.reduce((total, expense) => total + expense.amount, 0); }

function periodKey(date: Date): string {
  return period === 'month' ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : String(date.getFullYear());
}

function expensePeriodKey(expense: Expense): string { return period === 'month' ? expense.date.slice(0, 7) : expense.date.slice(0, 4); }

function render(): void {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const monthExpenses = expenses.filter(expense => expense.date.startsWith(month));
  const todayExpenses = expenses.filter(expense => expense.date === today);
  document.getElementById('month-total')!.textContent = money(sum(monthExpenses));
  document.getElementById('today-total')!.textContent = money(sum(todayExpenses));
  document.getElementById('expense-count')!.textContent = `${expenses.length} 筆`;
  document.getElementById('chart-total')!.textContent = money(sum(expenses)).replace('.00', '');
  renderChart();
  renderList();
}

function renderChart(): void {
  const selectedKey = periodKey(periodDate);
  const periodExpenses = expenses.filter(expense => expensePeriodKey(expense) === selectedKey);
  const totals = new Map<string, number>();
  periodExpenses.forEach(expense => totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount));
  const total = sum(periodExpenses);
  let current = 0;
  const stops = [...totals.entries()].map(([category, value]) => {
    const start = total ? current / total * 360 : 0; current += value;
    return `${categories[category].color} ${start}deg ${current / total * 360}deg`;
  });
  chart.style.background = stops.length ? `conic-gradient(${stops.join(', ')})` : '#e9e4d9';
  document.getElementById('period-label')!.textContent = period === 'month'
    ? `${periodDate.getFullYear()} 年 ${periodDate.getMonth() + 1} 月`
    : `${periodDate.getFullYear()} 年`;
  document.querySelectorAll<HTMLButtonElement>('[data-period]').forEach(button => button.classList.toggle('is-active', button.dataset.period === period));
  const legend = document.getElementById('category-legend')!;
  legend.innerHTML = stops.length ? [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([category, value]) => `<div class="legend-row"><span class="legend-name"><i class="dot" style="background:${categories[category].color}"></i>${categories[category].label}</span><span class="legend-amount">${money(value)}</span></div>`).join('') : '<p class="empty-chart">暫時未有支出記錄。<br>由第一筆開始建立你的分布。</p>';
}

function renderList(): void {
  const sorted = [...expenses].sort((a, b) => `${b.date}${b.id}`.localeCompare(`${a.date}${a.id}`));
  list.innerHTML = sorted.length ? sorted.map(expense => `<div class="expense-row"><i class="dot" style="background:${categories[expense.category].color}"></i><div><div class="expense-note">${escapeHtml(expense.note || categories[expense.category].label)}</div><div class="expense-category">${categories[expense.category].label}</div></div><span class="expense-date">${expense.date}</span><strong class="expense-amount">-${money(expense.amount)}</strong><button type="button" class="delete-button" data-expense-id="${expense.id}" aria-label="刪除記錄">×</button></div>`).join('') : '<div class="empty-list">今日未有記錄，先記低一筆支出吧。</div>';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const amount = Number(amountInput.value);
  if (!amount || amount <= 0 || !dateInput.value) return;
  const selectedDate = dateInput.value;
  expenses.push({ id: crypto.randomUUID(), amount: Math.round(amount * 100) / 100, category: categoryInput.value, note: noteInput.value.trim(), date: dateInput.value });
  saveExpenses(); render(); form.reset(); dateInput.value = selectedDate; amountInput.focus();
});

todayButton.addEventListener('click', () => {
  dateInput.value = getToday();
  dateInput.focus();
});

list.addEventListener('click', event => {
  const target = event.target as HTMLElement;
  const id = target.closest<HTMLButtonElement>('[data-expense-id]')?.dataset.expenseId;
  if (id) { expenses = expenses.filter(expense => expense.id !== id); saveExpenses(); render(); }
});

document.getElementById('clear-expenses')!.addEventListener('click', () => {
  if (expenses.length && window.confirm('確定要清除全部支出記錄嗎？')) { expenses = []; saveExpenses(); render(); }
});

document.querySelectorAll<HTMLButtonElement>('[data-period]').forEach(button => button.addEventListener('click', () => {
  period = button.dataset.period as 'month' | 'year';
  render();
}));

function movePeriod(offset: number): void {
  periodDate = new Date(periodDate);
  if (period === 'month') periodDate.setMonth(periodDate.getMonth() + offset);
  else periodDate.setFullYear(periodDate.getFullYear() + offset);
  render();
}

document.getElementById('previous-period')!.addEventListener('click', () => movePeriod(-1));
document.getElementById('next-period')!.addEventListener('click', () => movePeriod(1));

render();