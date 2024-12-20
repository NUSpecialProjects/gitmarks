import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { getRubricsInClassroom } from "@/api/rubrics";

import Button from "@/components/Button";
import RubricList from "@/components/RubricList";
import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";

import "./styles.css";
import { useClassroomUser } from "@/hooks/useClassroomUser";
import { ClassroomRole } from "@/types/enums";

const Rubrics: React.FC = () => {
    const { selectedClassroom } = useContext(SelectedClassroomContext)
    useClassroomUser(selectedClassroom?.id, ClassroomRole.PROFESSOR, "/access-denied");
    const [rubrics, setRubricsData] = useState<IFullRubric[]>([])

  const [loading, setLoading] = useState(false);
  const [failedRurbicRetrival, setfailedRurbicRetrival] = useState(false);

  useEffect(() => {
    if (selectedClassroom) {
      (async () => {
        setLoading(true);
        try {
          const retrievedRubrics = await getRubricsInClassroom(
            selectedClassroom.id
          );
          if (retrievedRubrics !== null) {
            setRubricsData(retrievedRubrics);
          }
          setLoading(false);
        } catch (_) {
          setfailedRurbicRetrival(true);
        }
      })();
    }
  }, []);

  return (
    selectedClassroom && (
      <div>
        <BreadcrumbPageHeader
          pageTitle={selectedClassroom?.org_name}
          breadcrumbItems={[selectedClassroom?.name, "Rubrics"]}
        />

        {failedRurbicRetrival && (
          <div>
            <div> Failed to get existing rubrics </div>
          </div>
        )}

        {!failedRurbicRetrival && loading && <div> Loading... </div>}

        {!failedRurbicRetrival && !loading && rubrics && (
          <div>
            {rubrics.length > 0 ? (
              <RubricList rubrics={rubrics} />
            ) : (
              <div> No Rubrics Found </div>
            )}

            <Link to={`/app/rubrics/new`}>
              <Button href=""> Create New Rubric </Button>
            </Link>
          </div>
        )}
      </div>
    )
  );
};

export default Rubrics;
