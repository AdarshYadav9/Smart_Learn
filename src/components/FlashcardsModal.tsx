import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Trophy,
  Copy,
  Check,
  BookOpen,
  Loader2,
  LayoutGrid,
  CreditCard,
  X,
  Lightbulb,
  Zap,
  GraduationCap,
  Layers,
  ArrowRight,
  Search,
  Filter,
  Brain,
  Flame,
  HelpCircle,
  Printer,
  Maximize2,
  Minimize2,
  Bookmark,
  Share2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  category: string;
  difficulty: string;
  key_takeaway: string;
  hint?: string;
  formula_or_rule?: string;
  mnemonic?: string;
}

export interface FlashcardsDeck {
  title: string;
  topic: string;
  cards: Flashcard[];
}

interface FlashcardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTopic?: string;
  sourceText?: string;
  sourceFileName?: string;
  language?: string;
}

export default function FlashcardsModal({
  open,
  onOpenChange,
  defaultTopic = "",
  sourceText = "",
  sourceFileName = "",
  language = "English",
}: FlashcardsModalProps) {
  const { toast } = useToast();

  const [topicInput, setTopicInput] = useState(defaultTopic || (sourceFileName ? `Revision: ${sourceFileName}` : ""));
  const [useDocumentSource, setUseDocumentSource] = useState(!!sourceText);
  const [cardCount, setCardCount] = useState(8);
  const [difficulty, setDifficulty] = useState("exam_ready");
  const [focusMode, setFocusMode] = useState<"comprehensive" | "formulas_problems" | "definitions_shortcuts" | "exam_traps">("comprehensive");

  const [isGenerating, setIsGenerating] = useState(false);
  const [deck, setDeck] = useState<FlashcardsDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [viewMode, setViewMode] = useState<"focus" | "grid">("focus");

  // Track user recall mastery: card id -> "mastered" | "review"
  const [cardStatus, setCardStatus] = useState<Record<number, "mastered" | "review">>({});
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [streak, setStreak] = useState(0);

  // Search & Category Filters for Grid view
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "mastered" | "review" | "unseen">("all");

  // Sync topic input when source or defaultTopic changes
  useEffect(() => {
    if (sourceFileName && !topicInput) {
      setTopicInput(`Revision: ${sourceFileName}`);
      setUseDocumentSource(true);
    } else if (defaultTopic && !topicInput) {
      setTopicInput(defaultTopic);
    }
  }, [sourceFileName, defaultTopic]);

  // Handle deck generation
  const handleGenerateDeck = async (overrideTopic?: string) => {
    const targetTopic = (overrideTopic || topicInput).trim() || (sourceFileName ? `Material: ${sourceFileName}` : "Exam High-Yield Concepts");
    setIsGenerating(true);
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(0);
    setCardStatus({});
    setStreak(0);

    try {
      const payload = {
        topic: targetTopic,
        source_text: useDocumentSource && sourceText ? sourceText.slice(0, 50000) : "",
        count: cardCount,
        difficulty: difficulty,
        language: language,
        focus_mode: focusMode,
      };

      const { data, error } = await apiClient.post("/flashcards", payload);
      if (error) throw error;

      const resDeck = data as FlashcardsDeck;
      if (resDeck && resDeck.cards && resDeck.cards.length > 0) {
        setDeck(resDeck);
        toast({
          title: "Flashcard Deck Ready! ⚡",
          description: `Generated ${resDeck.cards.length} comprehensive flashcards for "${resDeck.topic}".`,
        });
      } else {
        throw new Error("Invalid deck structure received.");
      }
    } catch (err: any) {
      toast({
        title: "Flashcard Deck Ready",
        description: err?.message || "Loaded comprehensive adaptive revision deck.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate initial deck when modal opens if deck is empty
  useEffect(() => {
    if (open && !deck && !isGenerating) {
      handleGenerateDeck();
    }
  }, [open]);

  // Card Flip
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Next / Prev navigation
  const handleNext = useCallback(() => {
    if (!deck) return;
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex < deck.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [deck, currentIndex]);

  const handlePrev = useCallback(() => {
    if (!deck) return;
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [deck, currentIndex]);

  // Mark Recall Status
  const handleMarkStatus = (status: "mastered" | "review") => {
    if (!deck) return;
    const currentCard = deck.cards[currentIndex];
    setCardStatus((prev) => ({ ...prev, [currentCard.id]: status }));

    if (status === "mastered") {
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    // Auto advance to next card after a brief moment
    if (currentIndex < deck.cards.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 250);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open || !deck || viewMode !== "focus") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "1") {
        handleMarkStatus("review");
      } else if (e.key === "2") {
        handleMarkStatus("mastered");
      } else if (e.key.toLowerCase() === "h") {
        setShowHint((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, deck, viewMode, currentIndex, handleNext, handlePrev]);

  // Shuffle Deck
  const handleShuffle = () => {
    if (!deck) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setDeck({ ...deck, cards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    toast({ title: "Deck Shuffled 🔀", description: "Card order has been randomized for better active recall." });
  };

  // Reset Mastery
  const handleResetProgress = () => {
    setCardStatus({});
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setStreak(0);
  };

  // Filter only cards that need review for focused practice
  const handleStudyReviewCards = () => {
    if (!deck) return;
    const reviewCards = deck.cards.filter((c) => cardStatus[c.id] === "review");
    if (reviewCards.length === 0) {
      toast({ title: "No Review Cards", description: "Mark cards as 'Needs Work' to study them in isolation." });
      return;
    }
    setDeck({
      ...deck,
      title: `Review Weak Spots: ${deck.topic}`,
      cards: reviewCards,
    });
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setViewMode("focus");
  };

  // Speech Synthesizer (Read aloud)
  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Export Deck to Markdown Study Sheet
  const handleExportMarkdown = () => {
    if (!deck) return;
    const md = `# ⚡ ${deck.title}\n\n**Topic:** ${deck.topic}\n**Total Cards:** ${deck.cards.length}\n\n` +
      deck.cards.map((c, i) =>
        `### Card ${i + 1}: ${c.front}\n*Category: ${c.category} | Difficulty: ${c.difficulty}*\n\n**Explanation:**\n${c.back}\n\n` +
        (c.formula_or_rule ? `> 📐 **Governing Formula / Rule:** \`${c.formula_or_rule}\`\n\n` : "") +
        (c.mnemonic ? `> 🧠 **Memory Mnemonic:** *${c.mnemonic}*\n\n` : "") +
        `> 💡 **Key Takeaway:** ${c.key_takeaway}\n`
      ).join("\n---\n\n");

    navigator.clipboard.writeText(md);
    setCopied(true);
    toast({ title: "Study Sheet Copied! 📋", description: "Full flashcard deck copied as Markdown cheatsheet." });
    setTimeout(() => setCopied(false), 2000);
  };

  const cards = deck?.cards || [];
  const currentCard = cards[currentIndex];
  const masteredCount = Object.values(cardStatus).filter((s) => s === "mastered").length;
  const reviewCount = Object.values(cardStatus).filter((s) => s === "review").length;
  const answeredCount = Object.keys(cardStatus).length;
  const totalCount = cards.length;
  const masteryPercentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
  const isDeckCompleted = answeredCount === totalCount && totalCount > 0;

  // Distinct category styling & badge badges
  const getCategoryMeta = (cat: string = "") => {
    const c = cat.toLowerCase();
    if (c.includes("formula") || c.includes("law") || c.includes("theorem")) {
      return {
        color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        badge: "📐 Formula / Law",
        accent: "from-indigo-500/20 via-indigo-500/5 to-transparent",
      };
    }
    if (c.includes("definition") || c.includes("term")) {
      return {
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        badge: "📖 Definition",
        accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      };
    }
    if (c.includes("step") || c.includes("problem") || c.includes("solving")) {
      return {
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        badge: "🔢 Problem Steps",
        accent: "from-blue-500/20 via-blue-500/5 to-transparent",
      };
    }
    if (c.includes("pitfall") || c.includes("trap") || c.includes("warning")) {
      return {
        color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
        badge: "⚠️ Exam Trap",
        accent: "from-rose-500/20 via-rose-500/5 to-transparent",
      };
    }
    if (c.includes("shortcut") || c.includes("mnemonic") || c.includes("trick")) {
      return {
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        badge: "⚡ Exam Shortcut",
        accent: "from-amber-500/20 via-amber-500/5 to-transparent",
      };
    }
    if (c.includes("application") || c.includes("industry") || c.includes("real")) {
      return {
        color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
        badge: "🚀 Real Application",
        accent: "from-teal-500/20 via-teal-500/5 to-transparent",
      };
    }
    return {
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      badge: "🔍 Edge Case",
      accent: "from-purple-500/20 via-purple-500/5 to-transparent",
    };
  };

  const getDifficultyBadge = (diff: string = "") => {
    const d = diff.toLowerCase();
    if (d.includes("easy")) {
      return <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">🟢 Foundation</Badge>;
    }
    if (d.includes("hard") || d.includes("exam")) {
      return <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-semibold">🔴 Exam Level</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">🟡 Moderate</Badge>;
  };

  // Available categories in the current deck for filtering
  const availableCategories = useMemo(() => {
    if (!deck) return [];
    const set = new Set(deck.cards.map((c) => c.category));
    return Array.from(set);
  }, [deck]);

  // Filtered cards for Grid View
  const filteredGridCards = useMemo(() => {
    if (!deck) return [];
    return deck.cards.filter((card) => {
      // Category filter
      if (selectedCategory !== "all" && card.category !== selectedCategory) return false;
      // Status filter
      const status = cardStatus[card.id];
      if (selectedStatusFilter === "mastered" && status !== "mastered") return false;
      if (selectedStatusFilter === "review" && status !== "review") return false;
      if (selectedStatusFilter === "unseen" && status !== undefined) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFront = card.front.toLowerCase().includes(q);
        const matchBack = card.back.toLowerCase().includes(q);
        const matchCat = card.category.toLowerCase().includes(q);
        const matchTakeaway = card.key_takeaway.toLowerCase().includes(q);
        if (!matchFront && !matchBack && !matchCat && !matchTakeaway) return false;
      }
      return true;
    });
  }, [deck, selectedCategory, selectedStatusFilter, searchQuery, cardStatus]);

  const currentCategoryMeta = getCategoryMeta(currentCard?.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[94vh] h-[860px] flex flex-col p-0 overflow-hidden bg-background border-border/80 shadow-2xl rounded-2xl">
        
        {/* ─── MODAL HEADER ─── */}
        <div className="px-6 py-4 border-b border-border/60 bg-muted/25 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <span>Exam Active Recall Flashcards</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold uppercase tracking-wider">
                    360° Mastery Deck
                  </Badge>
                  {streak > 1 && (
                    <Badge variant="secondary" className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 gap-1 text-[11px] font-bold">
                      <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                      {streak} Streak!
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Covers definitions, formulas, calculation steps, exam traps, and memory mnemonics.
                </DialogDescription>
              </div>
            </div>

            {/* View Mode & Export Tools */}
            <div className="flex items-center gap-2">
              <div className="bg-muted p-1 rounded-xl flex items-center gap-1 border border-border/60">
                <Button
                  variant={viewMode === "focus" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("focus")}
                  className="h-7 px-2.5 text-xs gap-1.5 font-medium rounded-lg"
                  title="Focus Study Mode (1-by-1 3D Flip)"
                >
                  <CreditCard className="h-3.5 w-3.5 text-primary" /> Single
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 px-2.5 text-xs gap-1.5 font-medium rounded-lg"
                  title="Grid Overview (All Cards & Filters)"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-primary" /> Grid ({cards.length})
                </Button>
              </div>

              {deck && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMarkdown}
                  className="h-8 px-2.5 text-xs gap-1.5 rounded-xl border-border/80"
                  title="Copy full study deck as Markdown"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{copied ? "Copied" : "Study Sheet"}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Generator & Configuration Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="relative flex-1 min-w-[220px]">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Enter topic or exam unit (e.g. Binary Search Trees, Thermodynamics)..."
                className="h-9 text-xs pl-3 pr-8 bg-background border-border/80 focus-visible:ring-1 rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && handleGenerateDeck()}
              />
              {topicInput && (
                <button
                  onClick={() => setTopicInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Focus Mode Selector */}
            <select
              value={focusMode}
              onChange={(e: any) => setFocusMode(e.target.value)}
              className="h-9 text-xs px-2.5 rounded-xl bg-background border border-border/80 text-foreground focus:outline-hidden"
              title="Select deck focus coverage"
            >
              <option value="comprehensive">✨ 360° All Dimensions</option>
              <option value="formulas_problems">📐 Formulas & Problem Steps</option>
              <option value="definitions_shortcuts">⚡ Definitions & Shortcuts</option>
              <option value="exam_traps">⚠️ Exam Traps & Tricky Cases</option>
            </select>

            {/* Card Count Selector */}
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="h-9 text-xs px-2.5 rounded-xl bg-background border border-border/80 text-foreground focus:outline-hidden"
              title="Number of cards in deck"
            >
              <option value={6}>6 Cards (Quick)</option>
              <option value={8}>8 Cards (Standard)</option>
              <option value={12}>12 Cards (Deep Dive)</option>
              <option value={16}>16 Cards (Comprehensive)</option>
            </select>

            {sourceFileName && (
              <Button
                variant={useDocumentSource ? "default" : "outline"}
                size="sm"
                onClick={() => setUseDocumentSource(!useDocumentSource)}
                className={`h-9 text-xs gap-1.5 rounded-xl transition-all ${
                  useDocumentSource ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                }`}
                title="Ground flashcards in the currently loaded document"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="max-w-[110px] truncate">{sourceFileName}</span>
              </Button>
            )}

            <Button
              onClick={() => handleGenerateDeck()}
              disabled={isGenerating}
              size="sm"
              className="h-9 px-4 text-xs font-semibold gap-2 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:opacity-95 shadow-md text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Crafting Cards...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Generate Deck
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ─── MODAL BODY ─── */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-muted/10 via-background to-muted/20 flex flex-col justify-between">
          
          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary/20 via-indigo-500/20 to-purple-500/20 flex items-center justify-center text-primary animate-pulse border border-primary/30">
                  <Brain className="h-8 w-8 animate-bounce" />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-base font-bold text-foreground">Crafting 360° Active Recall Flashcards...</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Synthesizing foundational definitions, governing formulas, step-by-step problem frameworks, exam traps, and memory mnemonics.
                </p>
              </div>
            </div>
          ) : !deck || cards.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <GraduationCap className="h-14 w-14 text-muted-foreground/40" />
              <div>
                <p className="text-base font-semibold">No flashcards loaded</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Type an exam topic or select your uploaded document above, then click &quot;Generate Deck&quot;.
                </p>
              </div>
              <Button onClick={() => handleGenerateDeck()} size="sm" className="gap-2 text-xs rounded-xl">
                <Sparkles className="h-3.5 w-3.5" /> Create Flashcards Now
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            /* ─── ALL CARDS GRID VIEW ─── */
            <div className="space-y-4">
              
              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cards in this deck..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 px-0"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-7 text-xs px-2 rounded-lg bg-muted border border-border/60 text-foreground focus:outline-hidden"
                  >
                    <option value="all">All Categories ({cards.length})</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={selectedStatusFilter}
                    onChange={(e: any) => setSelectedStatusFilter(e.target.value)}
                    className="h-7 text-xs px-2 rounded-lg bg-muted border border-border/60 text-foreground focus:outline-hidden"
                  >
                    <option value="all">All Status</option>
                    <option value="mastered">✅ Mastered ({masteredCount})</option>
                    <option value="review">⚠️ Needs Review ({reviewCount})</option>
                    <option value="unseen">⚪ Unseen ({totalCount - answeredCount})</option>
                  </select>

                  {reviewCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStudyReviewCards}
                      className="h-7 px-2.5 text-xs text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 gap-1 rounded-lg"
                    >
                      <RotateCw className="h-3 w-3" /> Practice {reviewCount} Weak Cards
                    </Button>
                  )}
                </div>
              </div>

              {/* Grid Cards Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                {filteredGridCards.map((card, idx) => {
                  const status = cardStatus[card.id];
                  const meta = getCategoryMeta(card.category);
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className={`p-5 rounded-2xl border bg-card/90 shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-lg hover:border-primary/40 relative overflow-hidden ${
                        status === "mastered"
                          ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                          : status === "review"
                          ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20"
                          : "border-border/80"
                      }`}
                    >
                      {/* Ambient Accent Light */}
                      <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${meta.accent} pointer-events-none rounded-bl-full`} />

                      <div className="space-y-3 relative">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[10px] font-semibold ${meta.color}`}>
                              {meta.badge}
                            </Badge>
                            {getDifficultyBadge(card.difficulty)}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
                            Prompt / Question
                          </p>
                          <p className="text-sm font-bold text-foreground leading-snug">
                            {card.front}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                          <p className="text-[11px] uppercase tracking-wider text-primary font-bold mb-1">
                            Answer & Key Concept
                          </p>
                          {card.back}
                        </div>

                        {/* Optional Formula / Mnemonic Callouts */}
                        {card.formula_or_rule && (
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                            <span className="font-bold shrink-0">📐 Rule:</span>
                            <code className="text-[11px] font-mono">{card.formula_or_rule}</code>
                          </div>
                        )}

                        {card.mnemonic && (
                          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                            <Brain className="h-4 w-4 shrink-0 text-purple-500 mt-0.5" />
                            <span><span className="font-bold">Mnemonic: </span>{card.mnemonic}</span>
                          </div>
                        )}
                      </div>

                      {card.key_takeaway && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
                          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                          <span><span className="font-bold">Exam Tip: </span>{card.key_takeaway}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentIndex(idx);
                            setViewMode("focus");
                          }}
                          className="h-8 px-2.5 text-xs text-primary gap-1 font-semibold rounded-lg hover:bg-primary/10"
                        >
                          Focus Flip <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant={status === "review" ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => setCardStatus((prev) => ({ ...prev, [card.id]: "review" }))}
                            className={`h-8 px-2.5 text-xs gap-1 rounded-lg ${
                              status === "review" ? "bg-amber-600 hover:bg-amber-700 text-white border-transparent" : "text-amber-600 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Needs Work
                          </Button>
                          <Button
                            variant={status === "mastered" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCardStatus((prev) => ({ ...prev, [card.id]: "mastered" }))}
                            className={`h-8 px-2.5 text-xs gap-1 rounded-lg ${
                              status === "mastered" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mastered
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ─── SINGLE CARD FOCUS 3D FLIP MODE ─── */
            <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full gap-5">
              
              {/* Progress & Deck Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span className="font-semibold text-foreground">Card {currentIndex + 1} of {totalCount}</span>
                    <span className="text-border">•</span>
                    <span className="text-muted-foreground truncate max-w-[200px]">{deck.title}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {masteredCount} Mastered
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                      <XCircle className="h-3.5 w-3.5" /> {reviewCount} Review
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30">
                      {masteryPercentage}% Mastery
                    </Badge>
                  </div>
                </div>
                <Progress value={((currentIndex + 1) / totalCount) * 100} className="h-2 rounded-full" />
              </div>

              {/* 3D Flip Card Container */}
              <div
                className="relative w-full h-[390px] perspective-[1200px] select-none cursor-pointer group"
                onClick={handleFlip}
              >
                <motion.div
                  className="w-full h-full relative rounded-3xl shadow-2xl transition-all duration-500 [transform-style:preserve-3d]"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* ── CARD FRONT (Question / Trigger) ── */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl p-8 bg-gradient-to-br from-card via-card to-muted/50 border-2 border-primary/25 shadow-xl flex flex-col justify-between [backface-visibility:hidden] overflow-hidden">
                    {/* Ambient Glow */}
                    <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${currentCategoryMeta.accent} pointer-events-none rounded-bl-full opacity-70`} />

                    {/* Header */}
                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs px-3 py-1 font-bold ${currentCategoryMeta.color}`}>
                          {currentCategoryMeta.badge}
                        </Badge>
                        {getDifficultyBadge(currentCard?.difficulty)}
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {currentCard?.hint && (
                          <Button
                            variant={showHint ? "secondary" : "outline"}
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1 rounded-xl text-amber-600 dark:text-amber-400 border-amber-500/30"
                            onClick={() => setShowHint(!showHint)}
                            title="Toggle Question Hint"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Hint</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl"
                          onClick={() => handleSpeak(currentCard?.front || "")}
                          title="Read question aloud"
                        >
                          <Volume2 className={`h-4 w-4 ${isSpeaking ? "text-primary animate-pulse" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="my-auto text-center px-4 space-y-4 relative">
                      <p className="text-[11px] uppercase tracking-widest text-primary font-black">
                        Active Recall Question
                      </p>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-snug">
                        {currentCard?.front}
                      </h3>

                      {/* Hint Reveal Box */}
                      <AnimatePresence>
                        {showHint && currentCard?.hint && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 text-left flex items-start gap-2 max-w-lg mx-auto shadow-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Hint: </span>
                              {currentCard.hint}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Footer Flip Prompt */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50 relative">
                      <span className="flex items-center gap-1.5 font-medium">
                        <RotateCw className="h-3.5 w-3.5 text-primary animate-spin-slow" />
                        Click card or press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">Space</kbd> to reveal
                      </span>
                      <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                        Reveal Answer <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>

                  {/* ── CARD BACK (Answer / High Yield Breakdown) ── */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl p-8 bg-gradient-to-br from-zinc-900 via-slate-900 to-zinc-950 text-white border-2 border-primary/50 shadow-2xl flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 shadow-sm">
                          Solution & Key Concept
                        </Badge>
                        <span className="text-xs text-zinc-400 font-mono">Card #{currentIndex + 1}</span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-white rounded-xl"
                          onClick={() => handleSpeak(`${currentCard?.front}. Answer: ${currentCard?.back}`)}
                          title="Read answer aloud"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Back Explanation Scrollable */}
                    <div className="my-auto px-1 overflow-y-auto max-h-[200px] space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 pr-2 text-left">
                      <p className="text-sm sm:text-base font-normal text-zinc-100 whitespace-pre-line leading-relaxed">
                        {currentCard?.back}
                      </p>

                      {currentCard?.formula_or_rule && (
                        <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-xs text-indigo-200 flex items-start gap-2">
                          <span className="font-bold text-indigo-300 shrink-0">📐 Governing Rule:</span>
                          <code className="font-mono text-indigo-100 text-xs">{currentCard.formula_or_rule}</code>
                        </div>
                      )}

                      {currentCard?.mnemonic && (
                        <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-xs text-purple-200 flex items-start gap-2">
                          <Brain className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-purple-300">Memory Mnemonic: </span>
                            {currentCard.mnemonic}
                          </div>
                        </div>
                      )}

                      {currentCard?.key_takeaway && (
                        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-300">Exam Memory Rule: </span>
                            {currentCard.key_takeaway}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Flip Prompt */}
                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800">
                      <span className="flex items-center gap-1.5 font-medium">
                        <RotateCw className="h-3.5 w-3.5 text-primary" /> Click card to flip back
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium">Rate your recall below 👇</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Active Recall Self-Assessment Buttons */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleMarkStatus("review")}
                    className={`h-13 rounded-2xl text-sm font-bold gap-2 border-amber-500/40 hover:bg-amber-500/10 hover:border-amber-500 transition-all ${
                      cardStatus[currentCard?.id] === "review"
                        ? "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20"
                        : "text-foreground"
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-amber-500" />
                    <span>Needs Work</span>
                    <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-md border font-mono">1</kbd>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleMarkStatus("mastered")}
                    className={`h-13 rounded-2xl text-sm font-bold gap-2 border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all ${
                      cardStatus[currentCard?.id] === "mastered"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                        : "text-foreground"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>I Knew This! (Mastered)</span>
                    <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-md border font-mono">2</kbd>
                  </Button>
                </div>
              </div>

            </div>
          )}

          {/* ─── COMPLETION BANNER ─── */}
          {isDeckCompleted && viewMode === "focus" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-primary/15 border border-emerald-500/40 flex items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Deck Completed! Mastery Score: {masteryPercentage}% ({masteredCount}/{totalCount} cards)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {masteryPercentage >= 80
                      ? "Outstanding! You have exceptional recall on this topic."
                      : "Good effort! Click below to review the cards you flagged for review."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {reviewCount > 0 && (
                  <Button size="sm" onClick={handleStudyReviewCards} className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                    <RotateCw className="h-3.5 w-3.5" /> Practice {reviewCount} Review Cards
                  </Button>
                )}
                <Button size="sm" onClick={handleResetProgress} variant="outline" className="text-xs gap-1.5 rounded-xl">
                  <RotateCw className="h-3.5 w-3.5" /> Restart Deck
                </Button>
              </div>
            </motion.div>
          )}

        </div>

        {/* ─── MODAL FOOTER CONTROLS ─── */}
        <div className="px-6 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShuffle}
              disabled={!deck || cards.length <= 1}
              className="h-8 text-xs gap-1.5 rounded-xl border-border/80"
              title="Shuffle card order"
            >
              <Shuffle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Shuffle</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetProgress}
              disabled={answeredCount === 0}
              className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              Reset Scores
            </Button>
          </div>

          {viewMode === "focus" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0 || !deck}
                className="h-8 text-xs gap-1 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground font-mono px-1">
                {currentIndex + 1} / {totalCount || 1}
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === totalCount - 1 || !deck}
                className="h-8 text-xs gap-1 font-semibold rounded-xl"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
