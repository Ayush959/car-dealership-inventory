import { useId } from "react";

// Original vector artwork: representative silhouettes, not manufacturer photography.
export default function CarArt({
  category = "Sports",
  color = "#a6b3a7",
  large = false,
}) {
  const id = useId().replaceAll(":", "");
  const suv = category === "SUV";
  return (
    <svg
      viewBox="0 0 560 250"
      className={`car-art ${large ? "large" : ""}`}
      role="img"
      aria-label={`${category} vehicle illustration`}
    >
      <defs>
        <linearGradient id={`${id}paint`} x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#fff" stopOpacity=".8" />
          <stop offset=".24" stopColor={color} />
          <stop offset=".75" stopColor={color} />
          <stop offset="1" stopColor="#22322e" />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#84999d" />
          <stop offset=".48" stopColor="#30454a" />
          <stop offset="1" stopColor="#122529" />
        </linearGradient>
        <radialGradient id={`${id}shadow`}>
          <stop stopColor="#24372c" stopOpacity=".25" />
          <stop offset="1" stopColor="#24372c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="283" cy="207" rx="245" ry="24" fill={`url(#${id}shadow)`} />
      <g transform={suv ? "translate(0,-10)" : ""}>
        <path
          d={
            suv
              ? "M64 151 78 102 139 94 176 47 362 47 418 102 488 114 506 165 495 192 65 192 52 173Z"
              : "M49 163 79 137 160 123 222 77Q249 62 291 70L363 113 458 130Q493 137 509 164L503 188 57 188Z"
          }
          fill={`url(#${id}paint)`}
          stroke="#34433c"
          strokeWidth="1.5"
        />
        <path
          d={
            suv
              ? "M156 99 184 58 264 58 264 99Z M276 58 353 58 397 100 276 99Z"
              : "M178 123 227 84Q241 75 263 78L263 119Z M275 80 292 82 347 115 275 119Z"
          }
          fill={`url(#${id}glass)`}
          stroke="#d1d8d3"
          strokeWidth="3"
        />
        <path
          d={
            suv
              ? "M269 106V177M403 107V175"
              : "M270 126 263 176M356 125 376 175"
          }
          fill="none"
          stroke="#405248"
          opacity=".55"
        />
        <path
          d="M70 168Q282 186 491 159"
          fill="none"
          stroke="#f2f3e7"
          strokeWidth="2"
          opacity=".5"
        />
        <path d="M185 188H371" stroke="#25322e" strokeWidth="7" />
        <path d="M467 137 491 146 496 155 466 151Z" fill="#f7f6d9" />
        <path d="M63 148 82 141 78 154 58 160Z" fill="#c6604e" />
        <path d="M487 169H505M58 173H77" stroke="#25322e" strokeWidth="5" />
        <rect
          x="283"
          y={suv ? "111" : "132"}
          width="22"
          height="4"
          rx="2"
          fill="#35473e"
        />
        {[138, 416].map((x) => (
          <g key={x} transform={`translate(${x},181)`}>
            <circle r="39" fill="#25312d" />
            <circle r="30" fill="#19211f" stroke="#6c7770" strokeWidth="2" />
            <circle r="23" fill="#8d9890" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path
                key={a}
                d="M-4-5-6-22 4-22 5-5Z"
                fill="#28352f"
                transform={`rotate(${a})`}
              />
            ))}
            <circle r="7" fill="#bac4b9" />
            <circle r="3" fill="#405047" />
          </g>
        ))}
        <path
          d="M95 179a44 44 0 0 1 86 0M373 179a44 44 0 0 1 86 0"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
        <path
          d="M343 113 355 107 371 112 368 121 351 121Z"
          fill={color}
          stroke="#3a4b40"
        />
      </g>
    </svg>
  );
}
