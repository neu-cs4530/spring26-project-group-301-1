import "./ThreadPage.css";
import { Link, useParams } from "react-router-dom";
import useThreadInfo from "../hooks/useThreadInfo.ts";
import NewForumComment from "../components/NewForumComment.tsx";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "../components/UserLink.tsx";
import useLoginContext from "../hooks/useLoginContext.ts";
import useHiddenIds from "../hooks/useHiddenIds.ts";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { useRef } from "react";
import { ParticleCard, GlobalSpotlight } from "../components/ui/MagicBento.tsx";

export default function ThreadPage() {
  const formatTimeSince = useTimeSince();
  const { threadId } = useParams();
  const { user } = useLoginContext();
  const gridRef = useRef<HTMLDivElement>(null);

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);
  const activeThreadId = threadId ?? "";
  const {
    hiddenIds: hiddenCommentIds,
    hideItem: handleHideComment,
    unhideItem: handleUnhideComment,
  } = useHiddenIds({
    storagePrefix: "hidden-forum-comments",
    entityId: activeThreadId,
  });

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
        <div className="threadPage__shell bento-section" ref={gridRef}>
          <GlobalSpotlight
            gridRef={gridRef}
            spotlightRadius={500}
            glowColor="253, 238, 101"
            showSpotlight={false}
          />
          <Link to="/forum" className="threadPage__backLink">
            {"\u2190"} Back to Forum
          </Link>

          <ParticleCard
            className="threadCard magic-bento-card magic-bento-card--border-glow"
            style={{
              ...forumBackgroundStyle,
              backgroundColor:
                forumBackgroundStyle && "backgroundImage" in forumBackgroundStyle
                  ? undefined
                  : "#000001",
            }}
            glowColor="253, 238, 101"
            particleCount={0}
            enableTilt={false}
            enableMagnetism={false}
          >
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
                <h2 className="threadCard__commentsTitle">
                  Comments
                  <span title={threadInfo.filtered ? "Filter on" : "Filter off"}>
                    {threadInfo.filtered ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                  </span>
                </h2>
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
          </ParticleCard>
        </div>
      )}
    </div>
  );
}
