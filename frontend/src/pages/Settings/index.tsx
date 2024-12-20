import { useContext } from "react";

import { AuthContext } from "@/contexts/auth";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";

import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";
import Button from "@/components/Button";

import "./styles.css";

const Settings: React.FC = () => {
  const { logout } = useContext(AuthContext);
  const { selectedClassroom } = useContext(SelectedClassroomContext);

  return (
    selectedClassroom && (
      <div className="Settings">
        <BreadcrumbPageHeader
          pageTitle={selectedClassroom?.org_name}
          breadcrumbItems={[selectedClassroom?.name, "Grading"]}
        />
        <Button variant="primary" onClick={logout}>
          Logout
        </Button>
      </div>
    )
  );
};

export default Settings;
