import React, { useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./styles.css";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { Link } from "react-router-dom";
import { getClassroomsInOrg } from "@/api/classrooms";
import { Table, TableRow, TableCell } from "@/components/Table";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import Button from "@/components/Button";
import Pill from "@/components/Pill";
import { removeUnderscores } from "@/utils/text";
import { MdAdd } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ClassroomRole, OrgRole } from "@/types/enums";
import { toClassroom } from "@/types/enums";

const ClassroomSelection: React.FC = () => {
  const location = useLocation();
  const { setSelectedClassroom } = useContext(SelectedClassroomContext);
  const navigate = useNavigate();
  const orgID = location.state?.orgID;

  useEffect(() => {
    if (!orgID) {
      console.log("No organization ID provided. Redirecting to organization selection.");
      navigate("/app/organization/select");
    }
  }, [orgID, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['classrooms', orgID],
    queryFn: async () => {
      if (!orgID || isNaN(Number(orgID))) {
        throw new Error("Invalid organization ID");
      }
      return getClassroomsInOrg(Number(orgID));
    },
    enabled: !!orgID && !isNaN(Number(orgID)),
    retry: false
  });

  const classrooms = data?.classroom_users || [];
  const orgRole = data?.org_role || OrgRole.MEMBER;

  const handleClassroomSelect = (classroomUser: IClassroomUser) => {
    const classroom: IClassroom = toClassroom(classroomUser);
    setSelectedClassroom(classroom);
    navigate(`/app/dashboard`);
  };

  const hasClassrooms = classrooms.length > 0;

  return (
    <div className="Selection">
      <h1 className="Selection__title">Your Classrooms</h1>
      <div className="Selection__tableWrapper">
        {isLoading ? (
          <>
          <br></br>
          <EmptyDataBanner>
            <LoadingSpinner />
          </EmptyDataBanner>
          <br></br>
          </>
        ) : error ? (
          <p>Error loading classrooms: {error instanceof Error ? error.message : "Unknown error"}</p>
        ) : (
          <>
          <Table cols={2}>
            <TableRow>
              <TableCell>
                <div className="Selection__tableHeaderText">Classroom Name</div>
              </TableCell>
              <TableCell>
                {orgRole === OrgRole.ADMIN &&
                  (<div className="Selection__tableHeaderButton">
                    <Button 
                      size="small" 
                      onClick={() => navigate('/app/classroom/create', { state: { orgID } })}
                    >
                        <MdAdd /> New Classroom
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
            {hasClassrooms && (
              classrooms.map((classroomUser, i) => (
                <TableRow key={i} className="Selection__tableRow">
                  <TableCell>
                    <div key={classroomUser.classroom_id} onClick={() => handleClassroomSelect(classroomUser)}>
                      {classroomUser.classroom_name}
                    </div>
                  </TableCell>
                  <TableCell className="Selection__pillCell">
                    <Pill label={removeUnderscores(classroomUser.classroom_role)}
                      variant={(() => {
                        switch (classroomUser.classroom_role) {
                          case ClassroomRole.STUDENT:
                            return 'teal';
                          case ClassroomRole.TA:
                            return 'amber';
                          case ClassroomRole.PROFESSOR:
                            return 'default';
                          default:
                            return 'default'; // Fallback for unexpected roles
                        }
                      })()}>
                    </Pill>
                  </TableCell>
                </TableRow>
              ))
            )}
          </Table>
          {!hasClassrooms && (
            orgRole === OrgRole.ADMIN ? 
            (
              <TableRow className="Selection__tableRow--emptyData">
                 <EmptyDataBanner>
                   <div className="emptyDataBannerMessage">
                      You have no classes in this organization.
                      <br></br>
                      Please create a new classroom to get started.
               </div>
               <Button variant="secondary"
                  onClick={() => navigate('/app/classroom/create', { state: { orgID } })}>
                   <MdAdd /> New Classroom
                 </Button>
                 </EmptyDataBanner>
       
              </TableRow>
            ) : (
              <TableRow className="Selection__tableRow--emptyData">
                  <EmptyDataBanner>
                    You have no classes in this organization.
                    Your professor will need to invite you to a classroom.
                  </EmptyDataBanner>
              </TableRow>
            )
          )}
          </>
        )}
      </div>
      <div className="Selection__linkWrapper">
        <Link to={`/app/organization/select`}>
          {" "}
          Choose a different organization →
        </Link>
      </div>
    </div>
  );
};

export default ClassroomSelection;
