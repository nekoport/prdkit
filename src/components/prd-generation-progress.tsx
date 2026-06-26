"use client";

import { useEffect, useReducer, useRef } from "react";
import { CheckCircle2, Loader2, Circle, AlertCircle } from "lucide-react";

export type StepStatus = "pending" | "active" | "done" | "error";

export interface GenerationStep {
  id: string;
  label: string;
  description: string;
  durationMs: number;
}

// Total expected duration: ~85 seconds (matches actual AI generation time)
const STEPS: GenerationStep[] = [
  {
    id: "analyze",
    label: "Menganalisis ide kamu",
    description: "Memahami konteks, target user, dan masalah utama",
    durationMs: 5000,
  },
  {
    id: "context7",
    label: "Mengambil dokumentasi terkini",
    description: "Fetch library docs dari Context7 (jika terdeteksi)",
    durationMs: 4000,
  },
  {
    id: "overview",
    label: "Menyusun Overview & Requirements",
    description: "Konteks produk, tujuan utama, dan daftar requirement",
    durationMs: 9000,
  },
  {
    id: "features",
    label: "Generate Core Features & User Flow",
    description: "Fitur MVP bernomor + alur kerja langkah-demi-langkah",
    durationMs: 10000,
  },
  {
    id: "architecture",
    label: "Merancang Architecture diagram",
    description: "Diagram sequence Mermaid untuk flow utama sistem",
    durationMs: 9000,
  },
  {
    id: "database",
    label: "Mendesain Database Schema",
    description: "ERD Mermaid + struktur tabel dan relasi",
    durationMs: 9000,
  },
  {
    id: "design",
    label: "Menentukan Design Constraints",
    description: "Stack teknologi, typography, dan color palette",
    durationMs: 7000,
  },
  {
    id: "acceptance",
    label: "Menyusun Acceptance Criteria",
    description: "Format Given-When-Then untuk 5+ test case utama",
    durationMs: 8000,
  },
  {
    id: "scope",
    label: "Mendefinisikan Out-of-Scope",
    description: "Boundary eksplisit untuk mencegah AI over-engineering",
    durationMs: 6000,
  },
  {
    id: "hints",
    label: "Menyusun AI Implementation Hints",
    description: "Saran file structure + komponen + urutan implementasi",
    durationMs: 8000,
  },
  {
    id: "save",
    label: "Menyimpan PRD ke dashboard",
    description: "Persist ke database + generate summary",
    durationMs: 3000,
  },
];

interface PrdGenerationProgressProps {
  status: "running" | "done" | "error";
  errorMessage?: string;
}

// Reducer state
interface ProgressState {
  currentStepIndex: number;
  doneCount: number;
  errorStepIndex: number | null;
  finished: boolean;
}

type ProgressAction =
  | { type: "RESET" }
  | { type: "STEP_START"; index: number }
  | { type: "STEP_DONE" }
  | { type: "ALL_DONE" }
  | { type: "ERROR"; index: number }
  | { type: "FORCE_DONE" };

const initialState: ProgressState = {
  currentStepIndex: 0,
  doneCount: 0,
  errorStepIndex: null,
  finished: false,
};

function reducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case "RESET":
      return { ...initialState };
    case "STEP_START":
      return { ...state, currentStepIndex: action.index };
    case "STEP_DONE":
      return { ...state, doneCount: state.doneCount + 1 };
    case "ALL_DONE":
      return {
        ...state,
        currentStepIndex: STEPS.length,
        doneCount: STEPS.length,
        finished: true,
      };
    case "FORCE_DONE":
      return {
        currentStepIndex: STEPS.length,
        doneCount: STEPS.length,
        errorStepIndex: null,
        finished: true,
      };
    case "ERROR":
      return { ...state, errorStepIndex: action.index };
    default:
      return state;
  }
}

export function PrdGenerationProgress({
  status,
  errorMessage,
}: PrdGenerationProgressProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearAllTimers() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // Schedule timers when status transitions to "running"
  // Use a ref to track if we've already scheduled for this "running" session
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (status === "running" && !scheduledRef.current) {
      scheduledRef.current = true;
      dispatch({ type: "RESET" });
      clearAllTimers();

      let cumulativeDelay = 0;
      STEPS.forEach((step, i) => {
        // Mark as active when this step starts
        const startTimer = setTimeout(() => {
          dispatch({ type: "STEP_START", index: i });
        }, cumulativeDelay);
        timersRef.current.push(startTimer);

        cumulativeDelay += step.durationMs;

        // Mark as done when this step ends
        const endTimer = setTimeout(() => {
          dispatch({ type: "STEP_DONE" });
        }, cumulativeDelay);
        timersRef.current.push(endTimer);
      });

      // Final: all done
      const finalTimer = setTimeout(() => {
        dispatch({ type: "ALL_DONE" });
      }, cumulativeDelay);
      timersRef.current.push(finalTimer);
    } else if (status === "done") {
      clearAllTimers();
      dispatch({ type: "FORCE_DONE" });
      scheduledRef.current = false;
    } else if (status === "error") {
      clearAllTimers();
      dispatch({ type: "ERROR", index: state.currentStepIndex });
      scheduledRef.current = false;
    }
  }, [status]);

  // Build step statuses array from current state
  const stepStatuses: StepStatus[] = STEPS.map((_, i) => {
    if (status === "error" && i === state.errorStepIndex) return "error";
    if (status === "done") return "done";
    if (i < state.doneCount) return "done";
    if (i === state.currentStepIndex && status === "running") return "active";
    return "pending";
  });

  const progressPercent = status === "done"
    ? 100
    : Math.min(100, Math.round((state.doneCount / STEPS.length) * 100));

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground/80">
            {status === "error"
              ? "Generasi PRD gagal"
              : status === "done"
              ? "PRD berhasil dibuat!"
              : `Memproses... langkah ${Math.min(state.currentStepIndex + 1, STEPS.length)} dari ${STEPS.length}`}
          </span>
          <span className="font-mono text-muted-foreground">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              status === "error"
                ? "bg-destructive"
                : "bg-gradient-to-r from-accent to-accent/70"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-1.5">
        {STEPS.map((step, i) => {
          const stepStatus = stepStatuses[i];
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors ${
                stepStatus === "active"
                  ? "bg-accent/[0.04]"
                  : stepStatus === "error"
                  ? "bg-destructive/[0.04]"
                  : ""
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {stepStatus === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                ) : stepStatus === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                ) : stepStatus === "error" ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium transition-colors ${
                    stepStatus === "pending"
                      ? "text-muted-foreground/60"
                      : stepStatus === "active"
                      ? "text-foreground"
                      : stepStatus === "done"
                      ? "text-foreground/80"
                      : "text-destructive"
                  }`}
                >
                  {step.label}
                </p>
                {(stepStatus === "active" || stepStatus === "error") && (
                  <p
                    className={`mt-0.5 text-xs ${
                      stepStatus === "error" ? "text-destructive/80" : "text-muted-foreground"
                    }`}
                  >
                    {stepStatus === "error" && errorMessage
                      ? errorMessage
                      : step.description}
                  </p>
                )}
              </div>
              {stepStatus === "done" && (
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  OK
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Helper text */}
      {status === "running" && (
        <p className="text-center text-[11px] text-muted-foreground">
          AI sedang bekerja. Jangan tutup atau refresh halaman ini.
        </p>
      )}
      {status === "done" && (
        <p className="text-center text-[11px] text-accent">
          Mengarahkan ke halaman PRD...
        </p>
      )}
    </div>
  );
}

export { STEPS as GENERATION_STEPS };
