export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-extrabold">Good morning ☀️</h1>
      <p className="text-sm font-semibold text-gray-600">
        What needs attention today? (Phase 2 scaffold — slices in Phase 3)
      </p>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white border-2 border-ink rounded-2xl p-3 shadow-hard">
          <span className="text-xs font-bold">₦ PENDING</span>
          <b className="block text-2xl">₦0</b>
        </div>
        <div className="bg-[#00E5FF] border-2 border-ink rounded-2xl p-3 shadow-hard">
          <span className="text-xs font-bold">NEW</span>
          <b className="block text-2xl">0</b>
        </div>
        <div className="bg-[#7C4DFF] text-white border-2 border-ink rounded-2xl p-3 shadow-hard">
          <span className="text-xs font-bold">PROCESSING</span>
          <b className="block text-2xl">0</b>
        </div>
        <div className="bg-[#00E676] border-2 border-ink rounded-2xl p-3 shadow-hard">
          <span className="text-xs font-bold">FOLLOW-UPS</span>
          <b className="block text-2xl">0</b>
        </div>
      </div>
      <a
        href="/add"
        className="block text-center mt-4 bg-brand text-white font-extrabold p-4 rounded-2xl border-2 border-ink shadow-hard"
      >
        + Add Order
      </a>
      <p className="mt-4 text-xs">DB: local Postgres `qubators` • Auth: Better Auth • Storage: R2</p>
    </main>
  );
}
