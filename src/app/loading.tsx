import { Frame } from "@/components/ledger";

export default function Loading() {
  return (
    <Frame title="Yükleniyor">
      <p className="rounded-2xl bg-white px-4 py-6 text-[#636366]">Kayıtlar yükleniyor.</p>
    </Frame>
  );
}
