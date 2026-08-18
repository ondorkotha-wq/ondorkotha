import React from "react";

interface LoadingDotsProps {
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = "md",
  color = "#3b82f6", // Default blue-500
}) => {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const dotSize = {
    xs: "w-2 h-2",
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const positions = [
    { top: "0%", left: "50%", delay: "-1.1s" },
    { top: "13.4%", left: "86.6%", delay: "-1.0s" },
    { top: "50%", left: "100%", delay: "-0.9s" },
    { top: "86.6%", left: "86.6%", delay: "-0.8s" },
    { top: "100%", left: "50%", delay: "-0.7s" },
    { top: "86.6%", left: "13.4%", delay: "-0.6s" },
    { top: "50%", left: "0%", delay: "-0.5s" },
    { top: "13.4%", left: "13.4%", delay: "-0.4s" },
  ];

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {positions?.map((pos, index) => (
        <div
          key={index}
          className={`absolute ${dotSize[size]} rounded-full animate-pulse-dots`}
          style={{
            backgroundColor: color,
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -50%)",
            animationDelay: pos.delay,
          }}
        />
      ))}
    </div>
  );
};

export default LoadingDots;
