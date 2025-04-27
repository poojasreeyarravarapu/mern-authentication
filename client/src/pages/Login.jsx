import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from "axios";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContext);

  const [state, setState] = useState('Sign up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Loading state for the button

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);  // Start loading when form is submitted

    try {
      // Set the axios config for credentials for this request
      const axiosConfig = { withCredentials: true };

      let response;

      if (state === 'Sign up') {
        response = await axios.post(`${backendUrl}/api/auth/register`, { name, email, password }, axiosConfig);
      } else {
        response = await axios.post(`${backendUrl}/api/auth/login`, { email, password }, axiosConfig);
      }

      const { data } = response;

      if (data.success) {
        setIsLoggedin(true);
        getUserData();
        navigate('/');  // Redirect to home after successful login/signup
      } else {
        toast.error(data.message);  // Display error message from backend
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");  // Handle errors
    } finally {
      setLoading(false);  // Stop loading after the request is done
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-purple-400'>
      <img onClick={() => navigate('/')} src={assets.logo} alt="" className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer' />
      <div className='bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm'>

        <h2 className='text-3xl font-semibold text-white text-center mb-3'>{state === 'Sign up' ? 'Create account' : 'Login'}</h2>
        <p className='text-center text-sm mb-6'>{state === 'Sign up' ? 'Create your account' : 'Login to your account!'}</p>

        <form onSubmit={onSubmitHandler}>
          {state === 'Sign up' && (
            <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
              <img src={assets.person_icon} alt="" />
              <input onChange={e => setName(e.target.value)} value={name} className='px-2 bg-transparent outline-none text-gray-50' type="text" placeholder='Full Name' required />
            </div>
          )}
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <img src={assets.mail_icon} alt="" />
            <input onChange={e => setEmail(e.target.value)} value={email} className='px-2 bg-transparent outline-none text-gray-50' type="email" placeholder='Email id' required />
          </div>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <img src={assets.lock_icon} alt="" />
            <input onChange={e => setPassword(e.target.value)} value={password} className='px-2 bg-transparent outline-none text-gray-50' type="password" placeholder='Password' required />
          </div>

          <p onClick={() => navigate('/reset-password')} className='mb-4 text-indigo-500 cursor-pointer'>Forgot password?</p>

          <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium cursor-pointer' disabled={loading}>
            {loading ? 'Loading...' : state}
          </button>
        </form>

        {state === 'Sign up' ? (
          <p className='text-gray-400 text-center text-xs mt-4'>Already have an account?{' '}
            <span onClick={() => setState('Login')} className='text-blue-400 cursor-pointer underline'>Login Here</span>
          </p>
        ) : (
          <p className='text-gray-400 text-center text-xs mt-4'>Don't have an account?{' '}
            <span onClick={() => setState('Sign up')} className='text-blue-400 cursor-pointer underline'>Sign up</span>
          </p>
        )}

      </div>
    </div>
  );
}

export default Login;
