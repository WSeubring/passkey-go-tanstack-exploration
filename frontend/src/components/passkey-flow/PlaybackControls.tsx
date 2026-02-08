import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";

type PlaybackControlsProps = {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function PlaybackControls({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={onPrev}
        aria-label="Previous step"
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button
        variant={isPlaying ? "default" : "ghost"}
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isPlaying ? (
            <motion.div
              key="pause"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Pause className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Play className="ml-0.5 h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={onNext}
        aria-label="Next step"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
}
