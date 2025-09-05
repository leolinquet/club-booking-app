import { motion } from "framer-motion";

export const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
  >
    {children}
  </motion.div>
);

export const Pop = ({ children, ...props }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    whileHover={{ scale: 1.02 }}
    className="btn"
    {...props}
  >
    {children}
  </motion.button>
);
