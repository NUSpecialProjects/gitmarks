import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import ClipLoader from "react-spinners/ClipLoader";
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

const Layout: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const {
    classroomUser,
    error: classroomUserError,
    loading: loadingCurrentClassroomUser,
  } = useClassroomUser(selectedClassroom?.id);

  const navigate = useNavigate();

  useEffect(() => {
    if (
      !loadingCurrentClassroomUser &&
      (classroomUserError || !classroomUser)
    ) {
      navigate(`/app/organization/select`);
    }
  }, [
    loadingCurrentClassroomUser,
    classroomUserError,
    classroomUser,
    selectedClassroom?.org_id,
    navigate,
  ]);

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

  if (loadingCurrentClassroomUser) {
    return (
      <div className="Layout__loading">
        <ClipLoader size={50} color={"#123abc"} loading={true} />
      </div>
    );
  }

  return selectedClassroom ? (
    <div className="Layout">
      <div className="Layout__left">
        <LeftNav navItems={navItems} />
      </div>

      <SimpleBar className="Layout__right">
        <div className="Layout__top">
          <TopNav />
        </div>
        <div className="Layout__content">
          <Outlet />
        </div>
      </SimpleBar>
    </div>
  ) : (
    <Navigate to="/app/organization/select" />
  );
};

export default Layout;
