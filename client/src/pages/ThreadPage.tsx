import "./ThreadPage.css";
import { Link, useParams } from "react-router-dom";
import useThreadInfo from "../hooks/useThreadInfo.ts";
import NewForumComment from "../components/NewForumComment.tsx";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "../components/UserLink.tsx";
import useLoginContext from "../hooks/useLoginContext.ts";
import { ShieldCheck, ShieldOff } from "lucide-react";

export default function ThreadPage() {
  const formatTimeSince = useTimeSince();
  const { threadId } = useParams();
  const { user } = useLoginContext();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);

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
                  threadInfo.comments.map(({ commentId, text, createdBy, createdAt, editedAt }) => (
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
                      <div className="threadCard__commentText">{text}</div>
                    </div>
                  ))
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
