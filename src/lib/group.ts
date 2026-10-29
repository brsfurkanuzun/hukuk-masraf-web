export interface ExpenseDocument {
  fileName: string;
  mimeType: string;
  url: string;
}

export interface ExpenseLine {
  type: string;
  note: string;
  amountKurus: number;
  documents: ExpenseDocument[];
}

export interface ExpenseView {
  id: string;
  ownerId: string;
  debtorName: string;
  expenseDate: string;
  clientName: string;
  enforcementOffice: string;
  fileCaseNumber: string;
  instructionNumber: string;
  note: string;
  lines: ExpenseLine[];
  totalAmountKurus: number;
}

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface Bucket {
  key: string;
  label: string;
  detail: string;
  count: number;
  totalAmountKurus: number;
}

const EMPTY_DEBTOR = "-";

export function debtorKey(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : EMPTY_DEBTOR;
}

export function debtorLabel(key: string): string {
  return key === EMPTY_DEBTOR ? "Borçlu belirtilmemiş" : key;
}

export function formatTrDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return iso;
  }
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function sum(items: ExpenseView[]): number {
  return items.reduce((total, item) => total + item.totalAmountKurus, 0);
}

function bucket(key: string, label: string, detail: string, items: ExpenseView[]): Bucket {
  return { key, label, detail, count: items.length, totalAmountKurus: sum(items) };
}

export function groupUsers(expenses: ExpenseView[], people: Map<string, Person>): Bucket[] {
  const groups = new Map<string, ExpenseView[]>();
  for (const expense of expenses) {
    const list = groups.get(expense.ownerId) ?? [];
    list.push(expense);
    groups.set(expense.ownerId, list);
  }
  return [...groups.entries()]
    .map(([id, items]) => {
      const person = people.get(id);
      return bucket(id, person?.name || id, person?.email && person.email !== person.name ? person.email : "", items);
    })
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

export function groupDebtors(expenses: ExpenseView[]): Bucket[] {
  const groups = new Map<string, ExpenseView[]>();
  for (const expense of expenses) {
    const key = debtorKey(expense.debtorName);
    const list = groups.get(key) ?? [];
    list.push(expense);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([key, items]) => bucket(key, debtorLabel(key), "", items))
    .sort((a, b) => {
      if (a.key === EMPTY_DEBTOR) {
        return 1;
      }
      if (b.key === EMPTY_DEBTOR) {
        return -1;
      }
      return a.label.localeCompare(b.label, "tr");
    });
}

export function groupDates(expenses: ExpenseView[]): Bucket[] {
  const groups = new Map<string, ExpenseView[]>();
  for (const expense of expenses) {
    const list = groups.get(expense.expenseDate) ?? [];
    list.push(expense);
    groups.set(expense.expenseDate, list);
  }
  return [...groups.entries()]
    .map(([date, items]) => bucket(date, formatTrDate(date), "", items))
    .sort((a, b) => b.key.localeCompare(a.key));
}

export function listFiles(expenses: ExpenseView[], ownerId: string): ExpenseView[] {
  return expenses
    .filter((expense) => expense.ownerId === ownerId)
    .sort((a, b) => {
      const byDate = b.expenseDate.localeCompare(a.expenseDate);
      if (byDate !== 0) {
        return byDate;
      }
      return debtorLabel(debtorKey(a.debtorName)).localeCompare(debtorLabel(debtorKey(b.debtorName)), "tr");
    });
}

export function expensesFor(expenses: ExpenseView[], ownerId: string, debtor?: string, date?: string): ExpenseView[] {
  return expenses.filter((expense) => {
    if (expense.ownerId !== ownerId) {
      return false;
    }
    if (debtor !== undefined && debtorKey(expense.debtorName) !== debtor) {
      return false;
    }
    if (date !== undefined && expense.expenseDate !== date) {
      return false;
    }
    return true;
  });
}
