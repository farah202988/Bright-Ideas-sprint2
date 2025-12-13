import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Acceuil from './pages/Accueil';
import MyIdeas from './pages/MyIdeas'; // ← NOUVEAU
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/accueil" element={<Acceuil />} />
        <Route path="/my-ideas" element={<MyIdeas />} /> {/* ← NOUVELLE ROUTE */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
