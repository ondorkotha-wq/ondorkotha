const GotoArrows = () => {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col space-y-3">
      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-800 shadow-lg"
      >
        ↑
      </button>

      {/* Scroll to Bottom Button */}
      <button
        onClick={() =>
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          })
        }
        className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-800 shadow-lg"
      >
        ↓
      </button>
    </div>
  );
};

export default GotoArrows;
