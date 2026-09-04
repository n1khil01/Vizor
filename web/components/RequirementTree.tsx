import type { DarsRequirementNode } from "@/lib/data";
import { StateDot, StateTag, darsState } from "@/components/StateDot";

/**
 * The DARS tree reads from the same three-state grammar as tickets — a
 * requirement's status and a ticket's status are the same kind of fact, so
 * they get the same mark and the same words. Status is never colour alone:
 * every row carries its label at the sm breakpoint and up, and a
 * screen-reader-only label below it.
 */
function Node({ node, depth }: { node: DarsRequirementNode; depth: number }) {
  const state = darsState(node.status);
  const hasBody = node.children.length > 0 || node.courses.length > 0;
  const showCredits =
    node.section_type !== "gpa" &&
    (node.credits_required != null || node.credits_earned != null);

  const summary = (
    <div className="flex items-start gap-2.5 py-1.5 flex-1 min-w-0">
      <span className="mt-1.5 w-2 shrink-0">
        {state && <StateDot state={state} size="sm" />}
      </span>
      <span
        title={node.title}
        className={`text-sm min-w-0 leading-snug ${
          state === null
            ? "text-ink-faint italic"
            : depth === 0
              ? "font-medium"
              : ""
        }`}
      >
        {node.title}
      </span>
      {state && (
        <>
          <StateTag
            state={state}
            vocabulary="dars"
            className="hidden sm:inline-flex ml-auto shrink-0 pt-0.5"
          />
          {/* Narrow viewports drop the visible tag; keep the meaning. */}
          <span className="sr-only sm:hidden">
            {node.status.replace(/_/g, " ")}
          </span>
        </>
      )}
      {showCredits && (
        <span
          className={`hidden md:inline tabular text-xs text-ink-faint shrink-0 w-20 text-right pt-0.5 ${
            state ? "" : "ml-auto"
          }`}
        >
          {node.credits_earned ?? "—"}/{node.credits_required ?? "—"} cr
        </span>
      )}
    </div>
  );

  if (!hasBody) {
    return (
      <div
        style={{ paddingLeft: depth * 18 }}
        className="border-t border-rule first:border-t-0"
      >
        {summary}
      </div>
    );
  }

  return (
    <details
      className="border-t border-rule first:border-t-0"
      style={{ paddingLeft: depth * 18 }}
    >
      <summary className="cursor-pointer list-none marker:content-none rounded-sm transition-colors duration-150 ease-out hover:bg-rule/25">
        {summary}
      </summary>
      <div className="pb-1.5">
        {node.courses.length > 0 && (
          <table className="w-full text-xs">
            <caption className="sr-only">
              Courses applied to {node.title}
            </caption>
            <tbody>
              {node.courses.map((c) => (
                <tr key={c.id} className="text-ink-soft">
                  <td className="tabular font-medium py-0.5 pl-5 w-16 sm:w-24 align-top">
                    {c.course_code}
                  </td>
                  <td
                    className="py-0.5 pr-2 truncate max-w-0 w-full align-top"
                    title={c.course_title ?? undefined}
                  >
                    {c.course_title}
                  </td>
                  <td className="hidden sm:table-cell py-0.5 text-ink-faint whitespace-nowrap align-top">
                    {c.term}
                  </td>
                  <td className="tabular py-0.5 text-ink-faint w-10 text-right align-top">
                    {c.grade ?? (c.is_in_progress ? "IP" : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {node.children.map((child) => (
          <Node key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
}

export function RequirementTree({ nodes }: { nodes: DarsRequirementNode[] }) {
  if (nodes.length === 0) {
    return (
      <p className="border border-dashed border-rule-strong rounded-lg px-4 py-8 text-center text-sm text-ink-soft">
        This audit has no requirement rows on file.
      </p>
    );
  }
  return (
    <div className="border border-rule rounded-lg bg-paper-raised px-4">
      {nodes.map((n) => (
        <Node key={n.id} node={n} depth={0} />
      ))}
    </div>
  );
}
