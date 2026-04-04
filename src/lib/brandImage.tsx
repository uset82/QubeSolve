const FRONT_FACE_ROWS = [
  ["#F0F0F0", "#4488FF", "#FF4444"],
  ["#44CC44", "#44CC44", "#FFD93D"],
  ["#FF8C00", "#44CC44", "#F0F0F0"],
];

function getTileStyle(size: number) {
  return {
    width: size,
    height: size,
    borderRadius: size * 0.22,
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
  };
}

export function renderBrandImage(size: number) {
  const faceSize = size * 0.62;
  const gap = faceSize * 0.04;
  const tileSize = (faceSize - gap * 2) / 3;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 28% 22%, rgba(108,99,255,0.46), transparent 34%), radial-gradient(circle at 72% 74%, rgba(0,212,170,0.34), transparent 38%), #0F0F1A",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: size * 0.3,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02))",
          filter: "blur(24px)",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap,
          padding: size * 0.075,
          borderRadius: size * 0.19,
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(10,12,30,0.92))",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.12)",
          transform: "rotate(-12deg) skewY(-4deg)",
        }}
      >
        {FRONT_FACE_ROWS.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            style={{
              display: "flex",
              gap,
            }}
          >
            {row.map((color, columnIndex) => (
              <div
                key={`tile-${rowIndex}-${columnIndex}`}
                style={{
                  ...getTileStyle(tileSize),
                  background: color,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
