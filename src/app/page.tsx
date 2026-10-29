import { connection } from "next/server";

import { Frame, LedgerTree, Notice, type UserBranch } from "@/components/ledger";
import { loadBoard } from "@/lib/board";
import { groupUsers, listFiles } from "@/lib/group";

interface Search {
  kullanici?: string;
  masraf?: string;
}

function queryHref(next: Search): string {
  const params = new URLSearchParams();
  if (next.kullanici) {
    params.set("kullanici", next.kullanici);
  }
  if (next.masraf) {
    params.set("masraf", next.masraf);
  }
  const value = params.toString();
  return value ? `/?${value}` : "/";
}

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  await connection();
  const query = await searchParams;
  const result = await loadBoard();
  if (!result.ok) {
    return (
      <Notice title={result.reason === "unconfigured" ? "Bağlantı kurulmadı" : "Kayıtlar okunamadı"}>
        {result.reason === "unconfigured" ? (
          <p>
            Site giriş sormaz. Kayıtları sunucu, Firebase hizmet hesabıyla okur. Proje klasöründe <code>.env.local</code> dosyasına{" "}
            <code>FIREBASE_SERVICE_ACCOUNT_PATH</code> yazıp indirdiğin JSON dosyasının yolunu ver. Anahtarı depoya koyma.
          </p>
        ) : (
          <p>Firestore yanıt vermedi. Hizmet hesabının bu projeyi okuyabildiğini kontrol et.</p>
        )}
      </Notice>
    );
  }

  const { expenses, people, typeLabels } = result.board;
  const userId = query.kullanici?.trim() ?? "";
  const expenseId = query.masraf?.trim() ?? "";
  const users: UserBranch[] = groupUsers(expenses, people).map((user) => {
    const open = user.key === userId;
    const files = listFiles(expenses, user.key).map((expense) => {
      const selected = open && expense.id === expenseId;
      return {
        expense,
        open: selected,
        href: queryHref(selected ? { kullanici: user.key } : { kullanici: user.key, masraf: expense.id }),
      };
    });
    return { ...user, open, href: open ? "/" : queryHref({ kullanici: user.key }), files };
  });

  return (
    <Frame title="Kullanıcılar">
      <LedgerTree users={users} typeLabels={typeLabels} />
    </Frame>
  );
}
