function badgeClasses(licenseType) {
  if (licenseType.includes("Public Domain") || licenseType.includes("CC0")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (licenseType.includes("CC BY-NC")) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-blue-50 text-blue-700 ring-blue-200";
}

export default function ImageCard({ image, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(image)}
      className="masonry-card image-fade mb-5 w-full overflow-hidden rounded-3xl border border-white/80 bg-white text-left shadow-soft transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
    >
      <div className="bg-slate-100">
        <img
          src={image.imageUrl}
          alt={image.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-auto w-full object-cover"
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${badgeClasses(image.licenseType)}`}>
            {image.licenseType}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            {image.source}
          </span>
        </div>

        <h2 className="line-clamp-3 text-base font-black leading-snug text-slate-950">
          {image.title}
        </h2>

        <p className="line-clamp-2 text-sm text-slate-500">{image.author}</p>
      </div>
    </button>
  );
}
