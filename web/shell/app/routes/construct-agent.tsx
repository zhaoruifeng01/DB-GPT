import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function ConstructAgentRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/construct/dbgpts', { replace: true });
  }, [navigate]);
  return null;
}
