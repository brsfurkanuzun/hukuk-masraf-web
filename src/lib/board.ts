import "server-only";

import { cache } from "react";

import { firestore } from "@/lib/db";
import type { ExpenseDocument, ExpenseLine, ExpenseView, Person } from "@/lib/group";
import { parseTypeCatalog } from "@/lib/labels";

export interface Board {
  expenses: ExpenseView[];
  people: Map<string, Person>;
  typeLabels: Record<string, string>;
}

export type BoardResult = { ok: true; board: Board } | { ok: false; reason: "unconfigured" | "unavailable" };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function kurus(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}

function documentsOf(value: unknown): ExpenseDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const document = entry as Record<string, unknown>;
    const url = text(document.url);
    if (!url.startsWith("https://")) {
      return [];
    }
    return [{ fileName: text(document.fileName) || "Belge", mimeType: text(document.mimeType), url }];
  });
}

function linesOf(value: unknown): ExpenseLine[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const item = entry as Record<string, unknown>;
    return [{ type: text(item.type), note: text(item.note), amountKurus: kurus(item.amountKurus), documents: documentsOf(item.attachments) }];
  });
}

function personFrom(id: string, data: Record<string, unknown> | undefined): Person {
  const email = text(data?.email);
  const named = [text(data?.firstName), text(data?.lastName)].filter((part) => part.length > 0).join(" ");
  const display = text(data?.displayName);
  const name = named || (display && !display.includes("@") ? display : "") || email || id;
  return { id, name, email };
}

export const loadBoard = cache(async (): Promise<BoardResult> => {
  const db = firestore();
  if (!db) {
    return { ok: false, reason: "unconfigured" };
  }
  try {
    const [expensesSnap, usersSnap, catalogSnap] = await Promise.all([
      db.collection("expenses").get(),
      db.collection("users").get(),
      db.collection("catalog").doc("expenseTypes").get(),
    ]);
    const people = new Map<string, Person>();
    usersSnap.forEach((doc) => {
      people.set(doc.id, personFrom(doc.id, doc.data()));
    });
    const expenses: ExpenseView[] = [];
    expensesSnap.forEach((doc) => {
      const data = doc.data();
      const lines = linesOf(data.expenseItems);
      const storedTotal = kurus(data.totalAmountKurus);
      const summed = lines.reduce((total, line) => total + line.amountKurus, 0);
      expenses.push({
        id: doc.id,
        ownerId: text(data.ownerId) || text(data.userId),
        debtorName: text(data.debtorName),
        expenseDate: text(data.expenseDate),
        clientName: text(data.clientName),
        enforcementOffice: text(data.enforcementOffice),
        fileCaseNumber: text(data.fileCaseNumber),
        instructionNumber: text(data.instructionNumber),
        note: text(data.note),
        lines,
        totalAmountKurus: summed || storedTotal,
      });
    });
    return { ok: true, board: { expenses, people, typeLabels: parseTypeCatalog(catalogSnap.data()) } };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
});
