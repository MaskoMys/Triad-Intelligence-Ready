import { useEffect, useMemo, useState } from "react";
import {
  questions,
  scoreAssessment,
  type AssessmentResult,
  type BetaFeedback,
  type ResponseMap,
} from "@/domain/assessment";
import { AppHeader } from "@/components/layout/AppHeader";
import { LandingPage } from "@/components/LandingPage";
import { AssessmentWizard } from "@/components/AssessmentWizard";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import {
  clearAssessmentHistory,
  createHistoryExport,
  deleteAssessmentResult,
  loadAssessmentHistory,
  saveAssessmentHistory,
} from "@/lib/storage";
import { clearBetaEvents, trackBetaEvent } from "@/lib/telemetry";
import { downloadTextFile } from "@/lib/download";

type AppView = "landing" | "assessment" | "results";

export default function App() {
  const [view, setView] = useState<AppView>("landing");
  const [landingTab, setLandingTab] = useState<"assess" | "history">("assess");
  const [userName, setUserName] = useState("");
  const [rememberResult, setRememberResult] = useState(true);
  const [history, setHistory] = useState<AssessmentResult[]>(loadAssessmentHistory);
  const [activeResult, setActiveResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    trackBetaEvent("landing_viewed");
  }, []);

  const activeSavedLocally = useMemo(
    () => Boolean(activeResult && history.some((entry) => entry.id === activeResult.id)),
    [activeResult, history],
  );

  const showHome = () => {
    setView("landing");
    setLandingTab("assess");
  };

  const showHistory = () => {
    setView("landing");
    setLandingTab("history");
  };

  const startAssessment = (name: string, shouldRemember: boolean) => {
    setUserName(name);
    setRememberResult(shouldRemember);
    setView("assessment");
    trackBetaEvent("assessment_started");
  };

  const completeAssessment = (responses: ResponseMap) => {
    const scored = scoreAssessment(responses);
    const result: AssessmentResult = {
      schemaVersion: 1,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userName,
      ...scored,
    };

    setActiveResult(result);
    setView("results");
    trackBetaEvent("assessment_completed");
    trackBetaEvent("results_viewed");

    if (rememberResult) {
      const updated = [result, ...history.filter((entry) => entry.id !== result.id)];
      setHistory(updated);
      saveAssessmentHistory(updated);
    }
  };

  const loadDemo = () => {
    const responses = Object.fromEntries(
      questions.map((question) => [question.id, (question.id * 3 + 1) % question.options.length]),
    );
    const scored = scoreAssessment(responses);
    const demo: AssessmentResult = {
      schemaVersion: 1,
      id: "triad-demo-result",
      timestamp: new Date().toISOString(),
      userName: "Demo explorer",
      ...scored,
    };
    setActiveResult(demo);
    setView("results");
    trackBetaEvent("results_viewed");
  };

  const selectHistorical = (result: AssessmentResult) => {
    setActiveResult(result);
    setUserName(result.userName);
    setView("results");
    trackBetaEvent("results_viewed");
  };

  const removeHistorical = (id: string) => {
    const updated = deleteAssessmentResult(id);
    setHistory(updated);
    if (activeResult?.id === id) setActiveResult(null);
  };

  const clearHistory = () => {
    if (!window.confirm("Delete all locally saved Tri-Ad results and local beta event counts?"))
      return;
    clearAssessmentHistory();
    clearBetaEvents();
    setHistory([]);
    setActiveResult(null);
  };

  const exportHistory = () => {
    downloadTextFile(
      `triad-history-${new Date().toISOString().slice(0, 10)}.json`,
      createHistoryExport(history),
      "application/json;charset=utf-8",
    );
    trackBetaEvent("history_exported");
  };

  const updateFeedback = (feedback: BetaFeedback) => {
    if (!activeResult) return;
    const updatedResult: AssessmentResult = { ...activeResult, feedback };
    setActiveResult(updatedResult);
    trackBetaEvent("feedback_saved");

    if (history.some((entry) => entry.id === updatedResult.id)) {
      const updatedHistory = history.map((entry) =>
        entry.id === updatedResult.id ? updatedResult : entry,
      );
      setHistory(updatedHistory);
      saveAssessmentHistory(updatedHistory);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <AppHeader
        activeView={view}
        hasResult={Boolean(activeResult)}
        onHome={showHome}
        onHistory={showHistory}
        onResult={() => activeResult && setView("results")}
        onDemo={loadDemo}
      />

      {view === "landing" ? (
        <LandingPage
          history={history}
          tab={landingTab}
          onTabChange={setLandingTab}
          onStart={startAssessment}
          onSelectHistory={selectHistorical}
          onDeleteHistory={removeHistorical}
          onClearHistory={clearHistory}
          onExportHistory={exportHistory}
        />
      ) : null}

      {view === "assessment" ? (
        <AssessmentWizard userName={userName} onComplete={completeAssessment} onAbort={showHome} />
      ) : null}

      {view === "results" && activeResult ? (
        <ResultsDashboard
          result={activeResult}
          savedLocally={activeSavedLocally}
          onRetake={showHome}
          onViewHistory={showHistory}
          onUpdateFeedback={updateFeedback}
        />
      ) : null}

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs leading-relaxed text-slate-500">
        Tri-Ad private beta · Local-first reflective assessment · Version 1.0.0-beta.1
      </footer>
    </div>
  );
}
