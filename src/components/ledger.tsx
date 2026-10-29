"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { Collapse } from "@/components/collapse";
import { formatTrDate, type Bucket, type ExpenseDocument, type ExpenseView } from "@/lib/group";
import { typeLabel } from "@/lib/labels";
import { formatKurus } from "@/lib/money";

export interface UserBranch extends Bucket {
  href: string;
  open: boolean;
  files: { expense: ExpenseView; href: string; open: boolean }[];
}

export function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3">
        <Link href="/" className="text-sm font-semibold tracking-wide text-[#1c3d5a]">
          Hukuk Masraf
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1c1c1e]">{title}</h1>
      </header>
      {children}
    </div>
  );
}

function hrefFor(userId: string | null, expenseId: string | null): string {
  const params = new URLSearchParams();
  if (userId) {
    params.set("kullanici", userId);
  }
  if (expenseId) {
    params.set("masraf", expenseId);
  }
  const value = params.toString();
  return value ? `/?${value}` : "/";
}

export function LedgerTree({
  users,
  typeLabels,
}: {
  users: UserBranch[];
  typeLabels: Record<string, string>;
}) {
  const remoteUser = users.find((user) => user.open)?.key ?? null;
  const remoteExpense = users.flatMap((user) => user.files).find((file) => file.open)?.expense.id ?? null;
  const [userId, setUserId] = useState<string | null>(remoteUser);
  const [expenseId, setExpenseId] = useState<string | null>(remoteExpense);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      setUserId(params.get("kullanici"));
      setExpenseId(params.get("masraf"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function show(nextUser: string | null, nextExpense: string | null) {
    setUserId(nextUser);
    setExpenseId(nextExpense);
    const href = hrefFor(nextUser, nextExpense);
    window.history.pushState(null, "", href);
  }

  if (users.length === 0) {
    return <p className="rounded-2xl bg-white px-4 py-6 text-[#636366]">Henüz masraf yok.</p>;
  }
  return (
    <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(60,60,67,0.12)]">
      {users.map((user) => {
        const userOpen = user.key === userId;
        return (
          <li key={user.key} className="border-t border-[rgba(60,60,67,0.12)] first:border-t-0">
            <RowLink
              href={userOpen ? "/" : hrefFor(user.key, null)}
              open={userOpen}
              onToggle={() => show(userOpen ? null : user.key, null)}
              label={user.label}
              detail={user.detail}
              amount={formatKurus(user.totalAmountKurus)}
              meta={`${user.count} masraf`}
            />
            <Collapse open={userOpen}>
              <ul className="border-t border-[rgba(60,60,67,0.12)] bg-[#f7f7f9]">
                {user.files.length === 0 ? (
                  <li className="px-4 py-3 pl-8 text-sm text-[#636366]">Bu kullanıcıya ait dosya yok.</li>
                ) : (
                  user.files.map((file) => {
                    const fileOpen = userOpen && file.expense.id === expenseId;
                    return (
                      <li key={file.expense.id} className="border-t border-[rgba(60,60,67,0.08)] first:border-t-0">
                        <RowLink
                          href={fileOpen ? hrefFor(user.key, null) : hrefFor(user.key, file.expense.id)}
                          open={fileOpen}
                          nested
                          onToggle={() => show(user.key, fileOpen ? null : file.expense.id)}
                          label={file.expense.debtorName.trim() || "Borçlu belirtilmemiş"}
                          detail={fileDetail(file.expense)}
                          amount={formatKurus(file.expense.totalAmountKurus)}
                          meta=""
                        />
                        <Collapse open={fileOpen}>
                          <div className="px-3 pb-3 pl-8">
                            <ExpenseCards expenses={[file.expense]} typeLabels={typeLabels} />
                          </div>
                        </Collapse>
                      </li>
                    );
                  })
                )}
              </ul>
            </Collapse>
          </li>
        );
      })}
    </ul>
  );
}

function fileDetail(expense: ExpenseView): string {
  const parts = [formatTrDate(expense.expenseDate), expense.clientName.trim(), expense.fileCaseNumber.trim() ? `Esas ${expense.fileCaseNumber.trim()}` : ""].filter(
    (part) => part.length > 0,
  );
  return parts.join(" · ");
}

function RowLink({
  href,
  open,
  nested,
  onToggle,
  label,
  detail,
  amount,
  meta,
}: {
  href: string;
  open: boolean;
  nested?: boolean;
  onToggle: () => void;
  label: string;
  detail: string;
  amount: string;
  meta: string;
}) {
  return (
    <a
      href={href}
      aria-expanded={open}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        onToggle();
      }}
      className={`flex items-center justify-between gap-4 py-3 hover:bg-[#f2f2f7] ${nested ? "pr-4 pl-8" : "px-4"}`}
    >
      <span className="flex min-w-0 items-start gap-2">
        <span
          aria-hidden
          className={`mt-1 inline-block text-xs text-[#636366] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-medium text-[#1c1c1e]">{label}</span>
          {detail ? <span className="block truncate text-sm text-[#636366]">{detail}</span> : null}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold tabular-nums text-[#1c3d5a]">{amount}</span>
        {meta ? <span className="block text-xs text-[#636366]">{meta}</span> : null}
      </span>
    </a>
  );
}

export function ExpenseCards({ expenses, typeLabels }: { expenses: ExpenseView[]; typeLabels: Record<string, string> }) {
  const ordered = [...expenses].sort((a, b) => a.clientName.localeCompare(b.clientName, "tr") || a.fileCaseNumber.localeCompare(b.fileCaseNumber, "tr"));
  if (ordered.length === 0) {
    return <p className="rounded-2xl bg-white px-4 py-6 text-[#636366]">Bu tarihte kayıt yok.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {ordered.map((expense) => (
        <article key={expense.id} className="rounded-2xl bg-white px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1c1c1e]">{expense.clientName || "Müvekkil yok"}</h2>
              <p className="text-sm text-[#636366]">{formatTrDate(expense.expenseDate)}</p>
            </div>
            <p className="text-base font-semibold tabular-nums text-[#1c3d5a]">{formatKurus(expense.totalAmountKurus)}</p>
          </div>
          <dl className="mt-3 grid gap-1 text-sm">
            <Fact label="Dosya borçlusu" value={expense.debtorName || "—"} />
            <Fact label="İcra dairesi" value={expense.enforcementOffice || "—"} />
            <Fact label="Esas no" value={expense.fileCaseNumber || "—"} />
            <Fact label="Talimat no" value={expense.instructionNumber || "—"} />
            {expense.note ? <Fact label="Not" value={expense.note} /> : null}
          </dl>
          {expense.lines.length > 0 ? (
            <ul className="mt-3 border-t border-[rgba(60,60,67,0.12)] pt-3">
              {expense.lines.map((line, index) => (
                <li key={`${expense.id}-${index}`} className="flex flex-col gap-2 py-2 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span>
                      <span className="font-medium">{typeLabel(line.type, typeLabels)}</span>
                      {line.note ? <span className="text-[#636366]"> · {line.note}</span> : null}
                    </span>
                    <span className="tabular-nums">{formatKurus(line.amountKurus)}</span>
                  </div>
                  {line.documents.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {line.documents.map((document) => (
                        <DocumentView key={document.url} document={document} />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function DocumentView({ document }: { document: ExpenseDocument }) {
  if (document.mimeType.startsWith("image/")) {
    return (
      <a href={document.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-[#f2f2f7]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={document.url} alt={document.fileName} className="max-h-80 w-full object-contain" />
      </a>
    );
  }
  return (
    <a href={document.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#1c3d5a] underline">
      {document.fileName}
    </a>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2">
      <dt className="text-[#636366]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Frame title={title}>
      <div className="rounded-2xl bg-white px-4 py-5 text-sm leading-6 text-[#3a3a3c]">{children}</div>
    </Frame>
  );
}
