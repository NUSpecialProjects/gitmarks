import React from "react";
import './styles.css';
import { IPageHeader } from "./types";

const PageHeader: React.FC<IPageHeader> = ({ pageTitle }) => {
    return (
        <div className="PageHeader__wrapper">
            <h1 className="PageHeader__pageTitle">
                {pageTitle}
            </h1>
        </div>
    )
}

export default PageHeader;