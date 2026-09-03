import type { DarsRequirementNode } from "@/lib/data";

const DOT: Record<string, string> = {
  satisfied: "bg-ink",
  in_progress: "bg-gold",
  not_satisfied: "bg-maroon",
};

const STATUS_LABEL: Record<string, string> = {
  satisfied: "Satisfied",
  in_progress: "In progress",
  not_satisfied: "Not satisfied",
  informational: "Informational",
};

function Node({ node, depth }: { node: DarsRequirementNode; depth: number }) {
  const dot = DOT[node.status];
  const hasBody = node.children.length > 0 || node.courses.length > 0;

  const summary = (
    <div className="flex items-start gap-3 py-2 flex-1 min-w-0">
      {dot ? (
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dot}`} aria-hidden />
      ) : (
        <span className="w-2 h-2 shrink-0 mt-1.5" aria-hidden />
      )}
      <span
        title={node.title}
        className={`text-sm min-w-0 py-0.5 ${
          node.status === "informational"
            ? "text-ink-faint italic"
            : depth === 0
              ? "font-medium"
              : ""
        }`}
      >
        {node.title}
      </span>
      {node.status !== "informational" && (
        <span className="hidden sm:inline text-xs text-ink-faint ml-auto shrink-0 pt-1">
          {STATUS_LABEL[node.status] ?? node.status}
        </span>
      )}
      {node.section_type !== "gpa" &&
        (node.credits_required != null || node.credits_earned != null) && (
        <span className="hidden sm:inline tabular text-xs text-ink-faint shrink-0 w-20 text-right pt-1">
          {node.credits_earned ?? "—"}/{node.credits_required ?? "—"} cr
        </span>
      )}
    </div>
  );

  if (!hasBody) {
    return (
      <div style={{ paddingLeft: depth * 20 }} className="border-t border-rule first:border-t-0">
        {summary}
      </div>
    );
  }

  return (
    <details
      className="border-t border-rule first:border-t-0 group"
      style={{ paddingLeft: depth * 20 }}
    >
      <summary className="cursor-pointer list-none marker:content-none">
        {summary}
      </summary>
      <div className="pb-2">
        {node.courses.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 py-1 pl-5 text-xs text-ink-soft"
          >
            <span className="tabular font-medium w-16 sm:w-24 shrink-0">
              {c.course_code}
            </span>
            <span className="truncate flex-1" title={c.course_title ?? undefined}>
              {c.course_title}
            </span>
            <span className="hidden sm:inline text-ink-faint shrink-0">
              {c.term}
            </span>
            <span className="tabular text-ink-faint shrink-0 w-10 text-right">
              {c.grade ?? (c.is_in_progress ? "IP" : "—")}
            </span>
          </div>
        ))}
        {node.children.map((child) => (
          <Node key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
}

export function RequirementTree({ nodes }: { nodes: DarsRequirementNode[] }) {
  return (
    <div className="border border-rule rounded-lg bg-paper-raised px-4">
      {nodes.map((n) => (
        <Node key={n.id} node={n} depth={0} />
      ))}
    </div>
  );
}
