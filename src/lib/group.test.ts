import assert from "node:assert/strict";
import test from "node:test";

import { debtorKey, debtorLabel, expensesFor, formatTrDate, groupDates, groupDebtors, groupUsers, listFiles, type ExpenseView, type Person } from "./group";

function expense(patch: Partial<ExpenseView>): ExpenseView {
  return {
    id: "e",
    ownerId: "u1",
    debtorName: "Ali",
    expenseDate: "2026-10-01",
    clientName: "Ayşe",
    enforcementOffice: "",
    fileCaseNumber: "1",
    instructionNumber: "",
    note: "",
    lines: [],
    totalAmountKurus: 100,
    ...patch,
  };
}

test("groups users, then debtors, then dates", () => {
  const rows = [
    expense({ id: "a", totalAmountKurus: 100 }),
    expense({ id: "b", debtorName: "  ", expenseDate: "2026-10-02", totalAmountKurus: 50 }),
    expense({ id: "c", ownerId: "u2", debtorName: "Veli", expenseDate: "2026-09-01", totalAmountKurus: 25 }),
  ];
  const people = new Map<string, Person>([
    ["u1", { id: "u1", name: "Alp Demetgül", email: "alp@example.com" }],
    ["u2", { id: "u2", name: "Elif Sarı", email: "elif@example.com" }],
  ]);
  const users = groupUsers(rows, people);
  assert.deepEqual(
    users.map((item) => item.label),
    ["Alp Demetgül", "Elif Sarı"],
  );
  assert.equal(users[0]?.count, 2);
  assert.equal(users[0]?.totalAmountKurus, 150);

  const debtors = groupDebtors(expensesFor(rows, "u1"));
  assert.deepEqual(
    debtors.map((item) => item.key),
    ["Ali", "-"],
  );
  assert.equal(debtorLabel("-"), "Borçlu belirtilmemiş");

  const dates = groupDates(expensesFor(rows, "u1", debtorKey("Ali")));
  assert.deepEqual(
    dates.map((item) => item.label),
    ["01.10.2026"],
  );
  assert.equal(formatTrDate("2026-10-25"), "25.10.2026");

  assert.deepEqual(
    listFiles(rows, "u1").map((item) => item.id),
    ["b", "a"],
  );
});
