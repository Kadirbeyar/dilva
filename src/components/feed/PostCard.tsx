"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import PremiumCrown from "@/components/profile/PremiumCrown";
import { withinPostEditWindow } from "@/lib/postEditWindow";

export type FeedPost = {
  id: string;
  content: string;
  createdAt: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isPremiumCached?: boolean;
  };
  language?: { code: string; name: string; nativeName: string } | null;
  _count: { likes: number; comments: number; corrections: number };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
};

const REPORT_REASONS = ["SEXUAL_CONTENT", "SPAM", "HARASSMENT", "OTHER"] as const;
const REPORT_REASON_KEY: Record<(typeof REPORT_REASONS)[number], string> = {
  SEXUAL_CONTENT: "reasonSexual",
  SPAM: "reasonSpam",
  HARASSMENT: "reasonHarassment",
  OTHER: "reasonOther",
};

export default function PostCard({
  post,
  currentUserId,
}: {
  post: FeedPost;
  currentUserId?: string | null;
}) {
  const t = useTranslations("feed");
  const tr = useTranslations("report");
  const [content, setContent] = useState(post.content);
  const [likes, setLikes] = useState(post._count.likes);
  const [liked, setLiked] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedText, setCorrectedText] = useState(post.content);
  const [note, setNote] = useState("");
  const [correctionsCount, setCorrectionsCount] = useState(post._count.corrections);
  const [submitting, setSubmitting] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Own-post edit/delete — the author only gets this for a short
  // window after posting (see lib/postEditWindow.ts). Re-checked every
  // 15s so the buttons quietly hide themselves once time's up, rather
  // than staying clickable and only then getting rejected server-side.
  const isMine = Boolean(currentUserId) && currentUserId === post.author.id;
  const [withinEditWindow, setWithinEditWindow] = useState(() => withinPostEditWindow(post.createdAt));
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Reporting someone else's post — opens a small reason picker, posts
  // to /api/posts/[id]/report, and an admin reviews it in the dashboard
  // (ReportedPostsPanel). Never shown on your own posts.
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!isMine) return;
    const id = setInterval(() => setWithinEditWindow(withinPostEditWindow(post.createdAt)), 15000);
    return () => clearInterval(id);
  }, [isMine, post.createdAt]);

  const canModify = isMine && withinEditWindow && !deleted;

  async function saveEdit() {
    if (!editDraft.trim() || savingEdit) return;
    setSavingEdit(true);
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editDraft.trim() }),
    });
    setSavingEdit(false);
    if (res.ok) {
      const data = await res.json();
      setContent(data.post.content);
      setEditDraft(data.post.content);
      setEditing(false);
    }
  }

  async function performDelete() {
    if (deleting) return;
    setDeleting(true);
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setDeleted(true);
    } else {
      setConfirmingDelete(false);
    }
  }

  if (deleted) return null;

  async function submitReport(reason: (typeof REPORT_REASONS)[number]) {
    if (reportSubmitting) return;
    setReportSubmitting(true);
    const res = await fetch(`/api/posts/${post.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details: reportDetails.trim() || undefined }),
    });
    setReportSubmitting(false);
    if (res.ok) {
      setReported(true);
      setShowReportMenu(false);
    }
  }

  async function toggleLike() {
    setLiked((v) => !v);
    setLikes((n) => (liked ? n - 1 : n + 1));
    await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
  }

  async function submitCorrection() {
    setSubmitting(true);
    const res = await fetch(`/api/posts/${post.id}/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalText: content,
        correctedText,
        note: note || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setCorrectionsCount((n) => n + 1);
      setShowCorrection(false);
    }
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      setCommentsLoading(true);
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
        setCommentsLoaded(true);
      }
      setCommentsLoading(false);
    }
  }

  async function submitComment() {
    if (!commentDraft.trim() || postingComment) return;
    setPostingComment(true);
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentDraft.trim() }),
    });
    setPostingComment(false);
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setCommentCount((n) => n + 1);
      setCommentDraft("");
      setCommentsLoaded(true);
    }
  }

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="card-shadow rounded-2xl bg-white p-4 transition-shadow hover:card-shadow-lift dark:bg-gray-800"
    >
      <Link href={`/profile/${post.author.username}` as any} className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          {post.author.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.avatarUrl} alt="" className="h-full w-full object-cover" />
          )}
          {post.author.isPremiumCached && <PremiumCrown />}
        </div>
        <div>
          <p className="font-semibold">{post.author.displayName || post.author.username}</p>
          {post.language && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{post.language.nativeName}</p>
          )}
        </div>
      </Link>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <div className="mt-1.5 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={saveEdit}
              disabled={savingEdit || !editDraft.trim()}
              className="rounded-full bg-brand-600 px-3.5 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              {t("save")}
            </motion.button>
            <button
              onClick={() => {
                setEditDraft(content);
                setEditing(false);
              }}
              className="rounded-full px-3.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap">{content}</p>
      )}

      {post.imageUrl && !editing && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="mt-3 max-h-[420px] w-full rounded-xl object-cover" />
      )}
      {post.videoUrl && !editing && (
        <video src={post.videoUrl} controls className="mt-3 max-h-[420px] w-full rounded-xl bg-black" />
      )}

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={toggleLike}
          className={liked ? "font-semibold text-brand-700 dark:text-brand-300" : ""}
        >
          {t("like")} · {likes}
        </motion.button>
        <button
          onClick={toggleComments}
          className={showComments ? "font-semibold text-brand-700 dark:text-brand-300" : ""}
        >
          {t("comment")} · {commentCount}
        </button>
        <button onClick={() => setShowCorrection((v) => !v)}>
          {t("correct")} · {correctionsCount}
        </button>

        {canModify && !editing && (
          <div className="ms-auto flex items-center gap-3 text-xs">
            <button
              onClick={() => {
                setEditDraft(content);
                setEditing(true);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t("edit")}
            </button>
            {confirmingDelete ? (
              <span className="flex items-center gap-1.5">
                <button
                  onClick={performDelete}
                  disabled={deleting}
                  className="font-semibold text-red-600 disabled:opacity-50"
                >
                  {t("confirmDelete")}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-gray-500 dark:text-gray-400"
                >
                  {t("cancel")}
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="text-gray-500 hover:text-red-600 dark:text-gray-400"
              >
                {t("delete")}
              </button>
            )}
          </div>
        )}

        {!isMine && (
          <div className="ms-auto text-xs">
            {reported ? (
              <span className="text-gray-400 dark:text-gray-500">{tr("submitted")}</span>
            ) : (
              <button
                onClick={() => setShowReportMenu((v) => !v)}
                className="text-gray-500 hover:text-red-600 dark:text-gray-400"
              >
                {tr("reportButton")}
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showReportMenu && !isMine && !reported && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
              <p className="text-sm font-medium">{tr("reportTitle")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => submitReport(reason)}
                    disabled={reportSubmitting}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
                  >
                    {tr(REPORT_REASON_KEY[reason] as any)}
                  </button>
                ))}
              </div>
              <input
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={tr("reasonOther")}
                className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
              <button
                onClick={() => setShowReportMenu(false)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                {tr("cancel")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showCorrection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
              <p className="text-sm font-medium">{t("correctionModalTitle")}</p>
              <label className="mt-2 block text-xs text-gray-500 dark:text-gray-400">{t("originalText")}</label>
              <p className="rounded-md bg-white p-2 text-sm dark:bg-gray-800">{content}</p>
              <label className="mt-2 block text-xs text-gray-500 dark:text-gray-400">{t("correctedText")}</label>
              <textarea
                value={correctedText}
                onChange={(e) => setCorrectedText(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
              <label className="mt-2 block text-xs text-gray-500 dark:text-gray-400">{t("correctionNote")}</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={submitCorrection}
                disabled={submitting}
                className="mt-2 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {t("submitCorrection")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-3 border-t border-black/5 pt-3 dark:border-white/10">
              {commentsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("noComments")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {comments.map((c) => (
                    <li key={c.id} className="flex items-start gap-2.5">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        {c.author.avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.author.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl bg-gray-100 px-3 py-2 dark:bg-gray-900">
                        <p className="text-sm">
                          <span className="font-bold">{c.author.displayName || c.author.username}</span>
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-100">{c.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-2">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder={t("commentPlaceholder")}
                  className="flex-1 rounded-full border border-gray-200 bg-transparent px-3.5 py-1.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-600 dark:bg-gray-900"
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={submitComment}
                  disabled={postingComment || !commentDraft.trim()}
                  className="shrink-0 rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
                >
                  {t("sendComment")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
