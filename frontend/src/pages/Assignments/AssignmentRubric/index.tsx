import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "./styles.css";
import { getRubric, getRubricsInClassroom } from "@/api/rubrics";
import Button from "@/components/Button";
import { Table, TableCell, TableRow } from "@/components/Table";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getAssignmentRubric } from "@/api/assignments";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";


const AssignmentRubric: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedClassroom } = useContext(SelectedClassroomContext)

  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState(false)


  const [assignment, setAssignmentData] = useState<IAssignmentOutline>()
  const [rubricData, setRubricData] = useState<IFullRubric>()
  const [rubrics, setRubrics] = useState<IFullRubric[]>([])

  const [importing, setImporting] = useState(false)


  const choseExisting = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value, 10);
    if (selectedId) {
      const selectedRubric = rubrics.find((rubric) => rubric.rubric.id === selectedId);
      if (selectedRubric && assignment) {
        navigate('/app/rubrics/new', {
          state: { assignment: assignment, rubricData: selectedRubric, newRubric: true },
        });

      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading
      try {
        if (location.state) {
          setAssignmentData(location.state.assignment);
          const aData = location.state.assignment;
          if (aData && aData.rubric_id) {
            const rubric = await getRubric(aData.rubric_id);
            if (rubric !== null) {
              setRubricData(rubric);
            }
          } else {
            if (selectedClassroom) {
              const rubric = await getAssignmentRubric(selectedClassroom.id, aData.id);
              if (rubric !== null) {
                setRubricData(rubric)
              }
            }
          }
        }

        if (selectedClassroom) {
          const retrievedRubrics = await getRubricsInClassroom(selectedClassroom.id);
          if (retrievedRubrics !== null) {
            setRubrics(retrievedRubrics);
          }
        }
      } catch (_) {
        setErrorState(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
}, [location.state, selectedClassroom, assignment]);



  return (
    <div className="AssignmentRubric">

      {errorState && (
        <div> {"Could not get this assignment's rubric"} </div>
      )}

      {loading && !errorState && (
        <LoadingSpinner />
      )}

      {assignment && !errorState && !loading && (
        <>
          <SubPageHeader
            pageTitle={`${assignment.name} Rubric`}
            chevronLink={`/app/assignments/${assignment.id}`}
          />


          {rubricData ? (
            <div>
              <div className="AssignmentRubric__title">
                {rubricData.rubric.name}

                <Link to={`/app/rubrics/new`} state={{ assignment, rubricData }}>
                  <Button href=""> Edit Rubric </Button>
                </Link>


              </div>


              <Table cols={2}>
                <TableRow>
                  <TableCell>Explanation </TableCell>
                  <TableCell>Point Value </TableCell>
                </TableRow>

                {rubricData &&
                  rubricData.rubric_items.map((item, i: number) => (
                    <TableRow key={i}>
                      <TableCell> {item.explanation} </TableCell>
                      <TableCell> {item.point_value ? (item.point_value > 0 ? "+" + item.point_value : item.point_value) : ""} </TableCell>
                    </TableRow>
                  ))}
              </Table>

            </div>
          ) : (
            <div className="AssignmentRubric__noRubric">
              <div className="AssignmentRubric__noRubricTitle">This Assignment does not have a Rubric yet.</div>


              {importing ?
                <div>
                  <select id="dropdown" onChange={choseExisting}>
                    <option value="">-- Select a starter rubric --</option>
                    {rubrics.map((rubric) => (
                      <option key={rubric.rubric.id} value={rubric.rubric.id!}>
                        {rubric.rubric.name}
                      </option>
                    ))}
                  </select>

                  <Button href="" variant="secondary" onClick={() => setImporting(false)}>
                    Cancel
                  </Button>
                </div>

                :
                <div>
                  <Button href="" variant="secondary" onClick={() => setImporting(true)}> Import existing rubric</Button>


                  <Link to={`/app/rubrics/new`} state={{ assignment }}>
                    <Button href="" > Add new rubric</Button>
                  </Link>
                </div>

              }
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssignmentRubric;