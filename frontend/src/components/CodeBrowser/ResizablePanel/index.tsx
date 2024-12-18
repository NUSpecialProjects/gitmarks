import { ResizableBox, ResizeHandle } from "react-resizable";
import { useState, useRef, useEffect } from "react";

import "./styles.css";

interface IResizablePanel extends React.HTMLProps<HTMLDivElement> {
  border: "left" | "right" | "both";
  minWidth?: number;
  zIndex?: number;
}

const border2dir = {
  left: ["w"],
  right: ["e"],
  both: ["e, w"],
};

const ResizablePanel: React.FC<IResizablePanel> = ({
  children,
  className,
  border,
  minWidth = 230,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [threshold, setThreshold] = useState(0);

  const wrapper = useRef<HTMLDivElement>(null);
  const self = useRef<ResizableBox>(null);

  useEffect(() => {
    // when resizable panel renders, calculate its "threshold", meaning the point at which
    // the panel should snap to when under a minimum width
    if (!wrapper.current) return;
    const bound = wrapper.current?.children[0].getBoundingClientRect();
    setThreshold(bound.x + (border == "right" ? minWidth : 0));
  }, [wrapper]);

  return (
    <div className="ResizablePanel__wrapper" ref={wrapper}>
      <ResizableBox
        ref={self}
        className={`ResizablePanel ${collapsed ? "ResizablePanel--collapsed" : ""}${className ?? ""}`}
        width={minWidth}
        height={Infinity}
        resizeHandles={border2dir[border] as ResizeHandle[]}
        minConstraints={[4, 0]}
        onResize={(e, { size }) => {
          if (!self.current) return;

          // check if mouse is halfway between the resizable panel edge-to-edge
          const mouseX = (e as unknown as MouseEvent).clientX;
          const w = size.width;
          if (
            (border2dir[border].includes("w") && mouseX >= threshold) ||
            (border2dir[border].includes("e") && mouseX <= threshold)
          ) {
            // override default resizing behavior if so
            // (default being normal resizing)
            // (overriden effect being the panel snapping to a collapsed state or minimum width expanded state)
            if (
              (border2dir[border].includes("e") &&
                mouseX <= threshold - minWidth / 2) ||
              (border2dir[border].includes("w") &&
                mouseX >= threshold + minWidth / 2)
            ) {
              // collapse panel if mouse under halfway
              self.current.setState({ width: 4 });
            } else {
              // expand panel if mouse over halfway
              self.current.setState({ width: minWidth });
            }
          }
          setCollapsed(w == 4);
        }}
      >
        <>{children}</>
      </ResizableBox>
    </div>
  );
};

export default ResizablePanel;
