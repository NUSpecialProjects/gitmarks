import { useNavigate } from "react-router-dom";

import MultiStepForm from "@/components/MultiStepForm";
import AssignmentDetails from "@/components/MultiStepForm/CreateAssignment/AssignmentDetails";
import StarterCodeDetails from "@/components/MultiStepForm/CreateAssignment/StarterCodeDetails";
import { createAssignment, assignmentNameExists } from "@/api/assignments";

import "./styles.css";
import { useClassroomUser, useCurrentClassroom } from "@/hooks/useClassroomUser";
import { ClassroomRole } from "@/types/enums";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { useTemplateRepos } from "@/hooks/useAssignment";
import validateRepoName from "@/utils/repo-name-validation";

const CreateAssignment: React.FC = () => {
  const navigate = useNavigate();

  // Determine active classroom and organization
  const { selectedClassroom } = useCurrentClassroom();
  useClassroomUser(ClassroomRole.PROFESSOR, "/app/access-denied");
  const orgName = selectedClassroom?.org_name;

  // Use React Query hook for templates
  const { data: templateRepos, isLoading: loadingTemplates } = useTemplateRepos(orgName);

  // Initial form state
  const initialData: IAssignmentFormData = {
    assignmentName: "",
    classroomId: selectedClassroom?.id || -1,
    groupAssignment: false,
    mainDueDate: null,
    defaultScore: 0,
    templateRepo: null,
  };

  // Define each page of the form
  const steps: IStep<IAssignmentFormData>[] = [
    {
      title: "Assignment Details",
      component: AssignmentDetails,
      onNext: async (data: IAssignmentFormData): Promise<void> => {
        // Check the user provided an assignment name
        if (!data.assignmentName) {
          throw new Error("Please provide the assignment name.");
        }

        // Validate assignment name for illegal characters
        if (!validateRepoName(data.assignmentName)) {
          throw new Error("Assignment name cannot contain any special characters.");
        }

        // Remove leading and trailing whitespace
        data.assignmentName = data.assignmentName.trim();

        // Check if the assignment name is unique
        const nameExists = await assignmentNameExists(
          data.classroomId,
          data.assignmentName
        );
        if (nameExists) {
          throw new Error(
            "An assignment with this name already exists in this classroom."
          );
        }
      },
    },
    {
      title: "Starter Code Repository",
      component: (props: IStepComponentProps<IAssignmentFormData>) => (
        <StarterCodeDetails
          {...props}
          templateRepos={templateRepos}
          isLoading={loadingTemplates}
        />
      ),
      onNext: async (data: IAssignmentFormData): Promise<void> => {
        if (!data.templateRepo?.template_repo_id) {
          throw new Error("Please select a template repository.");
        }
        await createAssignment(data.templateRepo.template_repo_id, data);

        navigate("/app/dashboard");
      },
    },
  ];

  return (
    <>
      <SubPageHeader
        pageTitle={"Create Assignment"}
        chevronLink={"/app/dashboard"}
      >
      </SubPageHeader>
      <div className="CreateAssignment">
        <MultiStepForm
          steps={steps}
          cancelLink="/app/dashboard"
          initialData={initialData} />
      </div>
    </>
  );
};

export default CreateAssignment;
