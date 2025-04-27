import React from 'react'
import { Route, Routes } from "react-router-dom";
import Home from './pages/Home';
import Login from './pages/Login';
import EmailVerify from './pages/EmailVerify';
import ResetPassword from './pages/ResetPassword';
import { ToastContainer} from 'react-toastify';

const App = () => {
  return (
    <div className='min-h-screen'>  
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/email-verify' element={<EmailVerify/>} />
        <Route path='/reset-password' element={<ResetPassword/>} />
        <Route path='*' element={<h1 className='text-white'>404 - Page Not Found</h1>} />
      </Routes>
    </div>
  )
}

export default App
