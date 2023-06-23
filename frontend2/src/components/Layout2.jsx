import { Outlet } from "react-router"
import { useState } from "react"
import Actions from "./ Actions"


const Layout2 = ({actions}) => {
  return (
    <div className="layout2_main">
        <div>
            <Outlet />
        </div>
        <div>
            <Actions actions={actions}/>
        </div>
    </div>
  )
}

export default Layout2