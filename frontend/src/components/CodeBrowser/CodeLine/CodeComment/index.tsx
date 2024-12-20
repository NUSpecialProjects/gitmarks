import { useContext, useRef, useEffect, useState } from "react";
import {
  FaEllipsisV,
  FaHistory,
  FaPen,
  FaTrashAlt,
  FaTrashRestoreAlt,
} from "react-icons/fa";

import { AuthContext } from "@/contexts/auth";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { GraderContext } from "@/contexts/grader";
import { formatDateTime, formatRelativeTime } from "@/utils/date";

import Button from "@/components/Button";

import "./styles.css";

interface ICodeComment {
  fb: IGraderFeedbackWithHistory;
  pending?: boolean;
  readOnly?: boolean;
  localFeedbackID?: number;
}

export const CodeComment: React.FC<ICodeComment> = ({
  fb,
  pending = false,
  readOnly = false,
  localFeedbackID,
}) => {
  const { editFeedback, discardEditFeedback, discardAddFeedback } =
    useContext(GraderContext);
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="CodeComment">
        <div className="CodeComment__head">
          <div>
            <img src={`https://github.com/${fb.ta_username}.png`} alt="new" />
            <div>
              <span>{fb.ta_username}</span>
              <span className="CodeComment__date">
                {fb.action == "DELETE" || fb.deleted
                  ? "deleted "
                  : fb.history
                    ? "updated "
                    : "commented "}
                {formatRelativeTime(
                  pending || fb.action ? new Date() : fb.created_at
                )}
              </span>
            </div>
            {(pending || fb.action) && (
              <div className="CodeComment__pendingPill">Pending</div>
            )}
          </div>
          {!readOnly && (
            <div className="CodeComment__icons">
              {fb.history && fb.history.length > 0 && (
                <div className="CodeComment__menu" tabIndex={0}>
                  <FaHistory />
                  <div className="CodeComment__menu__dropdown">
                    {fb.history.map((entry, i) => {
                      return (
                        entry.created_at && (
                          <li
                            key={i}
                            className="CodeComment__history"
                            tabIndex={0}
                          >
                            {formatDateTime(entry.created_at)}
                            <div className="CodeComment__history__details">
                              <CodeComment fb={entry} readOnly />
                            </div>
                          </li>
                        )
                      );
                    })}
                  </div>
                </div>
              )}
              {!fb.deleted && (
                <div className="CodeComment__menu" tabIndex={0}>
                  <FaEllipsisV />
                  <div className="CodeComment__menu__dropdown">
                    {fb.action != "DELETE" && (
                      <li
                        onClick={() => {
                          (document.activeElement as HTMLElement).blur();
                          setEditing(!editing);
                        }}
                      >
                        <FaPen />
                        Edit
                      </li>
                    )}
                    <li
                      className={`CodeComment__menu__dropdown--delete${fb.action == "DELETE" ? "d" : ""}`}
                      onClick={() => {
                        if (typeof localFeedbackID !== "undefined") {
                          if (fb.action == "EDIT" || fb.action == "DELETE") {
                            // must be an edit to existing feedback, rollback edit
                            discardEditFeedback(localFeedbackID);
                          } else if (fb.action == "CREATE") {
                            // must not be existing, just staged, delete staged comment
                            (document.activeElement as HTMLElement).blur();
                            discardAddFeedback(localFeedbackID);
                          } else if (!fb.action) {
                            // must be existing, fully delete
                            (document.activeElement as HTMLElement).blur();
                            editFeedback("DELETE", localFeedbackID);
                          }
                        }
                      }}
                    >
                      {(() => {
                        switch (fb.action) {
                          case "EDIT":
                            return (
                              <>
                                <FaTrashAlt /> Discard Changes
                              </>
                            );
                          case "DELETE":
                            return (
                              <>
                                <FaTrashRestoreAlt /> Restore
                              </>
                            );
                          default:
                            return (
                              <>
                                <FaTrashAlt /> Delete
                              </>
                            );
                        }
                      })()}
                    </li>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {editing ? (
          <CodeCommentForm
            path={fb.path}
            line={fb.line}
            content={{ localFeedbackID, fb, pending, readOnly }}
            // pass content through so we can edit the existing meta data
            onCancel={() => setEditing(false)}
          />
        ) : (
          fb.action != "DELETE" &&
          !fb.deleted && (
            <div className="CodeComment__body">
              <div
                className={`CodeComment__points CodeComment__points--${fb.points > 0 ? "positive" : fb.points < 0 ? "negative" : "neutral"}`}
              >
                {fb.points == 0
                  ? "Comment"
                  : fb.points > 0
                    ? `+${fb.points}`
                    : fb.points}
              </div>
              {fb.body}
            </div>
          )
        )}
      </div>
    </>
  );
};

interface ICodeCommentForm {
  path: string;
  line: number;
  // if content exists, that is an indication that we are editing
  content?: ICodeComment;
  onCancel: () => void;
}

export const CodeCommentForm: React.FC<ICodeCommentForm> = ({
  path,
  line,
  content,
  onCancel,
}) => {
  const { addFeedback, editFeedback } = useContext(GraderContext);
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { currentUser } = useContext(AuthContext);

  const form = useRef<HTMLFormElement>(null);
  const points = useRef<HTMLInputElement>(null);

  const adjustPoints = (x: number) => {
    if (!points.current) return;
    const pts = points.current.value;
    points.current.value = (parseInt(pts, 10) + x).toString();
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedClassroom) return;

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const fb: IGraderFeedbackWithHistory = {
      ...content?.fb,
      path,
      line,
      body: String(data.get("comment")).trim(),
      points: Number(data.get("points")),
      ta_username: currentUser.login,
      deleted: false,
    };

    if (fb.points == 0 && fb.body == "") return;
    if (fb.body == "") fb.body = "No comment left for this point adjustment.";

    // if content already exists, edit instead of create
    if (content && typeof content.localFeedbackID !== "undefined") {
      editFeedback("EDIT", content.localFeedbackID, fb);
    } else {
      addFeedback([fb]);
    }
    onCancel();
    form.reset();
  };

  useEffect(() => {
    if (form.current) {
      const rect = form.current.getBoundingClientRect();
      const isVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth);

      if (!isVisible) {
        form.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  return (
    <form
      className="CodeCommentForm"
      onSubmit={handleSubmitFeedback}
      ref={form}
    >
      <div className="CodeCommentForm__points">
        <input
          id="action"
          type="text"
          name="action"
          defaultValue={"CREATE"}
          hidden
          disabled
          readOnly
        />
        <label htmlFor="points">Point Adjustment</label>
        <input
          ref={points}
          id="points"
          type="number"
          name="points"
          defaultValue={content?.fb.points ?? 0}
        />
        <div className="CodeCommentForm__points__spinners">
          <div
            tabIndex={0}
            onClick={() => {
              adjustPoints(1);
            }}
          >
            +
          </div>
          <div
            tabIndex={0}
            onClick={() => {
              adjustPoints(-1);
            }}
          >
            -
          </div>
        </div>
      </div>

      <textarea
        name="comment"
        placeholder="Leave a comment"
        defaultValue={content?.fb.body}
      />
      <div className="CodeCommentForm__buttons">
        <Button
          className="CodeCommentForm__buttons--cancel"
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
        >
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};
