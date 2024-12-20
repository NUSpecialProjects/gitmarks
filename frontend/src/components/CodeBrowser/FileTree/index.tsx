import { useContext, useEffect, useState } from "react";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import SimpleBar from "simplebar-react";

import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { GraderContext } from "@/contexts/grader";
import { getFileTree } from "@/api/grader";
import { buildTree, renderTree, sortTreeNode } from "./funcs";
import ResizablePanel from "../ResizablePanel";

import "./styles.css";

/****************
 * TREE COMPONENT
 ****************/
export const FileTree: React.FC<IFileTree> = ({ selectFileCallback }) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { assignment, studentWork } = useContext(GraderContext);

  const [gitTree, setGitTree] = useState<IGitTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [root, setRoot] = useState<IFileTreeNode | null>(null);
  const [treeDepth, setTreeDepth] = useState(0);

  // fetch git tree from student assignment repo
  useEffect(() => {
    if (!selectedClassroom || !assignment || !studentWork) return;

    getFileTree(
      selectedClassroom.id,
      Number(assignment.id),
      Number(studentWork.student_work_id)
    )
      .then((resp) => {
        setGitTree(resp);
      })
      .catch((_: unknown) => {
        setGitTree([]);
      });
  }, []);

  useEffect(() => {
    if (gitTree.length == 0) {
      setRoot(null);
      setTreeDepth(0);
      setSelectedFile("");
      return;
    }
    const { root, treeDepth } = buildTree(gitTree);
    setRoot(root);
    setTreeDepth(treeDepth);
  }, [gitTree]);

  return (
    <ResizablePanel border="right" minWidth={150}>
      <div className="FileTree__head">Files</div>
      <SimpleBar className="FileTree__body scrollable">
        <>
          {root &&
            sortTreeNode(root).map((node) =>
              renderTree(node, 0, treeDepth, selectedFile, (n) => {
                setSelectedFile(n.path);
                selectFileCallback(n);
              })
            )}
        </>
      </SimpleBar>
    </ResizablePanel>
  );
};

/*********************
 * DIRECTORY COMPONENT
 *********************/
export const FileTreeDirectory: React.FC<IFileTreeDirectory> = ({
  name,
  depth,
  status,
  treeDepth,
  children,
  className,
  ...props
}) => {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div
      className={"FileTreeDirectory" + (className ? " " + className : "")}
      {...props}
    >
      <div
        className={"FileTree__nodeName FileTree__nodeName--" + status}
        style={{
          paddingLeft: (depth * 15 + 10).toString() + "px",
          top: (depth * 24).toString() + "px",
          zIndex: (treeDepth - depth) * 2,
        }}
        onClick={() => {
          setCollapsed(!collapsed);
        }}
      >
        {collapsed ? <FaChevronRight /> : <FaChevronDown />} <span>{name}</span>
      </div>
      <div
        className="FileTreeDirectory__bars"
        style={{
          marginLeft: (depth * 15 + 15).toString() + "px",
          zIndex: (treeDepth - depth) * 2 - 1,
        }}
      />
      <div
        className={
          "FileTreeDirectory__children" +
          (collapsed ? " FileTreeDirectory--collapsed" : "")
        }
      >
        {children}
      </div>
    </div>
  );
};

/****************
 * FILE COMPONENT
 ****************/
export const FileTreeFile: React.FC<IFileTreeFile> = ({
  name,
  path,
  status,
  depth,
  className,
  ...props
}) => {
  return (
    <div
      className={"FileTreeFile" + (className ? " " + className : "")}
      style={{ paddingLeft: (depth * 15 + 10).toString() + "px" }}
      {...props}
    >
      <span
        className={"FileTree__nodeName FileTree__nodeName--" + status}
        data-path={path}
      >
        {name}
      </span>
    </div>
  );
};

/*const ResizeHandle = forwardRef<HTMLDivElement, IResizeHandle>(
  ({ zIndex }, ref) => {
    return <div ref={ref} className="ResizeHandle" style={{ zIndex }} />;
  }
);*/

export default FileTree;
