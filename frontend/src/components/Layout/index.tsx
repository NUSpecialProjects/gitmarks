import { Outlet } from "react-router-dom"
import Banner from "../Banner";
import NavStack from "../NavStack";

const Layout: React.FC = () => {
    return (
    <div className="app">
    <Banner />
    <div className="body">
        <NavStack/>
        <Outlet />
      </div>     
    </div>
    )
  }

  export default Layout;