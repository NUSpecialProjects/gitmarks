import React, { useEffect, useState } from 'react';
import GenericDropdown from '@/components/Dropdown';
import Input from '@/components/Input';
import { getRepoFromGithub } from '@/api/github';
import useDebounce from '@/hooks/useDebounce';
import ValidationIndicator from '@/components/ValidationIndicator';

interface StarterCodeDetailsProps extends IStepComponentProps<IAssignmentFormData> {
  templateRepos: ITemplateRepo[];
  isLoading: boolean;
}

const StarterCodeDetails: React.FC<StarterCodeDetailsProps> = ({ data, onChange, templateRepos, isLoading }) => {
  const [useCustomRepo, setUseCustomRepo] = useState(false);
  const [repoOwner, debouncedRepoOwner, setRepoOwner] = useDebounce('', 250);
  const [repoName, debouncedRepoName, setRepoName] = useDebounce('', 250);
  const [repoID, setRepoID] = useState<number | null>(null);
  const [loadingRepo, setLoadingRepo] = useState(false);

  const formattedOptions = templateRepos.map(repo => repo.template_repo_name);

  const selectedOption = data.templateRepo ? data.templateRepo.template_repo_name : null;

  const handleDropdownChange = (selected: string) => {
    const selectedRepo = templateRepos.find(repo => repo.template_repo_name === selected);
    if (selectedRepo) {
      setRepoOwner(selectedRepo.template_repo_owner);
      setRepoName(selectedRepo.template_repo_name);
      onChange({ templateRepo: selectedRepo });
    }
  };

  const handleCustomRepoChange = (field: 'owner' | 'name', value: string) => {
    if (field === 'owner') {
      setRepoOwner(value);
    } else {
      setRepoName(value);
    }
  };

  useEffect(() => {
    if (debouncedRepoOwner && debouncedRepoName) {
      setLoadingRepo(true);
      getRepoFromGithub(debouncedRepoOwner, debouncedRepoName).then(repository => {
        setRepoID(repository.id);
        onChange({ templateRepo: {
          template_repo_name: debouncedRepoName,
          template_repo_owner: debouncedRepoOwner,
          template_repo_id: repository.id
        } });
      })
      .catch(() => {
        onChange({ templateRepo: null });
        setRepoID(null);
      })
      .finally(() => {
        setLoadingRepo(false);
      });
    }
  }, [debouncedRepoOwner, debouncedRepoName]);

  const repoLink = repoOwner && repoName ? `https://github.com/${repoOwner}/${repoName}` : '';

  return (
    <div className="CreateAssignmentForms">
      <h2 className="CreateAssignmentForms__header">Starter Code Repository</h2>
      <div>
        <div className="CreateAssignmentForms__templateSelection">
          <GenericDropdown
            options={formattedOptions.map(option => ({ value: option, label: option }))}
            onChange={handleDropdownChange}
            selectedOption={selectedOption}
            loading={isLoading}
            labelText="Pick a repository to use as the starter code"
            captionText="Choose from your organization's template repositories"
            disabled={useCustomRepo}
          />
        </div>
        <label className="CreateAssignmentForms__checkbox">
          Or use a different repository:
          <input
            type="checkbox"
            checked={useCustomRepo}
            onChange={(e) => setUseCustomRepo(e.target.checked)}
          />
        </label>

        <div className="CreateAssignmentForms__repoInfo">
          <div className="CreateAssignmentForms__repoFields">
            <Input
              label="Repository Owner"
              name="repo-owner"
              required
              value={repoOwner}
              onChange={(e) => handleCustomRepoChange('owner', e.target.value)}
              disabled={!useCustomRepo}
            />
            <Input
              label="Repository Name"
              name="repo-name"
              required
              value={repoName}
              onChange={(e) => handleCustomRepoChange('name', e.target.value)}
              disabled={!useCustomRepo}
            />
          </div>
          <div className="CreateAssignmentForms__repoLink">
            <span>{"Repository Link:"}</span> {repoLink ? (
              <a 
                href={repoID ? repoLink : undefined} 
                target="_blank" 
                rel="noopener noreferrer"
                className={!repoID ? 'disabled-link' : ''}
              >
                {repoLink}
              </a>
            ) : 'No repository selected'}
            {(repoOwner && repoName) && (
              <div className="CreateAssignmentForms__repoValidationIndicator">
                <ValidationIndicator
                  isLoading={loadingRepo}
                  isValid={!!repoID}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StarterCodeDetails;
