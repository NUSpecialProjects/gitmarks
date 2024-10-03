import { FaTachometerAlt, FaStream, FaUsers, FaCog } from "react-icons/fa";
import { Link } from "react-router-dom";

const NavStack: React.FC = () => {
  const navItems = [
    { name: "Dashboard", dest: "/dashboard", Icon: FaTachometerAlt },
    { name: "Grading", dest: "/grading", Icon: FaStream },
    { name: "Assignments", dest: "/assignments", Icon: FaUsers },
    { name: "Settings", dest: "/settings", Icon: FaCog },
    {name: "Stub", dest: "/stub", Icon: FaCog}
  ];

  return (
    <div className="side-banner">
      {navItems.map((item, index) => (
        <Link key={index} to={item.dest} className="nav-link">
          <item.Icon /> {item.name}
        </Link>
      ))}
    </div>
  );
};

export default NavStack;