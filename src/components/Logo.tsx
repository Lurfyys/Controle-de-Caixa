import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  theme?: "luxo" | "claro" | "rubi";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 52,
  showText = true,
  theme = "luxo",
}) => {
  const logos = {
    luxo: "/logos/logo-luxo.png",
    claro: "/logos/logo-claro.png",
    rubi: "/logos/logo-rubi.png",
  };

  const logo = logos[theme];

  return (
    <div
      className={`flex items-center gap-4 select-none ${className}`}
      id="blackstone-logo"
    >
      <img
        src={logo}
        alt="BlackStone Diamond"
        draggable={false}
        style={{
          width: size,
          height: size,
        }}
        className="
          object-contain
          transition-all
          duration-500
          ease-out
          hover:scale-110
        "
      />

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-semibold tracking-[0.22em] text-lg ${
              theme === "claro"
                ? "text-neutral-900"
                : "text-white"
            }`}
          >
            BLACKSTONE
          </span>

          <span
            className={`mt-2 text-[9px] tracking-[0.55em] uppercase ${
              theme === "claro"
                ? "text-neutral-500"
                : "text-amber-300"
            }`}
          >
            DIAMOND
          </span>
        </div>
      )}
    </div>
  );
};