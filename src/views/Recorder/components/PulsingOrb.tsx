import { motion } from "framer-motion";

const PulsingOrb = () => {
  const transition = {
    duration: 1.5,
    ease: "easeInOut",
    repeat: Infinity,
  };

  return (
    <div className="relative flex items-center justify-center w-full">
      {/* Base Orb */}
      <motion.div
        className="absolute w-8 h-8 bg-blue-500 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={transition}
      />
      {/* Outer Ring */}
      <motion.div
        className="absolute w-10 h-10 border-2 border-blue-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ ...transition, delay: 0.2 }} // Slightly delayed
      />
      {/* Inner Dot */}
      <motion.div
        className="absolute w-4 h-4 bg-blue-300 rounded-full"
        animate={{
          scale: [1, 0.8, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{ ...transition, delay: 0.4 }} // More delayed
      />
    </div>
  );
};

export default PulsingOrb;
