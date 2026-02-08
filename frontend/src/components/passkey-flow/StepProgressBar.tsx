import { motion } from "framer-motion";
import type { FlowStep } from "./flowData";

type StepProgressBarProps = {
  steps: FlowStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
};

export function StepProgressBar({
  steps,
  currentStep,
  onStepClick,
}: StepProgressBarProps) {
  const currentStepData = steps[currentStep];

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* Step dots */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <motion.button
                className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-bold sm:text-[10px]"
                animate={{
                  backgroundColor: isCompleted || isCurrent
                    ? "hsl(222.2, 47.4%, 11.2%)"   // --primary
                    : "transparent",
                  borderColor: isCompleted || isCurrent
                    ? "hsl(222.2, 47.4%, 11.2%)"   // --primary
                    : "hsl(214.3, 31.8%, 91.4%)",  // --border
                  color: isCompleted || isCurrent
                    ? "hsl(210, 40%, 98%)"           // --primary-foreground
                    : "hsl(215.4, 16.3%, 46.9%)",  // --muted-foreground
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={() => onStepClick(index)}
                aria-label={`Go to step ${index + 1}: ${step.title}`}
              >
                {index + 1}
              </motion.button>
              {index < steps.length - 1 && (
                <div className="relative mx-0.5 h-0.5 w-3 overflow-hidden rounded-full bg-border sm:w-4">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    animate={{
                      width: isCompleted ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step description — fixed height, crossfade only (no y-shift) to prevent jumps */}
      <div className="relative h-[4.5rem] w-full text-center sm:h-[5rem]">
        <motion.div
          key={currentStep}
          className="absolute inset-x-0 top-0 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
            <p className="text-xs font-semibold text-foreground sm:text-sm">
              {currentStepData?.title}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
              {currentStepData?.description}
            </p>
          </motion.div>
      </div>
    </div>
  );
}
