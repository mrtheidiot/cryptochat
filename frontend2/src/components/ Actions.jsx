import React from "react";

const Actions = ({ actions }) => {

  return (
    // <></>
    <div>
      {actions.map((action, i) => (
        <p key={i}>{action.count}: {action.action}</p>
      ))}
    </div>
  );
};

export default Actions;
