import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenText, Bot, Check, FileText, Loader2, Plus } from "lucide-react";
import PageHeader from "../../shared/ui/PageHeader";
import ListColumn from "./ListColumn";
import DocumentPane from "./DocumentPane";
import { playbookApi, type PlaybookCategory } from "../../features/hospital-playbook/api";

const TREE_KEY = ["hospital-playbook", "tree"];

/**
 * 튼튼척 노트. 1차 영역 → 2차 주제 → 문서의 3단 구조로,
 * 참조앱(MyBatis Playbook)의 탐색 흐름을 병원 용어로 옮겼다.
 */
function HospitalPlaybookModule() {
  const queryClient = useQueryClient();
  const tree = useQuery({ queryKey: TREE_KEY, queryFn: playbookApi.tree });

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);

  const categories: PlaybookCategory[] = tree.data ?? [];
  const category = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );
  const topic = useMemo(
    () => category?.topics.find((t) => t.id === topicId) ?? null,
    [category, topicId],
  );

  // 선택이 사라진 경우(삭제 등) 첫 항목으로 되돌린다.
  useEffect(() => {
    if (categories.length === 0) {
      setCategoryId(null);
      return;
    }
    if (!categories.some((c) => c.id === categoryId)) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  useEffect(() => {
    const topics = category?.topics ?? [];
    if (topics.length === 0) {
      setTopicId(null);
      return;
    }
    if (!topics.some((t) => t.id === topicId)) setTopicId(topics[0].id);
  }, [category, topicId]);

  useEffect(() => {
    const documents = topic?.documents ?? [];
    if (documents.length === 0) {
      setDocumentId(null);
      return;
    }
    if (!documents.some((d) => d.id === documentId)) setDocumentId(documents[0].id);
  }, [topic, documentId]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: TREE_KEY });
  const onSuccess = () => void invalidate();

  // 훅은 헬퍼로 감싸지 않고 그대로 나열한다(Rules of Hooks).
  const createCategory = useMutation({ mutationFn: (t: string) => playbookApi.createCategory(t), onSuccess });
  const deleteCategory = useMutation({ mutationFn: (id: number) => playbookApi.deleteCategory(id), onSuccess });
  const reorderCategories = useMutation({ mutationFn: (ids: number[]) => playbookApi.reorderCategories(ids), onSuccess });
  const createTopic = useMutation({
    mutationFn: (v: { categoryId: number; title: string }) => playbookApi.createTopic(v.categoryId, v.title),
    onSuccess,
  });
  const deleteTopic = useMutation({ mutationFn: (id: number) => playbookApi.deleteTopic(id), onSuccess });
  const reorderTopics = useMutation({
    mutationFn: (v: { categoryId: number; ids: number[] }) => playbookApi.reorderTopics(v.categoryId, v.ids),
    onSuccess,
  });
  const createDocument = useMutation({
    mutationFn: (v: { topicId: number; title: string }) => playbookApi.createDocument(v.topicId, v.title),
    onSuccess,
  });
  const deleteDocument = useMutation({ mutationFn: (id: number) => playbookApi.deleteDocument(id), onSuccess });

  const documents = topic?.documents ?? [];

  return (
    <>
      <PageHeader>
        <BookOpenText className="size-4 text-brand-primary" />
        <span className="text-[14px] font-bold tracking-tight text-text-primary">튼튼척 노트</span>
      </PageHeader>

      <div className="min-h-0 flex-1 bg-surface-muted p-4">
        {tree.isPending ? (
          <div className="grid h-full place-items-center text-text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : tree.isError ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <p className="text-sm font-black text-text-primary">노트를 불러오지 못했습니다.</p>
              <p className="mt-1.5 text-[13px] font-semibold text-text-secondary">
                {(tree.error as Error).message}
              </p>
              <button
                type="button"
                onClick={() => void tree.refetch()}
                className="ui-icon-button-brand mx-auto mt-4 h-9 px-4 text-[13px] font-black"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : (
          <main className="grid h-full min-h-0 gap-3 lg:grid-cols-[280px_300px_minmax(0,1fr)]">
            <ListColumn
              title="1차 노트 영역"
              items={categories.map((c) => ({ id: c.id, title: c.title }))}
              selectedId={categoryId}
              onSelect={setCategoryId}
              onCreate={(title) => createCategory.mutate(title)}
              onDelete={(id) => deleteCategory.mutate(id)}
              onReorder={(ids) => reorderCategories.mutate(ids)}
              emptyLabel="아직 영역이 없습니다."
              createPlaceholder="영역 이름"
            />

            <ListColumn
              title="2차 노트 주제"
              items={(category?.topics ?? []).map((t) => ({
                id: t.id,
                title: t.title,
                badge: <FileText className="size-4 shrink-0 text-brand-primary" />,
              }))}
              selectedId={topicId}
              onSelect={setTopicId}
              onCreate={(title) => category && createTopic.mutate({ categoryId: category.id, title })}
              onDelete={(id) => deleteTopic.mutate(id)}
              onReorder={(ids) => category && reorderTopics.mutate({ categoryId: category.id, ids })}
              emptyLabel={category ? "아직 주제가 없습니다." : "먼저 영역을 선택하세요."}
              createPlaceholder="주제 이름"
              disabled={!category}
            />

            <section className="flex min-h-0 min-w-0 flex-col rounded-lg border border-surface-border bg-surface-raised shadow-sm">
              <div className="shrink-0 border-b border-surface-border-soft px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black text-brand-primary">
                      {category?.title ?? "영역 없음"} &gt; {topic?.title ?? "주제 없음"}
                    </p>
                    <h2 className="mt-0.5 truncate text-lg font-black text-text-primary">
                      {topic?.title ?? "주제를 선택하세요"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    disabled={!topic}
                    onClick={() => topic && createDocument.mutate({ topicId: topic.id, title: "새 문서" })}
                    className="ui-icon-button-brand h-9 shrink-0 gap-1.5 px-3 text-[13px] font-black disabled:opacity-40"
                  >
                    <Plus className="size-4" /> 문서 추가
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {documents.length === 0 ? (
                  <p className="px-1 py-10 text-center text-[13px] font-semibold text-text-muted">
                    {topic ? "아직 문서가 없습니다." : "먼저 주제를 선택하세요."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc, index) => {
                      const isActive = doc.id === documentId;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setDocumentId(doc.id)}
                          className={
                            "flex min-h-12 w-full items-center gap-2.5 rounded-md border px-2.5 text-left transition " +
                            (isActive
                              ? "border-brand-border bg-brand-glass"
                              : "border-surface-border-soft bg-surface-muted hover:border-brand-border")
                          }
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-surface-border-soft bg-surface-raised text-[11px] font-black text-text-muted">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-black text-text-primary">
                            {doc.title}
                          </span>
                          {doc.useForChatbot && (
                            <Bot className="size-4 shrink-0 text-brand-primary" aria-label="챗봇 지식" />
                          )}
                          <span
                            className={
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black " +
                              (doc.status === "APPROVED"
                                ? "bg-brand-glass text-brand-primary"
                                : "bg-surface-muted text-text-muted")
                            }
                          >
                            {doc.status === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1">
                                <Check className="size-3" /> 승인
                              </span>
                            ) : doc.status === "ARCHIVED" ? (
                              "보관"
                            ) : (
                              "초안"
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {documentId && (
                  <DocumentPane
                    documentId={documentId}
                    onChanged={invalidate}
                    onDeleted={() => {
                      setDocumentId(null);
                      deleteDocument.mutate(documentId);
                    }}
                  />
                )}
              </div>
            </section>
          </main>
        )}
      </div>
    </>
  );
}

export default HospitalPlaybookModule;
