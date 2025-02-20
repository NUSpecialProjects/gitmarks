export default function validateRepoName(name: string): boolean {
    if (!name) {
        return false;
    }
    // Only allow alphanumeric characters and hyphens
    const validChars = /^[a-zA-Z0-9-]+$/;
    // Convert spaces to hyphens before testing
    const processedName = name.replace(/\s/g, '-');
    return validChars.test(processedName);
}

