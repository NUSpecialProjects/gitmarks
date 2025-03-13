import { useEffect, useState } from "react";
import { getOrganizationTemplates } from "@/api/organizations";
import { useNavigate } from "react-router-dom";

import MultiStepForm from "@/components/MultiStepForm";
import AssignmentDetails from "@/components/MultiStepForm/CreateAssignment/AssignmentDetails";
import StarterCodeDetails from "@/components/MultiStepForm/CreateAssignment/StarterCodeDetails";
import { createAssignment, assignmentNameExists } from "@/api/assignments";

import "./styles.css";
import { useClassroomUser, useCurrentClassroom } from "@/hooks/useClassroomUser";
import { ClassroomRole } from "@/types/enums";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { useActionToast } from "@/components/Toast";

const CreateAssignment: React.FC = () => {
  const navigate = useNavigate();

  // Determine active classroom and organization
  const { selectedClassroom } = useCurrentClassroom();
  useClassroomUser(ClassroomRole.PROFESSOR, "/app/access-denied");
  const orgName = selectedClassroom?.org_name;
  const { executeWithToast } = useActionToast();

  // Fetch template repositories
  const [templateRepos, setTemplateRepos] = useState<ITemplateRepo[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchTemplates = async (orgName: string | undefined) => {
      if (orgName) {
        setLoadingTemplates(true);

        // TODO: Implement dynamic pagination in template dropdown
        // Currently, only the first 100 templates are fetched,
        // which are not necessarily all templates.
        getOrganizationTemplates(orgName, "100", "1")
          .then((response) => {
            setTemplateRepos(response.templates);
          })
          .catch((_: unknown) => {
            // do nothing
          })
          .finally(() => {
            setLoadingTemplates(false);
          });
      }
    };

    fetchTemplates(orgName);
  }, [orgName]);

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
          throw new Error("Please provide an assignment name.");
        }

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
        const templateRepoId = data.templateRepo?.template_repo_id;
        // check if a template repo is selected
        if (!templateRepoId) { // throw outside of executeWithToast
          throw new Error("Please select a template repository.");
        }

        return executeWithToast(
          "create-assignment-toast",
          async () => {
            const assignment = await createAssignment(templateRepoId, data);
            navigate(`/app/assignments/${assignment.id}`);
          },
          {
            pending: "Creating assignment...",
            success: "Assignment created successfully",
            error: "Failed to create assignment"
          }
        );
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
