import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';

export default function Signup() {
  const { authenticate, errorMessage, setErrorMessage, setIsRegistering, isAuthenticated, isAuthenticating } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!")
      return
    }

    try {
      await authenticate("register", email, password, name);
      navigate("/dashboard"); // Redirect to dashboard after signup
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Sign Up</h2>
        {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
        <form onSubmit={handleSubmit}>
          <Input 
            label="Full Name" 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <Input 
            label="Confirm Password" 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
          />
          <button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            {isAuthenticating ? "Authenticating..." : "Signup"}
          </button>
        </form>
        <p className="mt-4 text-gray-600">
          Already have an account? 
          <span 
            className="text-green-600 cursor-pointer hover:underline" 
            onClick={() => {
              navigate('/login')
              setIsRegistering(false)
              setErrorMessage("")
            }}
          >
            {' '}Login
          </span>
        </p>
      </div>
    </div>
  );
};