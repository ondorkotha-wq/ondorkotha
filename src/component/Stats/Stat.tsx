type StatProps = {
  title: string;
  value: number;
};

export const Stat = ({ title, value }: StatProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  );
};
