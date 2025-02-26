import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { SelectedClassroomContext } from "./selectedClassroom";
import { getPaginatedStudentWork } from "@/api/student_works";
import { getFileTree, gradeWork } from "@/api/grader";
import { getAssignmentRubric } from "@/api/assignments";
import { ErrorToast, useActionToast } from "@/components/Toast";


interface IGraderContext {
  assignmentID: string | undefined;
  studentWorkID: string | undefined;
  studentWork: IPaginatedStudentWork | null;
  selectedFile: IFileTreeNode | null;
  feedback: IGraderFeedbackMap;
  stagedFeedback: IGraderFeedbackMap;
  rubric: IFullRubric | null;
  selectedRubricItems: number[];
  fileTree: IGitTreeNode[] | null;
  loadingStudentWork: boolean;
  loadingGitTree: boolean;
  dataRetrievalError: boolean;
  isSubmittingGrade: boolean;
  setSelectedFile: React.Dispatch<React.SetStateAction<IFileTreeNode | null>>;
  addFeedback: (feedback: IGraderFeedback[]) => void;
  editFeedback: (feedbackID: number, feedback: IGraderFeedback) => void;
  removeFeedback: (feedbackID: number) => void;
  postFeedback: () => void;
  selectRubricItem: (riID: number) => void;
  deselectRubricItem: (riID: number) => void;
}

export const GraderContext: React.Context<IGraderContext> =
  createContext<IGraderContext>({
    assignmentID: undefined,
    studentWorkID: undefined,
    studentWork: null,
    selectedFile: null,
    feedback: {},
    stagedFeedback: {},
    rubric: null,
    selectedRubricItems: [],
    fileTree: [],
    loadingStudentWork: true,
    loadingGitTree: true,
    dataRetrievalError: false,
    isSubmittingGrade: false,
    setSelectedFile: () => {},
    addFeedback: () => 0,
    editFeedback: () => {},
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
  const { executeWithToast } = useActionToast();

  const nextFeedbackID = useRef(0);
  const [feedback, setFeedback] = useState<IGraderFeedbackMap>({});
  const [stagedFeedback, setStagedFeedback] = useState<IGraderFeedbackMap>({});
  const [studentWork, setStudentWork] = useState<IPaginatedStudentWork | null>(
    null
  );
  const [selectedRubricItems, setSelectedRubricItems] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<IFileTreeNode | null>(null);
  const [rubric, setRubric] = useState<IFullRubric | null>(null);
  const [fileTree, setFileTree] = useState<IGitTreeNode[] | null>(null)
  const [dataRetrievalError, setDataRetrievalError] = useState(false)
  const [loadingStudentWork, setLoadingStudentWork] = useState(true)
  const [loadingGitTree, setLoadingGitTree] = useState(true)
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  const navigate = useNavigate();

  // fetch rubric from requested assignment
  useEffect(() => {
    // reset states
    setRubric(null);

    if (!selectedClassroom || !assignmentID) return;

    getAssignmentRubric(selectedClassroom.id, Number(assignmentID))
      .then((resp) => {
        setRubric(resp);
      })
      .catch((_: unknown) => {
        ErrorToast("Failed to load assignment rubric. Please try refreshing the page.", "rubric-error");
      });
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
        setLoadingStudentWork(false);
      })
      .catch((_: unknown) => {
        setDataRetrievalError(true);
        setLoadingStudentWork(false);
        ErrorToast("Failed to load student work. Redirecting to 404 page.", "student-work-error");
        navigate("/404", { replace: true });
      });
  }, [studentWorkID]);

  // retrieve file tree
  useEffect(() => {
    setFileTree(null);

    if (!selectedClassroom || !assignmentID || !studentWorkID) return;

    getFileTree(
      selectedClassroom.id,
      Number(assignmentID),
      Number(studentWorkID)
    ) 
      .then((resp) => {
        setFileTree(resp);
        setLoadingGitTree(false);
      })
      .catch((_: unknown) => {
        setDataRetrievalError(true);
        setLoadingGitTree(false);
        ErrorToast("Failed to load file tree. Some features may not work correctly.", "file-tree-error");
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

  const editFeedback = (_feedbackID: number, _feedback: IGraderFeedback) => {};

  const removeFeedback = (_feedbackID: number) => {};

  const postFeedback = () => {
    if (!selectedClassroom || !assignmentID || !studentWorkID) return;
    
    setIsSubmittingGrade(true);
    
    executeWithToast(
      "post-feedback-toast",
      async () => {
        try {
          await gradeWork(
            selectedClassroom.id,
            Number(assignmentID),
            Number(studentWorkID),
            stagedFeedback
          );
          
          setStudentWork((prevStudentWork) => {
            if (prevStudentWork) {
              return {
                ...prevStudentWork,
                manual_feedback_score:
                  prevStudentWork.manual_feedback_score +
                  Object.values(stagedFeedback).reduce(
                    (s: number, fb: IGraderFeedback) => s + fb.points,
                    0
                  ),
              };
            }
            return prevStudentWork;
          });
          
          setFeedback((prevFeedback) => ({
            ...prevFeedback,
            ...stagedFeedback,
          }));
          
          setStagedFeedback({});
        } finally {
          setIsSubmittingGrade(false);
        }
      },
      {
        pending: "Submitting grade...",
        success: "Grade submitted successfully!",
        error: "Failed to submit grade. Please try again."
      }
    );
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
        assignmentID,
        studentWorkID,
        studentWork,
        selectedFile,
        feedback,
        stagedFeedback,
        rubric,
        selectedRubricItems,
        fileTree,
        loadingGitTree,
        loadingStudentWork,
        dataRetrievalError,
        isSubmittingGrade,
        setSelectedFile,
        addFeedback,
        editFeedback,
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
