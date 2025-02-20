
export default function validateRepoName(name: string): boolean {
  const illegalChars = /[/\\:*?"<>|!~#]/;
  return !illegalChars.test(name);
}

