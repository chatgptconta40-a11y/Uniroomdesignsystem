import { useEffect } from 'react';

/*
  Event-bus simples para refetch de dados por "tópico".

  Porquê isto em vez de um RouteDataRefresher que conhece todos os hooks:
  hooks (useApplications, useMaintenance, etc.) são instanciados dentro das
  páginas, não num provider global. Não há forma de o RouteDataRefresher
  chamar a função `refresh` deles diretamente. Em vez disso, cada hook regista
  uma subscrição num tópico (`useDataBusRefresh`) e o RouteDataRefresher
  emite os tópicos relevantes quando a rota muda.

  Throttle por tópico evita rajadas de pedidos quando o utilizador volta
  rapidamente a uma página.
*/

export type DataTopic =
  | 'properties'
  | 'applications'
  | 'messages'
  | 'maintenance'
  | 'payments'
  | 'reports'
  | 'verifications'
  | 'activeHome'
  | 'adminUsers'
  | 'favorites'
  | 'notifications';

const THROTTLE_MS = 2500;

const lastEmit = new Map<DataTopic, number>();
const bus = new EventTarget();

function eventName(topic: DataTopic): string {
  return `uniroom:data-refresh:${topic}`;
}

export function emitDataRefresh(topic: DataTopic, force = false): boolean {
  const now = Date.now();
  const last = lastEmit.get(topic) ?? 0;
  if (!force && now - last < THROTTLE_MS) return false;
  lastEmit.set(topic, now);
  bus.dispatchEvent(new CustomEvent(eventName(topic)));
  return true;
}

export function emitDataRefreshMany(topics: Iterable<DataTopic>, force = false): void {
  for (const topic of topics) emitDataRefresh(topic, force);
}

export function useDataBusRefresh(
  topic: DataTopic | DataTopic[],
  refresh: () => void | Promise<void>,
): void {
  useEffect(() => {
    const topics = Array.isArray(topic) ? topic : [topic];
    const handler = () => { void refresh(); };
    topics.forEach(t => bus.addEventListener(eventName(t), handler));
    return () => {
      topics.forEach(t => bus.removeEventListener(eventName(t), handler));
    };
  }, [Array.isArray(topic) ? topic.join('|') : topic, refresh]);
}
