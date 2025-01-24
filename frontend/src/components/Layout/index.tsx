import { Outlet, useNavigate } from "react-router-dom";
import { useContext } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { useClassroomUser } from "@/hooks/useClassroomUser";

import LeftNav from "./LeftNav";
import TopNav from "./TopNav";

import "./styles.css";
import { FaTachometerAlt } from "react-icons/fa";
import { MdEditDocument } from "react-icons/md";
import { MdFactCheck } from "react-icons/md";
import { FaGear } from "react-icons/fa6";
import { ClassroomRole } from "@/types/enums";
import LoadingSpinner from "../LoadingSpinner";
import Button from "../Button";

const Layout: React.FC = () => {
  const { selectedClassroom, loading: loadingSelectedClassroom } = useContext(SelectedClassroomContext);
  const { classroomUser } = useClassroomUser(selectedClassroom?.id);
  const navigate = useNavigate();

  const professorNavItems = [
    { name: "Rubrics", dest: "/app/rubrics", Icon: MdFactCheck }
  ];

  const navItems = [
    { name: "Dashboard", dest: "/app/dashboard", Icon: FaTachometerAlt },
    { name: "Grading", dest: "/app/grading", Icon: MdEditDocument },
    ...(classroomUser?.classroom_role === ClassroomRole.PROFESSOR
      ? professorNavItems
      : []),
    { name: "Settings", dest: "/app/settings", Icon: FaGear }
  ];

  return (
    <div className="Layout">
      <div className="Layout__left">
        <LeftNav navItems={navItems} />
      </div>

      <SimpleBar className="Layout__right">
        <div className="Layout__top">
          <TopNav />
        </div>
        {loadingSelectedClassroom ? (
            <div className="Layout__loading">
              <LoadingSpinner />
            </div>
        ) : !selectedClassroom ? (  
          <div className="Layout__error">
            <h2>No Classroom Selected</h2>
            <p>Please select a classroom to continue.</p>
            <Button variant="primary" onClick={() => navigate("/app/classroom/select")}>
              Select Classroom
            </Button>
          </div>
        ) : (
          <div className="Layout__content">
            <Outlet />
          </div>
        )}
      </SimpleBar>
    </div>
  );
};

export default Layout;
