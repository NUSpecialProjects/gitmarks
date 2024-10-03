

import { StubProps } from "../../pages/Stub";

// Define the expected structure of the API response
interface ApiStub {
  id: string;
  content: string;
}

// Function to fetch stubs from the API
export const fetchStubs = async (): Promise<StubProps[]> => {
  const apiDomain: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

  if (!apiDomain) {
    throw new Error(
      "PUBLIC_API_DOMAIN is not defined in the environment variables."
    );
  }

  const response = await fetch(`https://${String(apiDomain)}/tests/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(response.headers.get("content-type"))

  if (!response.ok) {
    throw new Error("Failed to fetch stubs");
  }
  
  console.log(response)

  // Explicitly define the type for the data returned from the API
  const data: ApiStub[] = await response.json() as ApiStub[]


  // Ensure proper mapping of API response to StubProps
  const stubs: StubProps[] = data.map((stub: ApiStub) => ({
    stub_id: stub.id,            // Mapping API field 'id' to 'stub_id'
    stub_content: stub.content,  // Mapping API field 'content' to 'stub_content'
  }));

  return stubs;
};
