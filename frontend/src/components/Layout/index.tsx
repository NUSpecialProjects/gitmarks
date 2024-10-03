import { Banner, NavStack } from "../components"
import { Outlet } from "react-router-dom"

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