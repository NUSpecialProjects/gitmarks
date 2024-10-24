import React, { useEffect, useState } from "react";
import "./styles.css";
import { useNavigate } from "react-router-dom";
import OrganizationDropdown from "@/components/Dropdown/Organization";
import ClassroomDropdown from "@/components/Dropdown/Classroom";
import {
  getClassrooms,
  getOrganizationDetails,
  getOrganizations,
  postSemester,
} from "@/api/semesters";

enum SemesterCreationStatus {
  NONE = "NONE",
  CREATING = "CREATING",
  ERRORED = "ERRORED",
  CREATED = "CREATED",
}

const SemesterCreation: React.FC = () => {
  const [orgsWithApp, setOrgsWithApp] = useState<IOrganization[]>([]);
  const [orgsWithoutApp, setOrgsWithoutApp] = useState<IOrganization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<IOrganization | null>(null);

  const [availableClassrooms, setAvailableClassrooms] = useState<IClassroom[]>(
    []
  );
  const [unavailableClassrooms, setUnavailableClassrooms] = useState<
    IClassroom[]
  >([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState<IClassroom | null>(
    null
  );

  const [semesterCreationStatus, setSemesterCreationStatus] = useState(
    SemesterCreationStatus.NONE
  );

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data: IOrganizationsResponse = await getOrganizations();

        //checking if data exists before populating and setting lists
        if (data.orgs_with_app) {
          setOrgsWithApp(data.orgs_with_app);
        }
        if (data.orgs_without_app) {
          setOrgsWithoutApp(data.orgs_without_app);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setLoadingOrganizations(false);
      }
    };

    void fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      const fetchClassrooms = async () => {
        try {
          const data: IClassroomResponse = await getClassrooms(selectedOrg.id);
          setAvailableClassrooms(data.available_classrooms);
          setUnavailableClassrooms(data.unavailable_classrooms);
        } catch (error) {
          setAvailableClassrooms([]);
          setUnavailableClassrooms([]);
          console.error("Error fetching classrooms:", error);
        } finally {
          setLoadingClassrooms(false);
        }
      };

      void fetchClassrooms();
    }
  }, [selectedOrg]);

  const handleOrganizationSelect = async (org: IOrganization) => {
    try {
      const data: IOrganization = await getOrganizationDetails(org.login);
      setSelectedOrg(data);
      setSelectedClassroom(null);
    } catch (error) {
      console.error("Error fetching organization details:", error);
    }
  };

  const handleClassroomSelect = async (classroom: IClassroom) => {
    setSemesterCreationStatus(SemesterCreationStatus.NONE);
    setSelectedClassroom(classroom);
  };

  const handleCreateSemester = async () => {
    if (selectedOrg && selectedClassroom) {
      setSemesterCreationStatus(SemesterCreationStatus.CREATING);
      try {
        await postSemester(
          selectedOrg.id,
          selectedClassroom.id,
          selectedOrg.login,
          selectedClassroom.name
        );
        setSemesterCreationStatus(SemesterCreationStatus.CREATED);
        // Move selectedClassroom to unavailableClassrooms
        setAvailableClassrooms((prevAvailableClassrooms) =>
          prevAvailableClassrooms.filter(
            (classroom) => classroom.id !== selectedClassroom.id
          )
        );
        setUnavailableClassrooms((prevUnavailableClassrooms) => [
          ...prevUnavailableClassrooms,
          selectedClassroom,
        ]);
      } catch (error) {
        setSemesterCreationStatus(SemesterCreationStatus.ERRORED);
        console.error("Error creating class:", error);
      }
    }
  };

  return (
    <div>
      <h1>Create a New Class</h1>
      {semesterCreationStatus == SemesterCreationStatus.NONE && (
        <>
          <OrganizationDropdown
            orgsWithApp={orgsWithApp}
            orgsWithoutApp={orgsWithoutApp}
            selectedOrg={selectedOrg}
            loading={loadingOrganizations}
            onSelect={handleOrganizationSelect}
          />
          {selectedOrg &&
            orgsWithApp.find((org) => org.id === selectedOrg.id) && (
              <ClassroomDropdown
                availableClassrooms={availableClassrooms}
                unavailableClassrooms={unavailableClassrooms}
                selectedClassroom={selectedClassroom}
                loading={loadingClassrooms}
                onSelect={handleClassroomSelect}
              />
            )}
        </>
      )}
      {semesterCreationStatus == SemesterCreationStatus.CREATED && (
        <div>Class successfully created!</div>
      )}
      <div>
        {selectedClassroom &&
          selectedOrg &&
          availableClassrooms.find(
            (classroom) => classroom.id === selectedClassroom.id
          ) && (
            <>
              {semesterCreationStatus === SemesterCreationStatus.CREATING && (
                <button onClick={handleCreateSemester} disabled={true}>
                  `Creating ${selectedClassroom.name}...`
                </button>
              )}
              {(semesterCreationStatus === SemesterCreationStatus.NONE ||
                semesterCreationStatus === SemesterCreationStatus.ERRORED) && (
                <button onClick={handleCreateSemester}>
                  {`Create Class: "${selectedOrg.login}:${selectedClassroom.name}"`}
                </button>
              )}
              {semesterCreationStatus === SemesterCreationStatus.ERRORED && (
                <div>Error creating class. Please try again.</div>
              )}
            </>
          )}
      </div>
      <button
        onClick={() => {
          navigate("/app/classroom/select");
        }}
      >
        {" "}
        Go to Select Class Page
      </button>
      {semesterCreationStatus !== SemesterCreationStatus.NONE && (
        <button
          onClick={() => {
            setSemesterCreationStatus(SemesterCreationStatus.NONE);
          }}
        >
          {" "}
          Create another class
        </button>
      )}
    </div>
  );
};

export default SemesterCreation;
