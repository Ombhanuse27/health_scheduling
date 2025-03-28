import React from 'react'
import LoginForm from './LoginForm'
import { Nav } from 'react-bootstrap'
import NavbarLink from '../Navbar/NavbarLink'

const login = () => {
  return (
    <>
    <NavbarLink />
    {/* <div className='mt-10'> */}
      <LoginForm />
      {/* </div> */}
    </>
  )
}

export default login
