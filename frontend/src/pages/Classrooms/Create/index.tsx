import React, { useContext } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { postClassroom } from "@/api/classrooms";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import Panel from "@/components/Panel";
import Button from "@/components/Button";
import { useMutation } from "@tanstack/react-query";
import { useOrganizationDetails } from "@/hooks/useOrganization";
import { useClassroomNames } from "@/hooks/useClassroom";
import { useClassroomValidation } from "@/hooks/useClassroom";
import ValidationIndicator from "@/components/ValidationIndicator";

import "./styles.css";
import Input from "@/components/Input";
import GenericDropdown from "@/components/Dropdown";
import LoadingSpinner from "@/components/LoadingSpinner";
import useDebounce from "@/hooks/useDebounce";
import validateRepoName from "@/utils/repo-name-validation";

const ClassroomCreation: React.FC = () => {
  const [name, debouncedName, setName] = useDebounce<string>("", 100);
  const [showCustomNameInput, setShowCustomNameInput] = React.useState(false);
  const { setSelectedClassroom } = useContext(SelectedClassroomContext);
  const navigate = useNavigate();
  const location = useLocation();
  const orgID = location.state?.orgID;

  const isValidRepoName = validateRepoName(name);

  const { data: predefinedClassroomNames = [], isError: isNamesError } = useClassroomNames();
  const { data: classroomExists = false, isLoading: isClassroomExistsLoading, error: classroomExistsError } = useClassroomValidation(debouncedName);
  const allClassroomNames = [...predefinedClassroomNames, "Custom"];
  const { data: organization, isLoading: isOrgLoading, error: orgError } = useOrganizationDetails(orgID);

  const createClassroomMutation = useMutation({
    mutationFn: postClassroom,
    onSuccess: (createdClassroom: IClassroom) => {
      setSelectedClassroom(createdClassroom);
      navigate("/app/classroom/invite-tas");
    }
  });

  const handleNameChange = (selected: string) => {
    if (selected === "Custom") {
      setShowCustomNameInput(true);
      setName("");
    } else {
      setShowCustomNameInput(false);
      setName(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !organization) {
      return;
    }
    
    createClassroomMutation.mutate({
      name: name,
      org_id: organization.id,
      org_name: organization.login,
    });
  };

  return (
    <Panel title="New Classroom" logo={true}>
      <div className="ClassroomCreation">
        {isOrgLoading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Organization name"
              name="organization"
              required
              readOnly
              value={organization ? organization.login : ""}
            />

            {allClassroomNames.length > 0 && (
              <GenericDropdown
                labelText="Classroom name"
                selectedOption={showCustomNameInput ? "Custom" : name}
                loading={false}
                options={allClassroomNames.map(option => ({ value: option, label: option }))}
                onChange={handleNameChange}
              />
            )}

            {(showCustomNameInput || allClassroomNames.length === 0) && (
              <div className="ClassroomCreation__inputWrapper">
                <Input
                  label="Custom classroom name"
                  name="classroom-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {name && (
                  <div className="ClassroomCreation__validationIndicator">
                    <ValidationIndicator
                      isLoading={isClassroomExistsLoading}
                      isValid={isValidRepoName && !classroomExists}
                    />
                  </div>
                )}
              </div>
            )}

            {(createClassroomMutation.error || orgError || isNamesError || classroomExists || classroomExistsError || !isValidRepoName) && (
              <p className="error">
                {createClassroomMutation.error ? "Failed to create classroom."
                  : orgError ? "Failed to fetch organization details."
                  : isNamesError ? "Failed to fetch classroom names."
                  : classroomExistsError ? classroomExistsError.message
                  : classroomExists ? "Classroom name already exists."
                  : !isValidRepoName && name ? "Classroom name cannot contain any special characters."
                  : ""}
              </p>
            )}
            
            {!organization && (
              <p className="error">
                <Link to="/app/organization/select">
                  Click here to select an organization
                </Link>
                .
              </p>
            )}
            <div className="ClassroomCreation__buttonWrapper">
              <Button 
                type="submit" 
                disabled={createClassroomMutation.isPending || classroomExists || isClassroomExistsLoading || !isValidRepoName}
                overrideVariant={createClassroomMutation.isPending || classroomExists || !isValidRepoName ? "disabled" : "primary"}
              >
                {createClassroomMutation.isPending ? "Creating..." : "Create Classroom"}
              </Button>
              <Button variant="secondary" href="/app/organization/select">
                Select a different organization
              </Button>
            </div>
          </form>
        )}
      </div>
    </Panel>
  );
};

export default ClassroomCreation;
