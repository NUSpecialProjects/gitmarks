import React, { useEffect, useState } from "react";
import "./styles.css";
import OrganizationDropdown from "@/components/Dropdown/Organization";
import Panel from "@/components/Panel";
import Button from "@/components/Button";
import { getOrganizationDetails } from "@/api/organizations";
import { useCurrentClassroom } from "@/hooks/useClassroomUser";
import { useAppInstallations } from "@/hooks/useOrganization";

const OrganizationSelection: React.FC = () => {
  const [selectedOrg, setSelectedOrg] = useState<IOrganization | null>(null);
  const { selectedClassroom } = useCurrentClassroom();
  const githubAppName = import.meta.env.VITE_GITHUB_APP_NAME;
  const { data: installationsData, isLoading: loadingOrganizations, error: installationsError } = useAppInstallations();

  useEffect(() => { // set initially selected org
    if (selectedClassroom) {
      getOrganizationDetails(selectedClassroom.org_name)
        .then(orgDetails => {
          setSelectedOrg(orgDetails);
        })
        .catch();
    }
  }, [selectedClassroom]);

  const orgsWithApp = installationsData?.orgs_with_app || [];
  const orgsWithoutApp = installationsData?.orgs_without_app || [];

  const handleOrganizationSelect = async (org: IOrganization) => {
    setSelectedOrg(org);
  };

  return (
    <Panel title="Your Organizations" logo={true}>
      <div className="Organization">
        <OrganizationDropdown
          orgsWithApp={orgsWithApp}
          orgsWithoutApp={orgsWithoutApp}
          selectedOrg={selectedOrg}
          loading={loadingOrganizations}
          onSelect={handleOrganizationSelect}
        />

        <div className="Organization__buttonWrapper">
          {selectedOrg &&
            orgsWithApp.some((org) => org.login === selectedOrg.login) && (
              <Button
                variant="primary"
                href="/app/classroom/select"
                state={{ orgID: selectedOrg.id }}
              >
                View Classrooms
              </Button>
            )}
            
          {selectedOrg &&
            orgsWithoutApp.some((org) => org.login === selectedOrg.login) && (
              <Button
                href={`https://github.com/apps/${githubAppName}/installations/new/permissions?target_id=${selectedOrg.id}&target_type=Organization`}
                newTab={true}
              >
                Install GitMarks
              </Button>
            )}
        </div>
          <a className="Organization__link" href={`https://github.com/apps/${githubAppName}/installations/select_target`} target="_blank" rel="noopener noreferrer">
            {"Don't see your organization?"}
          </a>
        {installationsError && <div className="error">{installationsError.message}</div>}
      </div>
    </Panel>
  );
};

export default OrganizationSelection;
