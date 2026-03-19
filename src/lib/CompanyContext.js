import { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      const res = await fetch('/api/board/companies');
      const data = await res.json();
      setCompanies(data);
      if (data.length > 0 && !activeCompany) {
        setActiveCompany(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <CompanyContext.Provider value={{ companies, activeCompany, setActiveCompany, isLoading, refetchCompanies: fetchCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}
