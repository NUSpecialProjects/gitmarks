import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { Link } from "react-router-dom";
import { getClassroomsInOrg } from "@/api/classrooms";
import useUrlParameter from "@/hooks/useUrlParameter";
import { Table, TableRow, TableCell } from "@/components/Table";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import Button from "@/components/Button";
import Pill from "@/components/Pill";
import { removeUnderscores } from "@/utils/text";
import { MdAdd } from "react-icons/md";
import { ClassroomRole, OrgRole, toClassroom } from "@/types/enums";

const ClassroomSelection: React.FC = () => {
  const [classrooms, setClassrooms] = useState<IClassroomUser[]>([]);
  const [orgRole, setOrgRole] = useState<OrgRole>(OrgRole.MEMBER);
  const orgID = useUrlParameter("org_id");
  const [loading, setLoading] = useState(true);
  const { setSelectedClassroom } = useContext(SelectedClassroomContext);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!loading && !orgID) {
        navigate("/app/organization/select");
      } else {
        setLoading(true);
        try {
          const org_id = parseInt(orgID);
          if (!isNaN(org_id)) {
            const data: IClassroomUsersListResponse = await getClassroomsInOrg(org_id);
            if (data.classroom_users) {
              setClassrooms(data.classroom_users);
            }
            if (data.org_role) {
              setOrgRole(data.org_role);
            }
          }
        } catch (_) {
          // do nothing
        } finally {
          setLoading(false);
        }
      }
    };

    void fetchClassrooms();
  }, [orgID]);

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
        {/* If the screen is loading, display a message, else render table */}
        {loading ? (
          <p>Loading...</p>
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
                    <Button size="small" href={`/app/classroom/create?org_id=${orgID}`}>
                      <MdAdd /> New Classroom
                    </Button>
                  </div>
                  )}
              </TableCell>
            </TableRow>
            {/* If the org has classrooms, populate table, else display a message TODO make alert for no classes*/}
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
               <Button variant="secondary" href={`/app/classroom/create?org_id=${orgID}`}>
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
