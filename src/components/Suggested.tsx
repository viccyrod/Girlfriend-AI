import React from 'react'
import SuggestedCreator from './SuggestedCreator'
import { user } from '@/dummy_data'

function Suggested() {
  return (
    <div className='flex flex-col gap-3'>
      <h2 className='text-xl font-semibold'>Suggested Creators</h2>
      <div className='flex flex-col gap-3'>
            <SuggestedCreator user={user} /> 
            <SuggestedCreator user={user} />    
            <SuggestedCreator user={user} />    
            <SuggestedCreator user={user} />    

      </div>
    </div>
  )
}

export default Suggested