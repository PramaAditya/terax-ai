import { cn, isHtmlPath } from "@/lib/utils";
import { useSpaces } from "@/modules/spaces/lib/useSpaces";
import type { MarkdownTab, Tab } from "@/modules/tabs";
import { lazy, Suspense } from "react";

// Split so an HTML preview never pulls the markdown renderer and vice versa.
const MarkdownPreviewPane = lazy(() =>
  import("./MarkdownPreviewPane").then((m) => ({
    default: m.MarkdownPreviewPane,
  })),
);
const HtmlPreviewPane = lazy(() =>
  import("./HtmlPreviewPane").then((m) => ({ default: m.HtmlPreviewPane })),
);

type Props = {
  tabs: Tab[];
  activeId: number;
  onSetMarkdownView: (id: number, mode: "rendered" | "raw") => void;
};

/** The folder the explorer shows: the active terminal's cwd, else any terminal's. */
function workspaceRootOf(tabs: Tab[], activeId: number): string | null {
  const active = tabs.find((t) => t.id === activeId);
  if (active?.kind === "terminal" && active.cwd) return active.cwd;
  for (const t of tabs) if (t.kind === "terminal" && t.cwd) return t.cwd;
  return null;
}

export function MarkdownStack({ tabs, activeId, onSetMarkdownView }: Props) {
  const spaces = useSpaces((s) => s.spaces);
  const markdowns = tabs.filter(
    (t): t is MarkdownTab => t.kind === "markdown" && !t.cold,
  );
  if (markdowns.length === 0) return null;
  const workspaceRoot = workspaceRootOf(tabs, activeId);
  return (
    <div className="relative h-full w-full">
      {markdowns.map((t) => {
        const visible = t.id === activeId;
        const onSetView = (mode: "rendered" | "raw") =>
          onSetMarkdownView(t.id, mode);
        return (
          <div
            key={t.id}
            className={cn(
              "absolute inset-0",
              !visible && "invisible pointer-events-none",
            )}
            aria-hidden={!visible}
          >
            <Suspense fallback={null}>
              {isHtmlPath(t.path) ? (
                <HtmlPreviewPane
                  path={t.path}
                  visible={visible}
                  // The tab's own space, not the active workspace.
                  env={spaces.find((sp) => sp.id === t.spaceId)?.env}
                  onSetView={onSetView}
                />
              ) : (
                <MarkdownPreviewPane
                  path={t.path}
                  workspaceRoot={workspaceRoot}
                  visible={visible}
                  onSetView={onSetView}
                />
              )}
            </Suspense>
          </div>
        );
      })}
    </div>
  );
}
