import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { SelectedClassroomContext } from "./selectedClassroom";
import { getPaginatedStudentWork } from "@/api/student_works";
import { getAssignment } from "@/api/assignments";
import { gradeWork } from "@/api/grader";
import { getAssignmentRubric } from "@/api/assignments";

interface IGraderContext {
  assignment: IAssignmentOutline | null;
  studentWork: IPaginatedStudentWork | null;
  selectedFile: IFileTreeNode | null;
  feedback: IGraderFeedbackMap;
  stagedFeedback: IGraderFeedbackMap;
  rubric: IFullRubric | null;
  selectedRubricItems: number[];
  setSelectedFile: React.Dispatch<React.SetStateAction<IFileTreeNode | null>>;
  addFeedback: (feedback: IGraderFeedback[]) => void;
  editFeedback: (feedbackID: number, feedback: IGraderFeedback) => void;
  discardAddFeedback: (feedbackID: number) => void;
  discardEditFeedback: (feedbackID: number) => void;
  removeFeedback: (feedbackID: number) => void;
  postFeedback: () => void;
  selectRubricItem: (riID: number) => void;
  deselectRubricItem: (riID: number) => void;
}

export const GraderContext: React.Context<IGraderContext> =
  createContext<IGraderContext>({
    assignment: null,
    studentWork: null,
    selectedFile: null,
    feedback: {},
    stagedFeedback: {},
    rubric: null,
    selectedRubricItems: [],
    setSelectedFile: () => {},
    addFeedback: () => 0,
    editFeedback: () => {},
    discardAddFeedback: () => {},
    discardEditFeedback: () => {},
    removeFeedback: () => {},
    postFeedback: () => {},
    selectRubricItem: () => {},
    deselectRubricItem: () => {},
  });

export const GraderProvider: React.FC<{
  assignmentID: string | undefined;
  studentWorkID: string | undefined;
  children: React.ReactNode;
}> = ({ assignmentID, studentWorkID, children }) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);

  const nextFeedbackID = useRef(0);
  const [feedback, setFeedback] = useState<IGraderFeedbackMap>({});
  const [stagedFeedback, setStagedFeedback] = useState<IGraderFeedbackMap>({});
  const [assignment, setAssignment] = useState<IAssignmentOutline | null>(null);
  const [studentWork, setStudentWork] = useState<IPaginatedStudentWork | null>(
    null
  );
  const [selectedRubricItems, setSelectedRubricItems] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<IFileTreeNode | null>(null);
  const [rubric, setRubric] = useState<IFullRubric | null>(null);

  const navigate = useNavigate();

  // fetch requested assignment
  useEffect(() => {
    // reset states
    setRubric(null);

    if (!selectedClassroom || !assignmentID) return;

    getAssignment(selectedClassroom.id, Number(assignmentID)).then((resp) => {
      setAssignment(resp);
    });
  }, [assignmentID]);

  // fetch rubric from requested assignment
  useEffect(() => {
    // reset states
    setRubric(null);

    if (!selectedClassroom || !assignmentID) return;

    getAssignmentRubric(selectedClassroom.id, Number(assignmentID)).then(
      (resp) => {
        setRubric(resp);
      }
    );
  }, [studentWorkID]);

  // fetch requested student assignment
  useEffect(() => {
    // reset states
    setSelectedFile(null);
    setStudentWork(null);

    if (!selectedClassroom || !assignmentID || !studentWorkID) return;

    getPaginatedStudentWork(
      selectedClassroom.id,
      Number(assignmentID),
      Number(studentWorkID)
    )
      .then((resp) => {
        setStudentWork(resp.student_work);
        setFeedback(resp.feedback);
        setStagedFeedback({});
      })
      .catch((_: unknown) => {
        navigate("/404", { replace: true });
      });
  }, [studentWorkID]);

  const getNextFeedbackID = () => {
    const tmp = nextFeedbackID.current;
    nextFeedbackID.current = nextFeedbackID.current + 1;
    return tmp;
  };

  const addFeedback = (feedback: IGraderFeedback[]) => {
    const newFeedback: { [id: number]: IGraderFeedback } = {};
    for (const fb of feedback) {
      newFeedback[getNextFeedbackID()] = {
        ...fb,
        action: "CREATE",
      };
    }

    setStagedFeedback((prevFeedback) => ({
      ...prevFeedback,
      ...newFeedback,
    }));
  };

  const editFeedback = (feedbackID: number, feedback: IGraderFeedback) => {
    const newFeedback: IGraderFeedback = {
      ...feedback,
      action: "EDIT",
    };
    setFeedback((prevFeedback) => ({
      ...prevFeedback,
      [feedbackID]: newFeedback,
    }));
    setStagedFeedback((prevFeedback) => ({
      ...prevFeedback,
      [feedbackID]: newFeedback,
    }));
  };

  const discardEditFeedback = (feedbackID: number) => {
    setFeedback((prevFeedback) => {
      if (prevFeedback[feedbackID].history) {
        const lastFeedback =
          prevFeedback[feedbackID].history[
            prevFeedback[feedbackID].history.length - 1
          ];

        lastFeedback.history?.pop();

        return {
          ...prevFeedback,
          [feedbackID]: lastFeedback,
        };
      }
      return prevFeedback;
    });
    setStagedFeedback((prevFeedback) => {
      const { [feedbackID]: _, ...remainingFeedback } = prevFeedback;
      return remainingFeedback;
    });
  };

  const discardAddFeedback = (feedbackID: number) => {
    setStagedFeedback((prevFeedback) => {
      const { [feedbackID]: _, ...remainingFeedback } = prevFeedback;
      return remainingFeedback;
    });
  };

  const removeFeedback = (_feedbackID: number) => {};

  const postFeedback = () => {
    if (!selectedClassroom || !assignmentID || !studentWorkID) return;

    const stagedFeedbackWithoutHistory: IGraderFeedback[] = Object.values(
      stagedFeedback
    ).map((fb: IGraderFeedbackWithHistory) => {
      const { history, ...fbWithoutHistory } = fb;
      return fbWithoutHistory;
    });

    gradeWork(
      selectedClassroom.id,
      Number(assignmentID),
      Number(studentWorkID),
      stagedFeedbackWithoutHistory
    ).then(() => {
      setStudentWork((prevStudentWork) => {
        if (prevStudentWork) {
          const total =
            (prevStudentWork.manual_feedback_score ??
              assignment?.default_score) +
            Object.values(stagedFeedback).reduce(
              (s: number, fb: IGraderFeedback) => s + fb.points,
              0
            );
          return {
            ...prevStudentWork,
            manual_feedback_score: total,
          };
        }
        return prevStudentWork;
      });
      setFeedback((prevFeedback) => ({
        ...prevFeedback,
        ...stagedFeedback,
      }));
      setStagedFeedback({});
    });
  };

  const selectRubricItem = (riID: number) => {
    setSelectedRubricItems((prevRubricItems) => [...prevRubricItems, riID]);
  };

  const deselectRubricItem = (riID: number) => {
    const deselected = selectedRubricItems.filter((ri) => ri !== riID);
    setSelectedRubricItems(deselected);
  };

  // once feedback is updated, reset id to its length
  // this is so when posting staged feedback, it will never overwrite existing feedback
  useEffect(() => {
    nextFeedbackID.current = feedback ? Object.keys(feedback).length : 0;
  }, [feedback]);

  return (
    <GraderContext.Provider
      value={{
        assignment,
        studentWork,
        selectedFile,
        feedback,
        stagedFeedback,
        rubric,
        selectedRubricItems,
        setSelectedFile,
        addFeedback,
        editFeedback,
        discardAddFeedback,
        discardEditFeedback,
        removeFeedback,
        postFeedback,
        selectRubricItem,
        deselectRubricItem,
      }}
    >
      {children}
    </GraderContext.Provider>
  );
};
