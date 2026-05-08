import { useState } from "react";
import SearchBar from "./components/SearchBar.jsx";
import ImageGrid from "./components/ImageGrid.jsx";
import ImageModal from "./components/ImageModal.jsx";

export default function App() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("general");
  const [results, setResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError("Enter a search term first.");
      return;
    }

    setStatus("loading");
    setError("");
    setResults([]);

    try {
      const params = new URLSearchParams({
        query: trimmedQuery,
        domain
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();

      let payload;
      if (contentType.includes("application/json")) {
        payload = rawText ? JSON.parse(rawText) : null;
      } else {
        throw new Error(
          "The API route is returning a page instead of JSON. Check that api/search.js is at the GitHub repository root and redeploy in Vercel."
        );
      }

      if (!response.ok) {
        throw new Error(payload?.error || "The search failed.");
      }

      setResults(Array.isArray(payload) ? payload : []);
      setStatus("success");
    } catch (err) {
      setError(err.message || "The search failed.");
      setStatus("error");
    }
  }

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1700);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0,_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_42%,_#f8fafc_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
                <span aria-hidden="true">🎓</span>
                TeacherOnCall Image Finder
              </div>

              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Find open-licence images for tests, slides and worksheets.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Search academic image sources by subject domain, filter out unsuitable terms,
                enforce permitted licences and copy formatted citations in one click.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-black">Licence gate active</div>
              <p className="mt-1 max-w-xs">
                Returns only CC0 / Public Domain, CC BY and CC BY-NC. ND, SA and restrictive copyright are excluded.
              </p>
            </div>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            domain={domain}
            setDomain={setDomain}
            onSearch={handleSearch}
            loading={status === "loading"}
          />
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {status === "idle" && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/65 p-10 text-center text-slate-600">
            Try searches like <strong>meiosis diagram</strong>, <strong>Saturn rings</strong>, <strong>sunflowers</strong>, <strong>sodium chloride</strong> or <strong>ancient Egyptian pottery</strong>.
          </div>
        )}

        {status === "loading" && (
          <div className="rounded-3xl border border-slate-200 bg-white/75 p-10 text-center text-slate-600 shadow-soft">
            Searching open educational repositories…
          </div>
        )}

        {status === "success" && results.length === 0 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
            No licence-safe images were returned. Try a broader term or a different subject domain.
          </div>
        )}

        <ImageGrid results={results} onSelect={setSelectedImage} />

        {selectedImage && (
          <ImageModal
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            onCopied={() => showToast("Copied!")}
            onCopyFailed={() => showToast("Copy failed")}
          />
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-soft">
            {toast}
          </div>
        )}
      </section>
    </main>
  );
}
