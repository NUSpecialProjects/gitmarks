import React, { ChangeEvent } from 'react';
import '../styles.css';

interface ITemplateRepoDropdownProps {
    repositories: ITemplateRepo[];
    onChange?: (selectedTemplate: ITemplateRepo) => void;
    selectedRepo: ITemplateRepo | null;
    loading: boolean;
}

const PLACEHOLDER_OPTION = 'Select a repository';
const LOADING_OPTION = 'Loading repositories...';
const NO_REPOSITORIES_OPTION = 'No repositories available';

const TemplateRepoDropdown: React.FC<ITemplateRepoDropdownProps> = ({
    onChange,
    repositories,
    selectedRepo,
    loading,
}) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const selectedId = parseInt(event.target.value, 10);
        const selectedRepo = repositories.find((repo) => repo.template_repo_id === selectedId);

        if (onChange && selectedRepo) {
            onChange(selectedRepo);
        }
    };

    const renderOptions = () => {
        if (loading) {
            return (
                <option value="" disabled>
                    {LOADING_OPTION}
                </option>
            );
        } else if (repositories.length === 0) {
            return (
                <option value="" disabled>
                    {NO_REPOSITORIES_OPTION}
                </option>
            );
        }

        return repositories.map((repo) => (
            <option key={repo.template_repo_id} value={repo.template_repo_id}>
                {repo.template_repo_name}
            </option>
        ));
    };

    return (
        <div className="Dropdown__wrapper">
            <label className="Dropdown__label" htmlFor="organization">
                Pick a template repository to use as the starter code
            </label>
            <select
                className="Dropdown"
                value={selectedRepo?.template_repo_id ?? ''}
                onChange={handleChange}
            >
                <option className="Dropdown__option" value="" disabled>
                    {PLACEHOLDER_OPTION}
                </option>
                {renderOptions()}
            </select>
            <div className='Dropdown__caption'>The template repository <b>must</b> be owned by the organization you are in</div>
        </div>
    );
};

export default TemplateRepoDropdown;
