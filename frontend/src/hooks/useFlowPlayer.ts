import { useState, useEffect, useCallback, useRef } from "react";
import { type FlowType, getSteps } from "@/components/passkey-flow/flowData";

export type UseFlowPlayerReturn = {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  flowType: FlowType;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setFlowType: (type: FlowType) => void;
};

export function useFlowPlayer(): UseFlowPlayerReturn {
  const [flowType, setFlowTypeState] = useState<FlowType>("registration");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = getSteps(flowType);
  const totalSteps = steps.length;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
  }, [clearTimer]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const nextStep = useCallback(() => {
    clearTimer();
    setCurrentStep((s) => (s + 1) % totalSteps);
  }, [totalSteps, clearTimer]);

  const prevStep = useCallback(() => {
    clearTimer();
    setCurrentStep((s) => (s - 1 + totalSteps) % totalSteps);
  }, [totalSteps, clearTimer]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        clearTimer();
        setCurrentStep(step);
      }
    },
    [totalSteps, clearTimer],
  );

  const setFlowType = useCallback((type: FlowType) => {
    setFlowTypeState(type);
    setCurrentStep(0);
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === totalSteps - 1;
    const hasConnection = !!currentStepData?.connection;

    // Smarter timing: connection steps are shorter (animation fills time),
    // no-connection steps slightly longer (pulse needs to be visible),
    // final step lingers
    const duration = isLastStep ? 3500 : hasConnection ? 2000 : 2200;

    timerRef.current = setTimeout(() => {
      setCurrentStep((s) => (s + 1) % totalSteps);
    }, duration);

    return () => {
      clearTimer();
    };
  }, [isPlaying, currentStep, totalSteps, clearTimer, steps]);

  return {
    currentStep,
    totalSteps,
    isPlaying,
    flowType,
    play,
    pause,
    togglePlay,
    nextStep,
    prevStep,
    goToStep,
    setFlowType,
  };
}
