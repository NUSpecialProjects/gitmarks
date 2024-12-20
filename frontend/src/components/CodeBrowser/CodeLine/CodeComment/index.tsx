import { useContext, useRef, Dispatch, SetStateAction, useEffect } from "react";
import { FaEllipsisV, FaHistory, FaPen, FaTrash } from "react-icons/fa";

import { AuthContext } from "@/contexts/auth";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { GraderContext } from "@/contexts/grader";
import { formatDateTime, formatRelativeTime } from "@/utils/date";

import Button from "@/components/Button";

import "./styles.css";

interface ICodeComment {
  fb: IGraderFeedback;
  pending?: boolean;
  readOnly?: boolean;
}

export const CodeComment: React.FC<ICodeComment> = ({
  fb,
  pending = false,
  readOnly = false,
}) => {
  const { currentUser } = useContext(AuthContext);

  return (
    <div className="CodeComment">
      <div className="CodeComment__head">
        <div>
          <img src={currentUser?.avatar_url} alt="new" />
          <div>
            <span>{fb.ta_username}</span>
            <span className="CodeComment__date">
              {fb.history ? "updated " : "commented "}
              {formatRelativeTime(fb.created_at)}
            </span>
          </div>
          {pending && <div className="CodeComment__pendingPill">Pending</div>}
        </div>
        {!readOnly && (
          <div className="CodeComment__icons">
            {fb.history && (
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
            <div className="CodeComment__menu" tabIndex={0}>
              <FaEllipsisV />
              <div className="CodeComment__menu__dropdown">
                <li>
                  <FaPen />
                  Edit
                </li>
                <li className="CodeComment__menu__dropdown--delete">
                  <FaTrash />
                  Delete
                </li>
              </div>
            </div>
          </div>
        )}
      </div>
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
    </div>
  );
};

interface ICodeCommentForm {
  path: string;
  line: number;
  setEditing: Dispatch<SetStateAction<boolean>>;
}

export const CodeCommentForm: React.FC<ICodeCommentForm> = ({
  path,
  line,
  setEditing,
}) => {
  const { addFeedback } = useContext(GraderContext);
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { currentUser } = useContext(AuthContext);

  const form = useRef<HTMLDivElement>(null);
  const points = useRef<HTMLInputElement>(null);

  const adjustPoints = (x: number) => {
    if (!points.current) return;
    const pts = points.current.value;
    points.current.value = (parseInt(pts, 10) + x).toString();
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedClassroom) return;

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const fb: IGraderFeedback = {
      path,
      line,
      body: String(data.get("comment")).trim(),
      points: Number(data.get("points")),
      ta_username: currentUser.login,
    };
    if (fb.points == 0 && fb.body == "") return;
    if (fb.body == "") fb.body = "No comment left for this point adjustment.";
    addFeedback([fb]);
    setEditing(false);
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
    <div className="CodeComment" ref={form}>
      <form className="CodeCommentForm" onSubmit={handleAddFeedback}>
        <div className="CodeCommentForm__points">
          <label htmlFor="points">Point Adjustment</label>
          <input
            ref={points}
            id="points"
            type="number"
            name="points"
            defaultValue={0}
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

        <textarea name="comment" placeholder="Leave a comment" />
        <div className="CodeCommentForm__buttons">
          <Button
            className="CodeCommentForm__buttons--cancel"
            onClick={(e) => {
              e.preventDefault();
              setEditing(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
};
