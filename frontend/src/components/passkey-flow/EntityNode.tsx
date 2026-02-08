import { motion, AnimatePresence } from "framer-motion";
import { Globe, Server, Fingerprint } from "lucide-react";
import type { EntityType } from "./flowData";

const entityConfig: Record<
  EntityType,
  {
    icon: typeof Globe;
    label: string;
  }
> = {
  browser: {
    icon: Globe,
    label: "Browser",
  },
  server: {
    icon: Server,
    label: "Server",
  },
  authenticator: {
    icon: Fingerprint,
    label: "Authenticator",
  },
};

type EntityNodeProps = {
  type: EntityType;
  isActive: boolean;
  statusText?: string;
  stepId: number;
};

export function EntityNode({
  type,
  isActive,
  statusText,
  stepId,
}: EntityNodeProps) {
  const config = entityConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      className="relative flex h-[100px] w-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card sm:h-[116px] sm:w-[150px]"
      animate={{
        borderColor: isActive
          ? "hsl(222.2, 47.4%, 11.2%)"   // --primary
          : "hsl(214.3, 31.8%, 91.4%)",  // --border
        boxShadow: isActive
          ? "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
          : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.div
        animate={{
          color: isActive
            ? "hsl(222.2, 84%, 4.9%)"      // --foreground
            : "hsl(215.4, 16.3%, 46.9%)",  // --muted-foreground
        }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
      </motion.div>

      <span className="text-xs font-semibold text-foreground sm:text-sm">
        {config.label}
      </span>

      {/* Fixed-height status area — crossfade only, no y-shift */}
      <div className="relative h-4 w-full text-center sm:h-5">
        <AnimatePresence mode="popLayout">
          {statusText && (
            <motion.p
              key={`${type}-${stepId}`}
              className="absolute inset-x-0 top-0 truncate px-2 text-[10px] font-medium text-muted-foreground sm:text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {statusText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { entityConfig };
