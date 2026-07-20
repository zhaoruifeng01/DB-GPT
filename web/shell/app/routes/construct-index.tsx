import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function ConstructIndexRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/construct/app', { replace: true });
  }, [navigate]);
  return null;
}
