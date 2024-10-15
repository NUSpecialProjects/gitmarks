import "./styles.css";
import UserGroupCard from "@/components/UserGroupCard";
import { Table, TableRow, TableCell } from "@/components/Table/index.tsx";

const Dashboard: React.FC = () => {
    return (
        <div className="Dashboard">
            <div className="Dashboard__classroomDetailsWrapper">
                <UserGroupCard label="Professors" number={1} />
                <UserGroupCard label="TAs" number={12} />
                <UserGroupCard label="Students" number={38} />
            </div>
            <div className="Dashboard__assignmentsWrapper">
            <h2 style={{ marginBottom: 0 }}>Active Assignments</h2>
                <Table cols={3}>
                    <TableRow style={{ borderTop: "none" }}>
                        <TableCell>Assignment Name</TableCell>
                        <TableCell>Released</TableCell>
                        <TableCell>Due Date</TableCell>
                    </TableRow>
                    {Array.from({ length: 1 }).map((_, i: number) => (
                        <TableRow key={i} className="Assignment__submission">
                            <TableCell> <a href="#" className="Dashboard__assignmentLink">Assignment 1</a></TableCell>
                            <TableCell>5 Sep, 9:00 AM</TableCell>
                            <TableCell>15 Sep, 11:59 PM</TableCell>
                        </TableRow>
                    ))}
                </Table>

                <h2 style={{ marginBottom: 0 }}>Inactive Assignments</h2>
                <Table cols={3}>
                    <TableRow style={{ borderTop: "none" }}>
                        <TableCell>Assignment Name</TableCell>
                        <TableCell>Released</TableCell>
                        <TableCell>Due Date</TableCell>
                    </TableRow>
                    {Array.from({ length: 2 }).map((_, i: number) => (
                        <TableRow key={i} className="Assignment__submission">
                            <TableCell> <a href="#" className="Dashboard__assignmentLink">Assignment 1</a></TableCell>
                            <TableCell>5 Sep, 9:00 AM</TableCell>
                            <TableCell>15 Sep, 11:59 PM</TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>
        </div>
    )
}

export default Dashboard;