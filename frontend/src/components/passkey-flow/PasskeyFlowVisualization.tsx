import { motion, AnimatePresence } from "framer-motion";
import { useFlowPlayer } from "@/hooks/useFlowPlayer";
import { getSteps } from "./flowData";
import { FlowDiagram } from "./FlowDiagram";
import { StepProgressBar } from "./StepProgressBar";
import { PlaybackControls } from "./PlaybackControls";
import { FlowToggle } from "./FlowToggle";

export function PasskeyFlowVisualization() {
  const {
    currentStep,
    isPlaying,
    flowType,
    togglePlay,
    nextStep,
    prevStep,
    goToStep,
    setFlowType,
  } = useFlowPlayer();

  const steps = getSteps(flowType);
  const step = steps[currentStep];

  if (!step) return null;

  return (
    <motion.div
      className="flex w-full max-w-2xl flex-col items-center gap-3 sm:gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          How Passkeys Work
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          A visual guide to passwordless authentication
        </p>
      </div>

      {/* Flow type toggle */}
      <FlowToggle flowType={flowType} onToggle={setFlowType} />

      {/* Diagram — animate on flow type switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={flowType}
          className="w-full"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25 }}
        >
          <FlowDiagram step={step} />
        </motion.div>
      </AnimatePresence>

      {/* Step progress — animate on flow type switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`progress-${flowType}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <StepProgressBar
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
          />
        </motion.div>
      </AnimatePresence>

      {/* Playback controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNext={nextStep}
        onPrev={prevStep}
      />
    </motion.div>
  );
}
