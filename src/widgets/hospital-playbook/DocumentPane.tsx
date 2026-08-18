import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bot, Loader2, Save, Trash2 } from "lucide-react";
import { playbookApi } from "../../features/hospital-playbook/api";

/**
 * 선택한 문서의 편집 영역.
 * 계획서 §14 2단계의 "초안·승인·공개 상태"와 "챗봇 지식 사용 여부"를 여기서 다룬다.
 * 승인된 문서를 고치면 서버가 승인을 자동으로 되돌리므로, 그 사실을 화면에도 알린다.
 */
function DocumentPane({
  documentId,
  onChanged,
  onDeleted,
}: {
  documentId: number;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const key = ["hospital-playbook", "document", documentId];
  const document = useQuery({ queryKey: key, queryFn: () => playbookApi.document(documentId) });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 다른 문서로 갈아탈 때만 편집 중인 내용을 서버 값으로 되돌린다.
  useEffect(() => {
    if (!document.data) return;
    setTitle(document.data.title);
    setContent(document.data.content);
  }, [document.data?.id]);

  const afterWrite = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    onChanged();
  };

  const save = useMutation({
    mutationFn: () => playbookApi.updateDocument(documentId, { title, content }),
    onSuccess: afterWrite,
  });
  const toggleChatbot = useMutation({
    mutationFn: (useForChatbot: boolean) => playbookApi.updateDocument(documentId, { useForChatbot }),
    onSuccess: afterWrite,
  });
  const approve = useMutation({
    mutationFn: () => playbookApi.approveDocument(documentId),
    onSuccess: afterWrite,
  });

  if (document.isPending) {
    return (
      <div className="mt-3 grid place-items-center rounded-lg border border-surface-border-soft bg-surface-muted py-10 text-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (document.isError || !document.data) {
    return (
      <p className="mt-3 rounded-lg border border-surface-border-soft bg-surface-muted px-4 py-6 text-center text-[13px] font-semibold text-text-muted">
        문서를 불러오지 못했습니다.
      </p>
    );
  }

  const doc = document.data;
  const dirty = title !== doc.title || content !== doc.content;
  const busy = save.isPending || approve.isPending || toggleChatbot.isPending;

  return (
    <div className="mt-3 rounded-lg border border-surface-border-soft bg-surface-muted p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-black text-text-muted">
          v{doc.version}
        </span>
        <span
          className={
            "rounded-full px-2 py-0.5 text-[10px] font-black " +
            (doc.status === "APPROVED" ? "bg-brand-glass text-brand-primary" : "bg-surface-raised text-text-muted")
          }
        >
          {doc.status === "APPROVED" ? "승인됨" : doc.status === "ARCHIVED" ? "보관" : "초안"}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleChatbot.mutate(!doc.useForChatbot)}
            disabled={busy}
            title="챗봇 지식으로 사용"
            className={
              "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-black transition-colors disabled:opacity-50 " +
              (doc.useForChatbot
                ? "border-brand-border bg-brand-glass text-brand-primary"
                : "border-surface-border bg-surface-raised text-text-muted hover:text-text-primary")
            }
          >
            <Bot className="size-3.5" />
            챗봇 사용
          </button>
          <button
            type="button"
            onClick={() => approve.mutate()}
            disabled={busy || doc.status === "APPROVED"}
            className="ui-icon-button h-8 gap-1.5 px-2.5 text-[12px] font-black disabled:opacity-40"
          >
            <BadgeCheck className="size-3.5" /> 승인
          </button>
          <button
            type="button"
            onClick={onDeleted}
            title="문서 삭제"
            className="ui-icon-button size-8 text-text-muted hover:border-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {doc.status === "APPROVED" && (
        <p className="mt-2.5 rounded-md border border-brand-border bg-brand-glass px-3 py-2 text-[12px] font-bold text-brand-primary">
          승인된 문서입니다. 내용을 고쳐 저장하면 승인이 해제되고 챗봇이 다시 사용하지 않습니다.
        </p>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="문서 제목"
        className="ui-input mt-3 font-black"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="환자 안내에 사용할 내용을 적어 주세요. 승인된 문서만 챗봇이 근거로 사용합니다."
        rows={12}
        className="mt-2 w-full resize-y rounded-md border border-surface-border bg-background p-3 text-[14px] leading-6 outline-none transition-all focus:border-brand-border focus:ring-2 focus:ring-brand-border/20"
      />

      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={!dirty || busy}
          className="ui-icon-button-brand h-9 gap-1.5 px-4 text-[13px] font-black disabled:opacity-40"
        >
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          저장
        </button>
        {dirty && <span className="text-[12px] font-bold text-text-muted">저장하지 않은 변경이 있습니다.</span>}
        {save.isError && (
          <span className="text-[12px] font-bold text-destructive">{(save.error as Error).message}</span>
        )}
      </div>
    </div>
  );
}

export default DocumentPane;
