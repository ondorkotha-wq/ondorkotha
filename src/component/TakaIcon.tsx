type TakaIconProps = {
  textSize?: string;
};

const TakaIcon = ({ textSize = "text-base" }: TakaIconProps) => {
  return <span className={textSize}>৳</span>;
};

export default TakaIcon;
