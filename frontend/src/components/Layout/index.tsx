import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";

import LeftNav from "./LeftNav";
import TopNav from "./TopNav";
import { SelectedSemesterContext } from "@/contexts/selectedSemester";

import "./styles.css";

const Layout: React.FC = () => {
  const { selectedSemester } = useContext(SelectedSemesterContext);
  return selectedSemester ? (
    <div className="Layout">
      <div className="Layout__left">
        <LeftNav />
      </div>

      <div className="Layout__right">
        <div className="Layout__top">
          <TopNav />
        </div>
        <div className="Layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <Navigate to="/app/classroom/select" />
  );
};

export default Layout;
