import { Link } from "react-router-dom";
import "./styles.css";
import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";
import Button from "@/components/Button";
import RubricList from "@/components/RubricList";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import { MdAdd } from "react-icons/md";
import { useClassroomUser, useCurrentClassroom } from "@/hooks/useClassroomUser";
import { ClassroomRole } from "@/types/enums";
import { useRubrics } from "@/hooks/useRubrics";

const Rubrics: React.FC = () => {
  const { selectedClassroom } = useCurrentClassroom();
  useClassroomUser(ClassroomRole.PROFESSOR, "/app/access-denied");

  const { data: rubrics, isLoading, error } = useRubrics(selectedClassroom?.id);

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
