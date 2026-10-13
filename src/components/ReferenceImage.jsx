// Render photo regions from the supplied screenshot without editing the source.
export const photoRegions = {
  pizza: { x: 568, y: 38, width: 136, height: 94 },
  shake: { x: 387, y: 248, width: 29, height: 44 },
  burger: { x: 386, y: 310, width: 30, height: 37 },
  bestseller1: { x: 387, y: 97, width: 31, height: 46 },
  bestseller2: { x: 423, y: 97, width: 30, height: 46 },
  bestseller3: { x: 458, y: 97, width: 31, height: 46 },
  bestseller4: { x: 494, y: 97, width: 30, height: 46 },
};
export default function ReferenceImage({
  region = 'pizza',
  alt,
  className = '',
}) {
  const crop = photoRegions[region];
  return (
    <span
      className={`reference-photo ${className}`}
      style={{ aspectRatio: `${crop.width} / ${crop.height}` }}
    >
      <img
        src="/assets/figma-reference.png"
        alt={alt}
        draggable="false"
        style={{
          width: `${(728 / crop.width) * 100}%`,
          height: `${(349 / crop.height) * 100}%`,
          left: `${(-crop.x / crop.width) * 100}%`,
          top: `${(-crop.y / crop.height) * 100}%`,
        }}
      />
    </span>
  );
}
