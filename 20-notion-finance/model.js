const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export function monthFromName(name) {
  const match = String(name ?? '').trim().toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
  const index = MONTHS.indexOf(match?.[1]);
  return index < 0 ? null : `${match[2]}-${String(index + 1).padStart(2, '0')}`;
}

export function monthOf(record, monthMap) {
  const dated = /^\d{4}-\d{2}-\d{2}/.exec(record.date ?? '');
  return dated ? dated[0].slice(0, 7) : record.monthIds?.map(id => monthMap.get(id)).find(Boolean) ?? null;
}

export function sum(records) {
  return records.reduce((total, record) => total + (Number.isFinite(record.amount) ? record.amount : 0), 0);
}

export function financeView(data, period, selectedDate) {
  const selectedMonth = selectedDate.slice(0, 7);
  const selectedYear = selectedDate.slice(0, 4);
  const monthMap = new Map(data.months.map(row => [row.id, monthFromName(row.name)]));
  const inPeriod = record => {
    if (period === 'day') return record.date?.slice(0, 10) === selectedDate;
    const month = monthOf(record, monthMap);
    return period === 'year' ? month?.startsWith(selectedYear) : month === selectedMonth;
  };
  const income = data.income.filter(inPeriod);
  const expenses = data.expenses.filter(inPeriod);
  const credit = data.credit.filter(inPeriod);
  const categoryMap = new Map(data.budgets.map(row => [row.id, row.name || 'Uncategorized']));
  const spending = new Map();
  for (const row of expenses) {
    const name = categoryMap.get(row.categoryIds?.[0]) ?? 'Uncategorized';
    spending.set(name, (spending.get(name) ?? 0) + (row.amount ?? 0));
  }
  const categories = [...spending].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  const monthBudgets = data.budgets.filter(row => row.monthIds?.some(id => monthMap.get(id) === selectedMonth));
  const budgets = monthBudgets.map(row => ({
    name: row.name || 'Unnamed category',
    amount: row.amount ?? 0,
    spent: sum(data.expenses.filter(expense => monthOf(expense, monthMap) === selectedMonth && expense.categoryIds?.includes(row.id))),
  })).sort((a, b) => b.amount - a.amount);
  const activity = [...income.map(row => ({ ...row, type: 'income' })), ...expenses.map(row => ({ ...row, type: 'expense' }))]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 8);
  const trendMonths = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(Number(selectedYear), Number(selectedMonth.slice(5)) - 1 - (5 - offset), 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      month,
      income: sum(data.income.filter(row => monthOf(row, monthMap) === month)),
      expenses: sum(data.expenses.filter(row => monthOf(row, monthMap) === month)),
    };
  });
  return {
    income: sum(income),
    expenses: sum(expenses),
    credit: sum(credit),
    categories,
    budgets,
    activity,
    trendMonths,
    undated: [...data.income, ...data.expenses, ...data.credit].filter(row => !row.date).length,
  };
}
