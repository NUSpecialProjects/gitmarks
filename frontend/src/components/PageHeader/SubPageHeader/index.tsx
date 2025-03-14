import React from "react";
import './styles.css';
import '../styles.css';
import { Link } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa6";

const SubPageHeader: React.FC<ISubPageHeader> = ({ pageTitle, pageSubTitle, chevronLink, children }) => {
    return (
        <div className="PageHeader__wrapper">
            <h1 className="SubPageHeader__pageTitle">
                <div className="SubPageHeader__leftSideContents">
                    <Link to={chevronLink}>
                        <FaChevronLeft />
                    </Link>
                    <div className="SubPageHeader__pageTitles">
                    {pageTitle}
                    {
                        pageSubTitle &&
                        <div className="SubPageHeader__pageSubTitle">{pageSubTitle}</div>
                    }
                    </div>
                </div>
                {children &&
                    <div className="SubPageHeader__rightSideContents">
                        {children}
                    </div>}
            </h1>
        </div>
    )
}

export default SubPageHeader;