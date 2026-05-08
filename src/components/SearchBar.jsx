const DOMAINS = [
  { value: "general", label: "General / Cross-Domain" },
  { value: "art", label: "Art" },
  { value: "humanities", label: "Humanities" },
  { value: "stem", label: "Science / STEM" }
];

export default function SearchBar({ query, setQuery, domain, setDomain, onSearch, loading }) {
  return (
    <form onSubmit={onSearch} className="mt-8 grid gap-3 lg:grid-cols-[1fr_240px_auto]">
      <label className="sr-only" htmlFor="image-search">
        Search educational images
      </label>

      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        >
          🔎
        </span>
        <input
          id="image-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a diagram, artwork, molecule, map or classroom image…"
          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-base font-medium outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
          autoComplete="off"
        />
      </div>

      <label className="sr-only" htmlFor="domain">
        Subject domain
      </label>

      <select
        id="domain"
        value={domain}
        onChange={(event) => setDomain(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
      >
        {DOMAINS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading}
        className="h-14 rounded-2xl bg-blue-600 px-7 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
