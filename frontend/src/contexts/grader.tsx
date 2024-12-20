import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { SelectedClassroomContext } from "./selectedClassroom";
import { AuthContext } from "./auth";
import { getPaginatedStudentWork } from "@/api/student_works";
import { getAssignment } from "@/api/assignments";
import { gradeWork } from "@/api/grader";
import { getAssignmentRubric } from "@/api/assignments";

interface IGraderContext {
  assignment: IAssignmentOutline | null;
  studentWork: IPaginatedStudentWork | null;
  selectedFile: IFileTreeNode | null;
  feedback: IGraderFeedbackMap;
  /*************************************************************
   * - staged feedback is essentially a list of "commands."
   * - each staged fb has an action: create, edit, or delete
   * - when rendering comments in the ui, only render the
   *   comments from "create" actions.
   * - the regular feedback list will also store edit/delete
   *   states in order to visualize this e.g. when you edit
   *   a comment, you would want the same one to display the
   *   change, not append a new staged comment with the changes.
   *************************************************************/
  stagedFeedback: IGraderFeedbackMap;
  rubric: IFullRubric | null;
  selectedRubricItems: number[];
  postingFeedback: boolean;
  setSelectedFile: React.Dispatch<React.SetStateAction<IFileTreeNode | null>>;
  addFeedback: (feedback: IGraderFeedback[]) => void;
  editFeedback: (
    action: IGraderAction,
    feedbackID: number,
    feedback?: IGraderFeedback
  ) => void;
  discardAddFeedback: (feedbackID: number) => void;
  discardEditFeedback: (feedbackID: number) => void;
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
    postingFeedback: false,
    setSelectedFile: () => {},
    addFeedback: () => 0,
    editFeedback: () => {},
    discardAddFeedback: () => {},
    discardEditFeedback: () => {},
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
  const { currentUser } = useContext(AuthContext);

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
  const [postingFeedback, setPostingFeedback] = useState(false);

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

  // an increasing ID just for local so we can easily reference and never overwrite
  const getNextFeedbackID = () => {
    const tmp = nextFeedbackID.current;
    nextFeedbackID.current = nextFeedbackID.current + 1;
    return tmp;
  };

  /****************************************
   * CREATE ACTION
   * - create the "create" staging feedback
   *   which WILL be rendered
   ****************************************/
  const addFeedback = (fbs: IGraderFeedback[]) => {
    const newFeedback: { [id: number]: IGraderFeedback } = {};
    for (const fb of fbs) {
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

  /****************************************
   * EDIT ACTION
   * - create the "action" staging feedback
   *   which WONT be rendered
   * - modify the existing feedback in order
   *   to reflect the changes in grader UI
   ****************************************/
  const editFeedback = (
    action: IGraderAction,
    feedbackID: number,
    fb?: IGraderFeedback
  ) => {
    if (!fb) fb = feedback[feedbackID];
    fb.ta_username = currentUser?.login;

    setStagedFeedback((prevFeedback) => ({
      ...prevFeedback,
      [feedbackID]: {
        ...fb,
        // only overwrite action if preexisting. if editing a purely
        // staged comment, it will still need to be a create command.
        action: feedbackID in feedback ? action : fb.action,
      },
    }));
    if (!(feedbackID in feedback)) return;
    setFeedback((prevFeedback) => {
      // push last state to history before overwriting
      const currentFeedback = prevFeedback[feedbackID];
      const newHistory = currentFeedback.history
        ? [{ ...currentFeedback }, ...currentFeedback.history]
        : [{ ...currentFeedback }];

      return {
        ...prevFeedback,
        [feedbackID]: {
          ...fb,
          action,
          history: newHistory,
        },
      };
    });
  };

  /****************************************
   * ROLLBACK EDIT ACTION
   * - create the "action" staging feedback
   *   which WONT be rendered
   * - modify the existing feedback in order
   *   to reflect the changes in grader UI
   ****************************************/
  const discardEditFeedback = (feedbackID: number) => {
    setFeedback((prevFeedback) => {
      const currentFeedback = prevFeedback[feedbackID];

      if (currentFeedback.history && currentFeedback.history.length > 0) {
        const restoredFeedback = {
          ...currentFeedback.history[0], // pop the latest from history
          history: currentFeedback.history.slice(1),
        };

        return {
          ...prevFeedback,
          [feedbackID]: restoredFeedback,
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

  const postFeedback = () => {
    if (
      !selectedClassroom ||
      !assignmentID ||
      !studentWorkID ||
      postingFeedback
    )
      return;

    setPostingFeedback(true);

    // strip history from feedback before posting to backend (backend does not need to know)
    const stagedFeedbackWithoutHistory: IGraderFeedback[] = Object.values(
      stagedFeedback
    ).map((fb: IGraderFeedbackWithHistory) => {
      const { history: _, ...fbWithoutHistory } = fb;
      return fbWithoutHistory;
    });

    gradeWork(
      selectedClassroom.id,
      Number(assignmentID),
      Number(studentWorkID),
      stagedFeedbackWithoutHistory
    )
      .then(() => {
        getPaginatedStudentWork(
          selectedClassroom.id,
          Number(assignmentID),
          Number(studentWorkID)
        ).then((resp) => {
          setStudentWork(resp.student_work);
          setFeedback(resp.feedback);
          setStagedFeedback({});
        });
      })
      .finally(() => {
        setPostingFeedback(false);
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
        postingFeedback,
        setSelectedFile,
        addFeedback,
        editFeedback,
        discardAddFeedback,
        discardEditFeedback,
        postFeedback,
        selectRubricItem,
        deselectRubricItem,
      }}
    >
      {children}
    </GraderContext.Provider>
  );
};
