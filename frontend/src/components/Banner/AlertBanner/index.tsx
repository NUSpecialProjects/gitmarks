/* eslint-disable */
import React, { useEffect, useState } from "react";
import { activateSemester, deactivateSemester, getOrgSemesters } from "@/api/semesters";
import "./styles.css";
import { Semester } from "@/types/semester";

interface AlertBannerProps {
    semester: Semester;
    onActivate: (newSemester: Semester) => void;
}

enum SemesterError {
    API_ERROR = "Failed to modify class. Please try again.",
    ALREADY_ACTIVE = "A class is already active. Please deactivate it first.",
    MULTIPLE_ACTIVE = "Multiple classes are active. Please deactivate all but one.",
    NOT_ACTIVE = "This class is not active. Activate it to use this class.",
}

const AlertBanner: React.FC<AlertBannerProps> = ({ semester, onActivate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSemester, setActiveSemester] = useState<Semester | null>(null);

    useEffect(() => {
        const checkErrors = async () => {
            const orgSemesters: Semester[] = (await getOrgSemesters(semester.org_id)).semesters;
            console.log("ORG SEMESTERS: ", orgSemesters);
            const activeSemesters = orgSemesters.filter((s: Semester) => s.active);
            if (activeSemesters.length > 1) {
                setError(SemesterError.MULTIPLE_ACTIVE);
                return;
            }
            const otherActiveSemester = activeSemesters.find((s: Semester) => s.id !== semester.id);
            if (otherActiveSemester) {
                setActiveSemester(otherActiveSemester);
                setError(SemesterError.ALREADY_ACTIVE);
                return;
            }
            if (!semester.active) {
                setError(SemesterError.NOT_ACTIVE);
                return;
            }
        };
        void checkErrors();
    }, [semester]);

    const handleActivate = async () => {
        setLoading(true);
        setError(null);
        try {
            const newSemester = await activateSemester(semester.id);
            onActivate(newSemester);
        } catch (err) {
            console.log(err);
            setError(SemesterError.API_ERROR);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        setLoading(true);
        setError(null);
        try {
            const newSemester = await deactivateSemester(semester.id);
            onActivate(newSemester);
        } catch (err) {
            console.log(err);
            setError(SemesterError.API_ERROR);
        } finally {
            setLoading(false);
        }
    }

    const handleClick = () => {
        handleActivate().catch((err: unknown) => {
            console.error("Error in handleActivate:", err);
        });
    };

    const handleNavigateToActiveSemester = () => {
        if (activeSemester && activeSemester.id) {
            onActivate(activeSemester);
            window.location.reload(); // there is probably a better way to refresh the contents of the screen
        }
    };

    return (
        error && (
        <div className="inactive-class-banner">
            {error && <p className="error">{error}</p>}
            {error === SemesterError.ALREADY_ACTIVE && activeSemester && (
                <button onClick={handleNavigateToActiveSemester}>
                    Switch to Active Semester
                </button>
            )}
            {semester.active && error === SemesterError.MULTIPLE_ACTIVE && (
                <button onClick={handleDeactivate}>
                    Deactivate this semester
                </button>
            )}
            {(error === SemesterError.API_ERROR || error === SemesterError.NOT_ACTIVE || (!semester.active && error === null)) && (
            <button onClick={handleClick} disabled={loading}>
                {loading ? "Activating..." : "Activate Class"}
            </button>
            )}
        </div>
        )
    );
}

export default AlertBanner;