import "./ThreadPage.css";
import { Link, useParams } from "react-router-dom";
import useThreadInfo from "../hooks/useThreadInfo.ts";
import NewForumComment from "../components/NewForumComment.tsx";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "../components/UserLink.tsx";
import useLoginContext from "../hooks/useLoginContext.ts";
import { useEffect, useMemo, useState } from "react";

function readHiddenCommentIds(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

export default function ThreadPage() {
  const formatTimeSince = useTimeSince();
  const { threadId } = useParams();
  const { user } = useLoginContext();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);
  const activeThreadId = threadId ?? "";
  const hiddenStorageKey = useMemo(
    () => `hidden-forum-comments:${activeThreadId}`,
    [activeThreadId],
  );
  const [hiddenCommentIdsByThread, setHiddenCommentIdsByThread] = useState<
    Record<string, Set<string>>
  >(() => ({ [activeThreadId]: readHiddenCommentIds(hiddenStorageKey) }));
  const hiddenCommentIds = useMemo(
    () => hiddenCommentIdsByThread[activeThreadId] ?? readHiddenCommentIds(hiddenStorageKey),
    [activeThreadId, hiddenCommentIdsByThread, hiddenStorageKey],
  );

  useEffect(() => {
    if (!activeThreadId) return;

    try {
      window.localStorage.setItem(hiddenStorageKey, JSON.stringify(Array.from(hiddenCommentIds)));
    } catch {
      // Ignore storage failures and keep UI functional.
    }
  }, [activeThreadId, hiddenCommentIds, hiddenStorageKey]);

  function handleHideComment(commentId: string): void {
    if (!activeThreadId) return;

    setHiddenCommentIdsByThread((existing) => {
      const next = new Set(existing[activeThreadId] ?? hiddenCommentIds);
      next.add(commentId);
      return { ...existing, [activeThreadId]: next };
    });
  }

  function handleUnhideComment(commentId: string): void {
    if (!activeThreadId) return;

    setHiddenCommentIdsByThread((existing) => {
      const next = new Set(existing[activeThreadId] ?? hiddenCommentIds);
      next.delete(commentId);
      return { ...existing, [activeThreadId]: next };
    });
  }

  // Only apply background if the current user is the author
  let forumBackgroundStyle = {};
  if (!("message" in threadInfo)) {
    const customBackground = (user.customBackground || "").trim();
    if (customBackground) {
      const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(customBackground);
      if (isHex) {
        forumBackgroundStyle = { backgroundColor: customBackground };
      } else {
        forumBackgroundStyle = {
          backgroundImage: `url("${customBackground}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        };
      }
    }
  }

  return (
    <div className="content threadPage">
      {"message" in threadInfo ? (
        threadInfo.message
      ) : (
        <div className="threadPage__shell">
          <Link to="/forum" className="threadPage__backLink">
            {"\u2190"} Back to Forum
          </Link>

          <section className="threadCard" style={forumBackgroundStyle}>
            <div className="threadCard__body">
              <div className="threadCard__opCard">
                <div className="threadCard__opHeader">
                  <div className="threadCard__opByline">
                    <div className="threadCard__author">
                      {threadInfo.createdBy.username === user.username ? (
                        "You"
                      ) : (
                        <UserLink user={threadInfo.createdBy} />
                      )}
                    </div>
                    <div className="threadCard__meta">
                      Posted {formatTimeSince(threadInfo.createdAt)}
                    </div>
                  </div>
                </div>
                <h2 className="threadCard__title">{threadInfo.title}</h2>
                <p className="threadCard__text">{threadInfo.text}</p>
              </div>

              <div className="threadCard__commentsHeader">
                <h3 className="threadCard__commentsTitle">Comments</h3>
                <div className="threadCard__commentCount">
                  {threadInfo.comments.length}{" "}
                  {threadInfo.comments.length === 1 ? "Comment" : "Comments"}
                </div>
              </div>

              <div className="threadCard__comments" role="list">
                {threadInfo.comments.length === 0 ? (
                  <div className="threadCard__emptyComments">Be the first to comment!</div>
                ) : (
                  threadInfo.comments.map(({ commentId, text, createdBy, createdAt, editedAt }) => {
                    const isHidden = hiddenCommentIds.has(commentId);

                    return (
                      <div className="threadCard__comment" role="listitem" key={commentId}>
                        <div className="threadCard__commentHeader">
                          <div className="threadCard__commentAuthor">
                            {createdBy.username === user.username ? (
                              "You"
                            ) : (
                              <UserLink user={createdBy} />
                            )}
                            {createdBy.username === threadInfo.createdBy.username && (
                              <span className="opBlue"> OP</span>
                            )}
                          </div>
                          <div className="threadCard__commentTime">
                            {formatTimeSince(createdAt)}
                            {editedAt && ` (edited ${formatTimeSince(editedAt)})`}
                          </div>
                        </div>
                        {isHidden ? (
                          <>
                            <div className="threadCard__commentText threadCard__commentHidden">
                              Comment hidden
                            </div>
                            <button
                              type="button"
                              className="threadCard__commentAction"
                              onClick={() => handleUnhideComment(commentId)}
                            >
                              Unhide
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="threadCard__commentText">{text}</div>
                            <button
                              type="button"
                              className="threadCard__commentAction"
                              onClick={() => handleHideComment(commentId)}
                            >
                              Hide
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <NewForumComment
                firstPost={threadInfo.comments.length === 0}
                threadId={threadInfo.threadId.toString()}
                setThread={setThread}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
