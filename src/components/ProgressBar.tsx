import { useEffect, useState } from "react";

const stages = [
  { id: 1, label: "Analyzing input", duration: 2000 },
  { id: 2, label: "Generating concepts", duration: 3000 },
  { id: 3, label: "Refining design", duration: 2000 },
  { id: 4, label: "Finalizing", duration: 1000 },
];

interface ProgressBarProps {
  onComplete: () => void;
}

const ProgressBar = ({ onComplete }: ProgressBarProps) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStage >= stages.length) {
      onComplete();
      return;
    }

    const stage = stages[currentStage];
    const interval = 50;
    const increment = 100 / (stage.duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentStage((s) => s + 1);
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStage, onComplete]);

  const overallProgress = ((currentStage * 100 + progress) / stages.length);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="max-w-2xl w-full mx-6">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-bold">
              {currentStage < stages.length
                ? stages[currentStage].label
                : "Complete"}
            </h2>
            <div className="h-2 bg-muted rounded-none overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round(overallProgress)}% complete
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className={`text-sm ${
                  index < currentStage
                    ? "text-foreground"
                    : index === currentStage
                    ? "text-accent font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
