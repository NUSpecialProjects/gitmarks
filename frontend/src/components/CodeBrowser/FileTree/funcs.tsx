import { FileTreeDirectory, FileTreeFile } from ".";

export const buildTree = (tree1D: IGitTreeNode[]) => {
  let treeDepth = 0;
  const root: IFileTreeNode = {
    type: "tree",
    sha: "",
    name: "",
    path: "",
    diff: null,
    status: "unmodified",
    childNodes: {},
  };
  tree1D.forEach((node) => {
    const fullPath = node.entry.path.split("/");
    let level: IFileTreeNode = root;
    treeDepth = Math.max(treeDepth, fullPath.length);

    let path = "";
    fullPath.forEach((seg, i) => {
      path += "/" + seg;
      if (!(seg in level.childNodes)) {
        level.childNodes[seg] = {
          type: i === fullPath.length - 1 ? node.entry.type : "tree",
          sha: i === fullPath.length - 1 ? node.entry.sha : "",
          name: seg,
          path: path.substring(1),
          diff: i === fullPath.length - 1 ? node.status.diff : null,
          status: node.status.status,
          childNodes: {},
        };
      } else if (
        node.status.status !== "unmodified" &&
        node.status.status !== "renamed"
      ) {
        if (level.childNodes[seg].status == "unmodified") {
          level.childNodes[seg].status = node.status.status;
        } else if (level.childNodes[seg].status !== node.status.status) {
          level.childNodes[seg].status = "modified";
        }
      }

      level = level.childNodes[seg];
    });
  });

  return { root, treeDepth };
};

export const sortTreeNode = (node: IFileTreeNode) => {
  return Object.values(node.childNodes).sort((nodeA, nodeB) => {
    // directories before file
    if (nodeA.type == "tree" && nodeB.type == "blob") return -1;
    // files after directories
    if (nodeA.type == "blob" && nodeB.type == "tree") return 1;
    // sort by alphabetical order afterwards
    return nodeA.name.localeCompare(nodeB.name);
  });
};

// iterate through a tree and render appropriate components
export const renderTree = (
  node: IFileTreeNode,
  depth: number,
  treeDepth: number,
  selectedFile: string,
  selectFileCallback: (node: IFileTreeNode) => void
) => {
  if (node.type === "blob") {
    return (
      <FileTreeFile
        className={selectedFile == node.path ? "FileTreeFile--selected" : ""}
        key={node.path}
        depth={depth}
        name={node.name}
        path={node.path}
        status={node.status}
        onClick={() => {
          selectFileCallback(node);
        }}
      />
    );
  }

  // if not a blob (file), must be a tree (directory)
  return (
    <FileTreeDirectory
      key={node.name}
      name={node.name}
      path={node.path}
      depth={depth}
      treeDepth={treeDepth}
      status={node.status}
    >
      {sortTreeNode(node).map((childNode) =>
        renderTree(
          childNode,
          depth + 1,
          treeDepth,
          selectedFile,
          selectFileCallback
        )
      )}
    </FileTreeDirectory>
  );
};
