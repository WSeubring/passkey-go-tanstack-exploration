import { motion, LayoutGroup } from "framer-motion";
import type { FlowType } from "./flowData";

type FlowToggleProps = {
  flowType: FlowType;
  onToggle: (type: FlowType) => void;
};

export function FlowToggle({ flowType, onToggle }: FlowToggleProps) {
  return (
    <LayoutGroup>
      <div
        className="relative inline-flex rounded-lg border border-border bg-muted p-0.5"
        role="tablist"
      >
        <button
          className="relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm"
          role="tab"
          aria-selected={flowType === "registration"}
          onClick={() => onToggle("registration")}
        >
          {flowType === "registration" && (
            <motion.div
              className="absolute inset-0 rounded-md bg-card shadow-sm"
              layoutId="flow-toggle-pill"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          <span
            className={`relative z-10 ${
              flowType === "registration"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Registration
          </span>
        </button>
        <button
          className="relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm"
          role="tab"
          aria-selected={flowType === "login"}
          onClick={() => onToggle("login")}
        >
          {flowType === "login" && (
            <motion.div
              className="absolute inset-0 rounded-md bg-card shadow-sm"
              layoutId="flow-toggle-pill"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          <span
            className={`relative z-10 ${
              flowType === "login"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Login
          </span>
        </button>
      </div>
    </LayoutGroup>
  );
}
