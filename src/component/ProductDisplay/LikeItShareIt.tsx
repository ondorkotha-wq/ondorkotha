import { BsFacebook, BsLinkedin, BsTwitter } from "react-icons/bs";

const LikeItShareIt = () => {
  const handleSocialShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent("Check out this project!");

    const platforms = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    window.open(platforms[platform as keyof typeof platforms], "_blank");
  };

  return (
    <div className="mt-20 pt-10 border-t border-gray-200 flex flex-col justify-center items-center gap-4">
      <div className="text-sm">Like it? Share it!</div>
      <div className="flex justify-center gap-6">
        <BsFacebook
          onClick={() => handleSocialShare("facebook")}
          size={18}
          className="text-gray-400 hover:text-blue-600 cursor-pointer"
        />
        <BsTwitter
          onClick={() => handleSocialShare("twitter")}
          size={18}
          className="text-gray-400 hover:text-blue-400 cursor-pointer"
        />
        <BsLinkedin
          onClick={() => handleSocialShare("linkedin")}
          size={18}
          className="text-gray-400 hover:text-blue-500 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default LikeItShareIt;
