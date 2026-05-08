import ImageCard from "./ImageCard.jsx";

export default function ImageGrid({ results, onSelect }) {
  if (!results.length) return null;

  return (
    <section
      aria-label="Image results"
      className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4"
    >
      {results.map((image) => (
        <ImageCard key={`${image.imageUrl}-${image.originalLink}`} image={image} onSelect={onSelect} />
      ))}
    </section>
  );
}
