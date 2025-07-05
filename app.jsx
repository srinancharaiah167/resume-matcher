import React, { useState } from 'react';
import ResumeATS from './ResumeATS';
import auth from './auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <>
      {isAuthenticated
        ? <ResumeATS />
        : <auth onAuthSuccess={() => setIsAuthenticated(true)} />
      }
    </>
  );
}
