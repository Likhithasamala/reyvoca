import { BrainCircuit, ListChecks, MessagesSquare, Sparkles } from "lucide-react";
import { Notice } from "@/components/panel/notice";
import { PageHeader } from "@/components/panel/page-header";
import { SectionCard } from "@/components/panel/section-card";

export const metadata = { title: "Train Agent" };

/**
 * "Training" here means improving an agent from its own conversations —
 * instructions, knowledge and responses. No model training is involved.
 */
const areas = [
  {
    icon: ListChecks,
    title: "Needs Review",
    description: "Conversations where the agent struggled, ended early or misread the caller.",
    empty: "Nothing to review yet — this fills up once your agents start taking calls.",
  },
  {
    icon: Sparkles,
    title: "Knowledge Gaps",
    description: "Questions callers asked that the agent could not answer from your knowledge.",
    empty: "No gaps found yet. Questions the agent cannot answer will be collected here.",
  },
  {
    icon: BrainCircuit,
    title: "Instruction Improvements",
    description: "Suggested wording changes for the agent's instructions, based on real calls.",
    empty: "No suggestions yet. These appear after a handful of conversations.",
  },
  {
    icon: MessagesSquare,
    title: "Conversation Feedback",
    description: "Notes you and your team leave on individual conversations.",
    empty: "No feedback yet. You'll be able to flag a conversation and leave a note.",
  },
];

export default function TrainAgentPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Train Agent"
        description="Improve your agents using their own conversations — review what went wrong, close knowledge gaps and sharpen instructions."
      />

      <Notice title="What training means here.">
        Reyvoca does not train a language model. Training an agent means reviewing its conversations, correcting
        mistakes, adding knowledge it was missing and improving its instructions.
      </Notice>

      <div className="grid gap-4 sm:grid-cols-2">
        {areas.map((area) => (
          <SectionCard key={area.title} title={area.title} description={area.description}>
            <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-line-strong px-3.5 py-3">
              <area.icon className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
              <p className="text-xs leading-relaxed text-ink-muted text-pretty">{area.empty}</p>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
