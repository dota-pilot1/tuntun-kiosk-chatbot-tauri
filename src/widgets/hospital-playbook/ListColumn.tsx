import { useState, type ReactNode } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

export type ListColumnItem = {
  id: number;
  title: string;
  badge?: ReactNode;
};

/**
 * 튼튼척 노트 좌측 2개 컬럼(1차 영역 / 2차 주제)의 공통 골격.
 * 참조앱의 3단 레이아웃에서 반복되던 "헤더 + 개수 + 추가 버튼 + 항목 리스트"를 하나로 묶었다.
 */
function ListColumn({
  title,
  items,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onReorder,
  emptyLabel,
  createPlaceholder,
  disabled = false,
}: {
  title: string;
  items: ListColumnItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: (title: string) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
  emptyLabel: string;
  createPlaceholder: string;
  disabled?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);

  const submit = () => {
    const value = draft.trim();
    if (value) onCreate(value);
    setDraft("");
    setAdding(false);
  };

  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) return;
    const ids = items.map((item) => item.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ...ids.splice(from, 1));
    onReorder(ids);
    setDragId(null);
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-col rounded-lg border border-surface-border bg-surface-raised shadow-sm">
      <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-surface-border-soft px-3">
        <h2 className="flex-1 truncate text-sm font-black text-text-primary">{title}</h2>
        <span className="grid min-w-6 place-items-center rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-black text-text-muted">
          {items.length}
        </span>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          disabled={disabled}
          title={`${title} 추가`}
          className="ui-icon-button h-7 w-7 shrink-0 border-brand-border bg-brand-glass text-brand-primary disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
        {adding && (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            placeholder={createPlaceholder}
            className="ui-input"
          />
        )}

        {items.length === 0 && !adding && (
          <p className="px-1 py-6 text-center text-[13px] font-semibold text-text-muted">{emptyLabel}</p>
        )}

        {items.map((item) => {
          const isActive = item.id === selectedId;
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(item.id)}
              onClick={() => onSelect(item.id)}
              className={
                "flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-2.5 transition " +
                (isActive
                  ? "border-brand-border bg-brand-glass"
                  : "border-surface-border-soft bg-surface-muted hover:border-brand-border")
              }
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-text-muted" />
              {item.badge}
              <span
                className={
                  "min-w-0 flex-1 truncate text-sm font-black " +
                  (isActive ? "text-text-primary" : "text-text-secondary")
                }
              >
                {item.title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                title="삭제"
                className="ui-icon-button size-7 shrink-0 text-text-muted hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ListColumn;
