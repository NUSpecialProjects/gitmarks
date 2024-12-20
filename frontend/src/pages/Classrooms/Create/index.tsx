import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { checkClassroomExists, getClassroomNames, postClassroom } from "@/api/classrooms";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { getOrganizationDetails } from "@/api/organizations";
import useUrlParameter from "@/hooks/useUrlParameter";
import Panel from "@/components/Panel";
import Button from "@/components/Button";

import "./styles.css";
import Input from "@/components/Input";
import GenericDropdown from "@/components/Dropdown";

const ClassroomCreation: React.FC = () => {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orgID = useUrlParameter("org_id");
  const [predefinedClassroomNames, setPredefinedClassroomNames] = useState<string[]>([]);
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);
  const { setSelectedClassroom } = useContext(SelectedClassroomContext);
  const navigate = useNavigate();

  const [classroomExists, setClassroomExists] = useState(false);

  useEffect(() => {
    const checkExists = async () => {
      if (name) {
        const exists = await checkClassroomExists(name);
        setClassroomExists(exists);
        if (exists) {
          setError("A classroom with this name already exists.");
        } else {
          setError(null);
        }
      }
    };
    checkExists();
  }, [name]);

  useEffect(() => {
    const fetchClassroomNames = async () => {
      try {
        const names = await getClassroomNames();
        setPredefinedClassroomNames([...names, "Custom"]);
        if (names.length > 0) {
          setName(names[0]);
        }
      } catch (error) {
        console.error("Failed to fetch classroom names:", error);
      }
    };

    fetchClassroomNames();
  }, []);

  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      if (orgID) {
        setLoading(true);
        await getOrganizationDetails(orgID)
          .then((org) => {
            setOrganization(org);
          })
          .catch((_) => {
            setError("Failed to fetch organization details. Please try again.");
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };

    fetchOrganizationDetails();
  }, [orgID, navigate]);

  const handleNameChange = (selected: string) => {
    if (selected === "Custom") {
      setShowCustomNameInput(true);
      setName("");
    } else {
      setShowCustomNameInput(false);
      setName(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !organization) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    await postClassroom({
      name: name,
      org_id: organization.id,
      org_name: organization.login,
    })
      .then((createdClassroom) => {
        setSelectedClassroom(createdClassroom);
        navigate("/app/classroom/invite-tas");
      })
      .catch((_) => {
        setError("Failed to create classroom. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Panel title="New Classroom" logo={true}>
      <div className="ClassroomCreation">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Organization name"
              name="organization"
              required
              readOnly
              value={organization ? organization.login : ""}
            />

            {predefinedClassroomNames.length > 0 && (
              <GenericDropdown
                labelText="Classroom name"
                selectedOption={showCustomNameInput ? "Custom" : name}
                loading={false}
                options={predefinedClassroomNames.map(option => ({ value: option, label: option }))}
                onChange={handleNameChange}
              />
            )}

            {(showCustomNameInput || predefinedClassroomNames.length === 0) && (
              <Input
                label="Custom classroom name"
                name="classroom-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            {error && <p className="error">{error}</p>}
            {!organization && (
              <p className="error">
                <Link to="/app/organization/select">
                  Click here to select an organization
                </Link>
                .
              </p>
            )}
            <div className="ClassroomCreation__buttonWrapper">
              <Button variant={classroomExists ? "disabled" : "primary"} type="submit" disabled={classroomExists}>Create Classroom</Button>
              <Button variant="secondary" href="/app/organization/select">
                Select a different organization
              </Button>
            </div>
          </form>
        )}
      </div>
    </Panel>
  );
};

export default ClassroomCreation;
