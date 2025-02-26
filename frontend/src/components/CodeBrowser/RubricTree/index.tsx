import { useContext, useState } from "react";
import SimpleBar from "simplebar-react";

import ResizablePanel from "../ResizablePanel";
import Button from "@/components/Button";
import { GraderContext } from "@/contexts/grader";

import "./styles.css";

const RubricTree: React.FC = () => {
  const { studentWork, rubric, stagedFeedback, postFeedback, isSubmittingGrade } =
    useContext(GraderContext);

  return (
    <ResizablePanel border="left">
      <div className="RubricTree__head">Rubric</div>

      <SimpleBar className="RubricTree__body scrollable">
        <div className="RubricTree__items">
          {rubric ? (
            rubric.rubric_items.map((rubricItem, i) => (
              <RubricItem key={i} {...rubricItem} />
            ))
          ) : (
            <span style={{ padding: "8px 10px" }}>
              No rubric for this assignment.
            </span>
          )}
        </div>
      </SimpleBar>
      <div className="RubricTree__foot">
        <div className="RubricTree__score">
          <span>Total Score:</span>
          {(studentWork?.manual_feedback_score ?? 0) +
            Object.values(stagedFeedback).reduce(
              (s: number, fb: IGraderFeedback) => s + fb.points,
              0
            )}
        </div>
        <Button 
          onClick={postFeedback} 
          disabled={isSubmittingGrade || Object.keys(stagedFeedback).length === 0}
        >
          {isSubmittingGrade ? "Submitting..." : "Submit Grade"}
        </Button>
      </div>
    </ResizablePanel>
  );
};

const RubricItem: React.FC<IRubricItem> = ({
  id,
  point_value,
  explanation,
}) => {
  const { selectRubricItem, deselectRubricItem } = useContext(GraderContext);

  const [selected, setSelected] = useState(false);

  return (
    <div
      className={`RubricItem${selected ? " RubricItem--selected" : ""}`}
      onClick={() => {
        if (selected) {
          deselectRubricItem(id!);
        } else {
          selectRubricItem(id!);
        }
        setSelected(!selected);
      }}
    >
      {point_value !== null && (
        <div
          // ternary: if point value is 0, give classname neutral. if < 0, negative. if > 0, positive
          className={`RubricItem__points RubricItem__points--${point_value > 0 ? "positive" : point_value < 0 ? "negative" : "neutral"}`}
        >
          {
            // ternary: if point value is 0, display "Comment" label. if < 0, leave as is. if > 0, explicitly sign with "+"
            point_value == 0
              ? "Comment"
              : point_value > 0
                ? `+${point_value}`
                : point_value
          }
        </div>
      )}

      <div className="RubricItem__explanation">{explanation}</div>
    </div>
  );
};

export default RubricTree;
