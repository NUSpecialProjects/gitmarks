import { useContext } from "react";

import { useAuth } from "@/contexts/auth";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";

import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";
import Button from "@/components/Button";

import "./styles.css";
import { useNavigate } from "react-router-dom";

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
    logout();
  }

  return (
    selectedClassroom && (
      <div className="Settings">
        <BreadcrumbPageHeader
          pageTitle={selectedClassroom?.org_name}
          breadcrumbItems={[selectedClassroom?.name, "Settings"]}
        />
        <Button variant="primary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    )
  );
};

export default Settings;
