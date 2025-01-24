import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
function Popper({children, content}: {children: React.ReactNode, content: string}) {
    return (
        <Tooltip>
            <TooltipTrigger>{children}</TooltipTrigger>
            <TooltipContent>{content}</TooltipContent>
        </Tooltip>
    );
};
export default Popper;