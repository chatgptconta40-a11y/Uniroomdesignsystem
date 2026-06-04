import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { DataTopic, emitDataRefreshMany } from '../lib/dataBus';

/*
  Mapa rota → tópicos a refrescar quando o utilizador navega.
  Cada entrada é testada contra o `pathname` atual; todos os tópicos das
  entradas que correspondem são emitidos (com throttle por tópico).
*/
const ROUTE_TOPICS: Array<{ match: RegExp; topics: DataTopic[] }> = [
  { match: /^\/search/,                  topics: ['properties'] },
  { match: /^\/property\//,              topics: ['properties'] },
  { match: /^\/room\//,                  topics: ['properties'] },
  { match: /^\/accommodation\//,         topics: ['properties'] },
  { match: /^\/favorites/,               topics: ['favorites', 'properties'] },
  { match: /^\/applications/,            topics: ['applications'] },
  { match: /^\/messages/,                topics: ['messages'] },
  { match: /^\/my-home/,                 topics: ['activeHome', 'maintenance'] },
  { match: /^\/verification/,            topics: ['verifications'] },
  { match: /^\/landlord\/listings/,      topics: ['properties'] },
  { match: /^\/landlord\/dashboard/,     topics: ['properties', 'applications'] },
  { match: /^\/landlord\/applications/,  topics: ['applications'] },
  { match: /^\/landlord\/maintenance/,   topics: ['maintenance'] },
  { match: /^\/landlord\/analytics/,     topics: ['properties'] },
  { match: /^\/landlord\/property\//,    topics: ['properties', 'applications'] },
  { match: /^\/admin\/users/,            topics: ['adminUsers'] },
  { match: /^\/admin\/properties/,       topics: ['properties'] },
  { match: /^\/admin\/reports/,          topics: ['reports'] },
  { match: /^\/admin/,                   topics: ['adminUsers', 'reports', 'verifications'] },
];

function topicsForPath(pathname: string): DataTopic[] {
  const acc = new Set<DataTopic>();
  for (const { match, topics } of ROUTE_TOPICS) {
    if (match.test(pathname)) topics.forEach(t => acc.add(t));
  }
  return [...acc];
}

export function RouteDataRefresher() {
  const { pathname } = useLocation();

  // Refetch quando muda de rota.
  useEffect(() => {
    emitDataRefreshMany(topicsForPath(pathname));
  }, [pathname]);

  // Refetch quando o separador volta a ficar visível.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) return;
      emitDataRefreshMany(topicsForPath(window.location.pathname));
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return null;
}
