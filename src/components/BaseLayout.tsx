import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'
import React, { ReactNode } from 'react'
import Sidebar from './Sidebar'

const BaseLayout = async ({children,renderRightPanel=true}:{children:ReactNode, renderRightPanel?:boolean}) => {
    const {isAuthenticated} = getKindeServerSession()
    //client componenets => interactions
    // server components => back end, auth
    //any page that uses this layout requires auth
    if(!(await isAuthenticated)) {
        return redirect("/")
    }
  return (
    <div className='flex max-w-2x1 lg:max-w-7x1 mx auto releative'>
   <Sidebar />
   
   <div className="w-full lg:w-3/5 flex flex-col border-r"> {children}</div>
   {renderRightPanel && "Suggested Products"}
    </div>
  )
}

export default BaseLayout