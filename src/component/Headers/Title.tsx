import React from "react";

type TitleProps = {
  title: string;
};

const Title: React.FC<TitleProps> = ({ title }) => {
  return (
    <div className="w-full border-b border-gray-200 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base md:text-lg lg:text-xl font-light tracking-tight">{title}</h2>
      </div>
    </div>
  );
};

export default Title;
