import React, { useState } from "react";
import TokenApplyPage from "../Generic";
import { useAssignmentToken } from "@/api/assignments";
import Button from "@/components/Button";

const AcceptAssignmentPage: React.FC = () => {
  const [repoURL, setRepoURL] = useState<string | null>(null);

  return (
    <TokenApplyPage<IAssignmentAcceptResponse>
      useTokenFunction={async (token: string) => {
        return await useAssignmentToken(token);
      }}
      successCallback={(response: IAssignmentAcceptResponse) => {
        setRepoURL(response.repo_url);
      }}
      loadingMessage="Accepting assignment..."
      successMessage={(response: IAssignmentAcceptResponse) => response.message}
    >
      {repoURL && (
        <Button variant="primary" href={repoURL}>
          View your assignment repository
        </Button>
      )}
    </TokenApplyPage>
  );
};

export default AcceptAssignmentPage;