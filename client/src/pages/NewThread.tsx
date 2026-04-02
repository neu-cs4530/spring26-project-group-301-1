import useNewThreadForm from "../hooks/useNewThreadForm.ts";
import { ShieldCheck } from "lucide-react";

export default function NewThread() {
  const { title, contents, filtered, err, handleInputChange, handleSubmit } = useNewThreadForm();

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Create new post</h2>
      <div className="tightSection">
        <div className="smallAndGray">Title</div>
        <input
          className="notTooWide widefill"
          value={title}
          onChange={(e) => handleInputChange(e, "title")}
        />
      </div>
      <div className="tightSection">
        <div className="smallAndGray">Post contents</div>
        <textarea
          className="notTooWide"
          style={{ minHeight: "10rem" }}
          value={contents}
          onChange={(e) => handleInputChange(e, "contents")}
        ></textarea>
      </div>
      <div className="tightSection">
        <div className="smallAndGray">Content moderation</div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <ShieldCheck size={18} aria-hidden="true" />
          <select value={String(filtered)} onChange={(e) => handleInputChange(e, "filtered")}>
            <option value="true">Filter: On</option>
            <option value="false">Filter: Off</option>
          </select>
        </label>
        {!filtered && (
          <p className="newThread__warning">
            Warning: Turning off moderation allows profanity and unsafe content in your post and its
            comments. Are you sure you want to do this?
          </p>
        )}
      </div>
      {err && <p className="error-message">{err}</p>}
      <div>
        <button className="primary narrow">Create</button>
      </div>
    </form>
  );
}
