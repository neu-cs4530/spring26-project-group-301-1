import "./NewThread.css";
import useNewThreadForm from "../hooks/useNewThreadForm.ts";
import { ShieldCheck } from "lucide-react";

export default function NewThread() {
  const { title, contents, filtered, err, handleInputChange, handleSubmit } = useNewThreadForm();

  return (
    <div className="newThreadPageShell">
      <form className="newThreadPage" onSubmit={handleSubmit}>
        <h2 className="newThreadPage__title">Create New Post</h2>
        <div className="newThreadField">
          <label className="newThreadField__label" htmlFor="new-thread-title">
            Title
          </label>
          <input
            id="new-thread-title"
            className="newThreadField__input"
            value={title}
            onChange={(e) => handleInputChange(e, "title")}
          />
        </div>
        <div className="newThreadField">
          <label className="newThreadField__label" htmlFor="new-thread-contents">
            Post contents
          </label>
          <textarea
            id="new-thread-contents"
            className="newThreadField__textarea"
            value={contents}
            onChange={(e) => handleInputChange(e, "contents")}
          ></textarea>
        </div>
        <div className="newThreadField">
          <div className="newThreadField__label">Content moderation</div>
          <label className="newThreadModeration" htmlFor="new-thread-filter">
            <ShieldCheck size={18} aria-hidden="true" />
            <select
              id="new-thread-filter"
              className="newThreadModeration__select"
              value={String(filtered)}
              onChange={(e) => handleInputChange(e, "filtered")}
            >
              <option value="true">Filter: On</option>
              <option value="false">Filter: Off</option>
            </select>
          </label>
          {!filtered && (
            <p className="newThread__warning">
              Warning: Turning off moderation allows profanity and unsafe content in your post and
              its comments. Are you sure you want to do this?
            </p>
          )}
        </div>
        {err && <p className="error-message newThreadPage__error">{err}</p>}
        <div className="newThreadPage__actions">
          <button className="newThreadPage__submit">Create</button>
        </div>
      </form>
    </div>
  );
}
