import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Code2,
  FlaskConical,
  Mail,
  Network,
  Search,
  Send,
  Sparkles,
  UserRound,
  Wrench,
  Heart,
  PhoneCall,
  Play,
  Pause,
  RotateCw,
  Copy,
  Check,
  ShieldAlert,
  Lightbulb,
  CheckSquare,
  Square,
  Compass
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const tools = [
  { id: "wellness-support", label: "Wellness support", icon: BrainCircuit, fields: ["message"] },
  { id: "coding-assessment", label: "Coding assessment", icon: Code2, fields: ["code", "tests"] },
  { id: "adaptive-test", label: "Adaptive test", icon: ClipboardList, fields: ["topic"] },
  { id: "career-guidance", label: "Career guidance", icon: UserRound, fields: ["interests", "skills", "goals"] },
  { id: "timetable", label: "Timetable", icon: CalendarDays, fields: ["courses", "days"] },
  { id: "workload", label: "Faculty workload", icon: Network, fields: ["faculty", "courses"] },
  { id: "communication-draft", label: "Communication draft", icon: Mail, fields: ["purpose", "points"] },
  { id: "literature-review", label: "Literature review", icon: BookOpen, fields: ["topic", "text"] },
  { id: "research-gaps", label: "Research gaps", icon: Search, fields: ["text"] },
  { id: "proposal", label: "Proposal writer", icon: Sparkles, fields: ["title", "context", "objectives"] },
  { id: "citation", label: "Citation generator", icon: ClipboardList, fields: ["title", "authors", "doi"] },
  { id: "debugging", label: "Debugging assistant", icon: Wrench, fields: ["code", "error"] },
  { id: "experiment-guidance", label: "Experiment guidance", icon: FlaskConical, fields: ["question", "variables"] },
] as const;

type ToolId = (typeof tools)[number]["id"];
type FormState = Record<string, string>;

const initialForm: FormState = {
  code: "",
  tests: "",
  topic: "",
  interests: "",
  skills: "",
  goals: "",
  message: "",
  courses: "",
  days: "Monday, Tuesday, Wednesday, Thursday, Friday",
  faculty: "",
  purpose: "",
  points: "",
  text: "",
  title: "",
  context: "",
  objectives: "",
  authors: "",
  doi: "",
  error: "",
  question: "",
  variables: ""
};

const WELLNESS_PRESETS = [
  { label: "😰 Overwhelmed by exam prep", text: "I am feeling overwhelmed with upcoming exams and having trouble focusing." },
  { label: "⏳ Procrastination & deadline anxiety", text: "I have multiple assignments due and feeling anxious because I am falling behind." },
  { label: "💤 Burnout & mental fatigue", text: "I've been studying for days straight and feeling completely burnt out and exhausted." },
  { label: "📉 Stress over test marks", text: "I am feeling down and discouraged about my recent academic marks." },
];

function split(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function AcademicTools() {
  const { role } = useAuth();
  const [selected, setSelected] = useState<ToolId>("wellness-support");
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<any>(null);
  const [rawView, setRawView] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const visibleTools = role === "teacher" ? tools : tools.filter((item) => item.id !== "workload" && item.id !== "communication-draft");
  const tool = visibleTools.find((item) => item.id === selected) ?? visibleTools[0];

  const mutation = useMutation({
    mutationFn: async () => {
      // Basic input validation for single-field tools
      if (selected === "wellness-support" && !form.message.trim()) {
        throw new Error("Please share a brief note or click a preset prompt below.");
      }
      if (selected === "adaptive-test" && !form.topic.trim()) {
        throw new Error("Please provide a topic for the adaptive test.");
      }

      const body: Record<string, unknown> = { ...form };
      for (const key of ["interests", "skills", "courses", "days", "faculty", "points", "objectives", "authors", "variables"]) {
        body[key] = split(form[key] || "");
      }
      if (selected === "adaptive-test") body.question_count = 5;

      const response = await apiClient.post(`/tools/${selected}`, body);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Request Notice",
        description: error.message || "Failed to process request.",
        variant: "destructive"
      });
    },
  });

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const is = (name: string) => tool.fields.includes(name as never);

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    toast({ title: "Copied", description: "Result copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <PageHeader
          title="Academic & Student Wellness Tools"
          description="Local, AI-augmented assistants for study, mental wellness, research, and coursework."
          variant="minimal"
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* ─── SIDEBAR TOOL SELECTOR ─── */}
          <Card className="h-fit shadow-sm border-border/60">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Wrench className="h-4 w-4 text-primary" /> Tool library
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 p-2.5">
              {visibleTools.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelected(id);
                    setResult(null);
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition font-medium ${
                    selected === id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                  {id === "wellness-support" && (
                    <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                      Care
                    </Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* ─── MAIN TOOL CONTENT ─── */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,1fr)]">
            
            {/* Input Form Card */}
            <Card className="shadow-sm border-border/60 flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <tool.icon className="h-4 w-4" />
                      </div>
                      {tool.label}
                    </CardTitle>
                    {selected === "wellness-support" && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                        Confidential & Safe
                      </Badge>
                    )}
                  </div>
                  {selected === "wellness-support" && (
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Feeling overwhelmed by exams, deadlines, or study pressure? Share how you are feeling to receive supportive steps and calming exercises.
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Preset quick buttons for Wellness */}
                  {selected === "wellness-support" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Quick Academic Stress Presets:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {WELLNESS_PRESETS.map((p, idx) => (
                          <Button
                            key={idx}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => update("message", p.text)}
                            className="justify-start text-left text-xs h-auto py-2 px-2.5 bg-background hover:bg-primary/5 hover:border-primary/40 border-border/70 truncate"
                          >
                            <span className="truncate">{p.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {is("topic") && <Field label="Topic" value={form.topic} onChange={(value) => update("topic", value)} placeholder="e.g. recursion or operating systems" />}
                  {is("title") && <Field label="Title" value={form.title} onChange={(value) => update("title", value)} placeholder="Working title" />}
                  {is("purpose") && <Field label="Purpose" value={form.purpose} onChange={(value) => update("purpose", value)} placeholder="Announcement, reminder, request..." />}
                  {is("question") && <Field label="Research question" value={form.question} onChange={(value) => update("question", value)} placeholder="What do you want to test?" />}
                  {is("code") && <TextField label="Code" value={form.code} onChange={(value) => update("code", value)} placeholder="Paste code or the smallest failing example" />}
                  {is("tests") && <TextField label="Tests" value={form.tests} onChange={(value) => update("tests", value)} placeholder="Paste test cases or expected behavior" />}
                  {is("error") && <TextField label="Error" value={form.error} onChange={(value) => update("error", value)} placeholder="Paste the error message and relevant context" rows={4} />}
                  {is("text") && <TextField label="Source text" value={form.text} onChange={(value) => update("text", value)} placeholder="Paste literature or research notes" rows={8} />}
                  {is("context") && <TextField label="Context" value={form.context} onChange={(value) => update("context", value)} placeholder="Problem background and motivation" rows={5} />}
                  {is("goals") && <TextField label="Goals" value={form.goals} onChange={(value) => update("goals", value)} placeholder="What would you like to explore?" rows={4} />}
                  {is("message") && (
                    <TextField
                      label="How are you feeling right now?"
                      value={form.message}
                      onChange={(value) => update("message", value)}
                      placeholder="e.g. I have 3 exams coming up this week and I feel anxious and frozen..."
                      rows={5}
                    />
                  )}
                  {is("interests") && <Field label="Interests (comma separated)" value={form.interests} onChange={(value) => update("interests", value)} placeholder="data, design, research" />}
                  {is("skills") && <Field label="Skills (comma separated)" value={form.skills} onChange={(value) => update("skills", value)} placeholder="Python, writing, teamwork" />}
                  {is("courses") && <Field label="Courses (comma separated)" value={form.courses} onChange={(value) => update("courses", value)} placeholder="Algorithms, Statistics" />}
                  {is("days") && <Field label="Available days (comma separated)" value={form.days} onChange={(value) => update("days", value)} />}
                  {is("faculty") && <Field label="Faculty (comma separated)" value={form.faculty} onChange={(value) => update("faculty", value)} placeholder="Dr. Rao, Dr. Khan" />}
                  {is("points") && <TextField label="Key points (one per line or comma separated)" value={form.points} onChange={(value) => update("points", value)} placeholder="Deadline, location, action" rows={4} />}
                  {is("objectives") && <TextField label="Objectives (comma separated)" value={form.objectives} onChange={(value) => update("objectives", value)} placeholder="Measure, compare, evaluate" rows={3} />}
                  {is("authors") && <Field label="Authors (comma separated)" value={form.authors} onChange={(value) => update("authors", value)} placeholder="Surname, A." />}
                  {is("doi") && <Field label="DOI or URL" value={form.doi} onChange={(value) => update("doi", value)} placeholder="10.xxxx/xxxxx" />}
                  {is("variables") && <Field label="Variables (comma separated)" value={form.variables} onChange={(value) => update("variables", value)} placeholder="intervention, outcome" />}
                </CardContent>
              </div>

              <div className="p-4 border-t border-border/40 bg-muted/10">
                <Button
                  className="w-full gap-2 shadow-sm font-semibold text-xs h-10 bg-primary hover:bg-primary/90"
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  {mutation.isPending ? "Analyzing & Generating..." : selected === "wellness-support" ? "Get Wellness & Study Support" : "Generate Result"}
                </Button>
              </div>
            </Card>

            {/* Result View Card */}
            <Card className="min-h-[420px] shadow-sm border-border/60 flex flex-col justify-between overflow-hidden">
              <div>
                <CardHeader className="border-b border-border/40 bg-muted/10 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <ArrowRight className="h-4 w-4 text-primary" /> Result
                  </CardTitle>
                  {result && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRawView(!rawView)}
                        className="h-7 px-2 text-xs text-muted-foreground"
                      >
                        {rawView ? "Formatted" : "JSON"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyResult}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4">
                  {mutation.isPending ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                      <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <p className="text-xs text-muted-foreground">Preparing your personalized academic guidance...</p>
                    </div>
                  ) : result ? (
                    rawView ? (
                      <pre className="max-h-[540px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-xs font-mono leading-relaxed border">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    ) : selected === "wellness-support" ? (
                      <WellnessResultView result={result} />
                    ) : (
                      <GenericResultView result={result} toolId={selected} />
                    )
                  ) : (
                    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center text-muted-foreground p-6 bg-muted/10">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Ready to generate</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          {selected === "wellness-support"
                            ? "Share how you are feeling or click a preset to receive personalized de-stressing support."
                            : "Select options or enter details on the left, then click Generate."}
                        </p>
                      </div>

                      {selected === "wellness-support" && (
                        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left max-w-sm text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                          <span>If you are in immediate distress or danger, please contact campus counseling or 24/7 crisis hotlines immediately.</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </div>

              {result && selected === "wellness-support" && result.disclaimer && (
                <div className="px-4 py-2.5 bg-muted/20 border-t border-border/40 text-[10px] text-muted-foreground text-center">
                  🛡️ {result.disclaimer}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── DEDICATED FORMATTED WELLNESS RESULT VIEW ───
function WellnessResultView({ result }: { result: any }) {
  const isCrisis = result.is_crisis_signal;
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-4">
      {/* Crisis Warning if triggered */}
      {isCrisis ? (
        <div className="p-4 rounded-xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-800 dark:text-rose-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-300">
            <ShieldAlert className="h-5 w-5" />
            <span>Immediate Crisis & Safety Support</span>
          </div>
          <p className="text-xs leading-relaxed">{result.supportive_message}</p>

          <div className="space-y-2 pt-2 border-t border-rose-500/30">
            <p className="text-xs font-semibold uppercase tracking-wider">Free 24/7 Emergency Hotlines:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(result.hotlines || [
                { name: "Tele-MANAS", number: "14416 / 1800-891-4416" },
                { name: "KIRAN Helpline", number: "1800-599-0019" },
                { name: "Emergency Services", number: "112" }
              ]).map((h: any, i: number) => (
                <div key={i} className="p-2.5 rounded-lg bg-background/80 border border-rose-500/30 text-xs flex items-center justify-between">
                  <span className="font-medium text-foreground">{h.name}:</span>
                  <a href={`tel:${h.number.split(" ")[0]}`} className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
                    <PhoneCall className="h-3 w-3" /> {h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Supportive Empathetic Message Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-teal-500/10 border border-indigo-500/20 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Heart className="h-4 w-4 fill-indigo-500/20 text-indigo-500" /> Supportive Reflection
              </span>
              <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-0">
                Mindset Reset
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {result.supportive_message}
            </p>
            {result.academic_reassurance && (
              <div className="p-2.5 rounded-lg bg-background/80 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="font-medium">{result.academic_reassurance}</span>
              </div>
            )}
          </div>

          {/* Interactive Breathing Exercise Guide */}
          <InteractiveBreathingGuide exerciseText={result.breathing_exercise} />

          {/* Actionable Micro-Steps Checklist */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-primary" /> Gentle Micro-Steps:
                </p>
                <span className="text-[10px] text-muted-foreground">Check off as you do them</span>
              </div>
              <div className="space-y-2">
                {result.suggestions.map((step: string, idx: number) => {
                  const checked = checkedItems[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(idx)}
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                        checked
                          ? "bg-emerald-500/10 border-emerald-500/30 text-muted-foreground line-through"
                          : "bg-muted/20 border-border hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      {checked ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Helplines Directory */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <PhoneCall className="h-3 w-3 text-primary" /> Free Student Support Helplines:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-background border flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">Tele-MANAS:</span>
                <span className="font-bold text-primary text-[11px]">14416 (24/7 Free)</span>
              </div>
              <div className="p-2 rounded-lg bg-background border flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">KIRAN Line:</span>
                <span className="font-bold text-primary text-[11px]">1800-599-0019</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ANIMATED INTERACTIVE 4-7-8 CALM BREATHING GUIDE ───
function InteractiveBreathingGuide({ exerciseText }: { exerciseText?: string }) {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!active) {
      setPhase("Inhale");
      setCountdown(4);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === "Inhale") {
          setPhase("Hold");
          return 7;
        } else if (phase === "Hold") {
          setPhase("Exhale");
          return 8;
        } else {
          setPhase("Inhale");
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [active, phase]);

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-primary/10 border border-teal-500/20 text-center space-y-3">
      <div className="flex items-center justify-between text-xs text-teal-700 dark:text-teal-300 font-semibold px-1">
        <span className="flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-teal-500" /> 4-7-8 Calm Breathing Circle
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActive(!active)}
          className="h-6 px-2 text-[11px] gap-1 border-teal-500/40 hover:bg-teal-500/20"
        >
          {active ? <Pause className="h-3 w-3 text-teal-600" /> : <Play className="h-3 w-3 text-teal-600" />}
          {active ? "Pause" : "Start Exercise"}
        </Button>
      </div>

      {active ? (
        <div className="py-2 flex flex-col items-center justify-center gap-2">
          <motion.div
            animate={{
              scale: phase === "Inhale" ? [1, 1.3] : phase === "Hold" ? 1.3 : [1.3, 1],
            }}
            transition={{
              duration: phase === "Inhale" ? 4 : phase === "Hold" ? 7 : 8,
              ease: "easeInOut",
            }}
            className="h-20 w-20 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex flex-col items-center justify-center text-white shadow-lg font-bold"
          >
            <span className="text-xs uppercase tracking-wider">{phase}</span>
            <span className="text-lg font-extrabold">{countdown}s</span>
          </motion.div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {phase === "Inhale"
              ? "Breathe in deeply through your nose..."
              : phase === "Hold"
              ? "Hold gently, let tension release..."
              : "Slowly exhale completely through mouth..."}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic px-2">
          {exerciseText || "4-7-8 Breathing: Inhale through nose for 4s, hold for 7s, exhale slowly through mouth for 8s."}
        </p>
      )}
    </div>
  );
}

// ─── GENERIC CLEAN RESULT VIEW FOR OTHER TOOLS ───
function GenericResultView({ result, toolId }: { result: any; toolId: string }) {
  if (typeof result !== "object" || result === null) {
    return <p className="text-xs">{String(result)}</p>;
  }

  return (
    <div className="space-y-3 text-xs">
      {Object.entries(result).map(([key, value]) => {
        const title = key.replace(/_/g, " ").toUpperCase();
        if (typeof value === "string") {
          return (
            <div key={key} className="p-3 rounded-lg bg-muted/20 border space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{title}</span>
              <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground">{value}</p>
            </div>
          );
        }
        if (Array.isArray(value)) {
          return (
            <div key={key} className="p-3 rounded-lg bg-muted/20 border space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{title} ({value.length})</span>
              <div className="space-y-1.5">
                {value.map((item, idx) => (
                  <div key={idx} className="p-2 rounded bg-background border text-xs">
                    {typeof item === "object" ? JSON.stringify(item) : String(item)}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="p-3 rounded-lg bg-muted/20 border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{title}</span>
            <pre className="text-[11px] font-mono whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium">
      <span>{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-9 text-xs" />
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, rows = 5 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium">
      <span>{label}</span>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} className="text-xs" />
    </label>
  );
}
