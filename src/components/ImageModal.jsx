function makeCitation(image) {
  return `"${image.title}" by ${image.author}, retrieved from ${image.source}. License: ${image.licenseType}. Source: ${image.originalLink}`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export default function ImageModal({ image, onClose, onCopied, onCopyFailed }) {
  async function handleCopyCitation() {
    try {
      await copyText(makeCitation(image));
      onCopied();
    } catch {
      onCopyFailed();
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Image details for ${image.title}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">{image.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{image.source}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close image modal"
          >
            ✕
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-74px)] overflow-auto lg:grid-cols-[1fr_360px]">
          <div className="flex items-center justify-center bg-slate-100 p-4">
            <img
              src={image.imageUrl}
              alt={image.title}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-soft"
            />
          </div>

          <aside className="space-y-5 p-5">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">Creator</h3>
              <p className="mt-1 text-sm font-semibold text-slate-800">{image.author}</p>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">Licence</h3>
              <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700 ring-1 ring-emerald-200">
                {image.licenseType}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">Citation</h3>
              <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                {makeCitation(image)}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleCopyCitation}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Copy Citation
              </button>

              <a
                href={image.originalLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Open Source Page
              </a>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
