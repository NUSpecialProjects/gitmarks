import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import "./styles.css";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";
import { getRubricsInClassroom } from "@/api/rubrics";
import Button from "@/components/Button";
import RubricList from "@/components/RubricList";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import { MdAdd } from "react-icons/md";
import { useClassroomUser } from "@/hooks/useClassroomUser";
import { ClassroomRole } from "@/types/enums";

const Rubrics: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  useClassroomUser(selectedClassroom?.id, ClassroomRole.PROFESSOR, "/access-denied");

  const { data: rubrics, isLoading, error } = useQuery({
    queryKey: ['rubrics', selectedClassroom?.id],
    queryFn: () => getRubricsInClassroom(selectedClassroom!.id),
    enabled: !!selectedClassroom,
  });

  return (
    selectedClassroom && (
      <div>
        <BreadcrumbPageHeader
          pageTitle={selectedClassroom?.org_name}
          breadcrumbItems={[selectedClassroom?.name, "Rubrics"]}
        />

        {isLoading ? (
          <EmptyDataBanner>
            <LoadingSpinner />
          </EmptyDataBanner>
        ) : error ? (
          <EmptyDataBanner>
            Error loading rubrics: {error instanceof Error ? error.message : "Unknown error"}
          </EmptyDataBanner>
        ) : (
          <div>
            {rubrics && rubrics.length > 0 ? (
              <RubricList rubrics={rubrics} />
            ) : (
              <EmptyDataBanner>
                <div className="emptyDataBannerMessage">
                  No rubrics have been created yet.
                </div>
                <Button variant="primary" href="/app/rubrics/new">
                  <MdAdd /> Create New Rubric
                </Button>
              </EmptyDataBanner>
            )}

            {rubrics && rubrics.length > 0 && (
              <Link to="/app/rubrics/new">
                <Button>
                  <MdAdd /> Create New Rubric
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    )
  );
};

export default Rubrics;
