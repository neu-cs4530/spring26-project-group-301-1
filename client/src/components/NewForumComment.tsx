import "./NewForumComment.css";
import type { ThreadInfo } from "@gamenite/shared";
import useNewCommentForm from "../hooks/useNewCommentForm.ts";

interface NewForumCommentProps {
  threadId: string;
  firstPost: boolean;
  setThread: (newThread: ThreadInfo) => void;
}

/**
 * Allows the user to post a new comment to a forum post
 */
export default function NewForumComment({ threadId, firstPost, setThread }: NewForumCommentProps) {
  const { comment, err, handleSubmit, handleInputChange } = useNewCommentForm(
    threadId,
    firstPost,
    setThread,
  );

  return (
    <form className="newForumComment" onSubmit={handleSubmit}>
      <div className="newForumComment__inputRow">
        <textarea
          className="newForumComment__input"
          placeholder={firstPost ? "Write a comment..." : "Write a comment..."}
          value={comment}
          onChange={handleInputChange}
        />
      </div>
      {err && <p className="error-message">{err}</p>}
      <div className="newForumComment__actions">
        <button className="newForumComment__submit">Post Comment</button>
      </div>
    </form>
  );
}
