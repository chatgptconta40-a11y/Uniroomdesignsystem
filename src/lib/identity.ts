const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSupabaseUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export type ApplicationIdsCheck =
  | { ok: true }
  | { ok: false; reason: string };

export function validateApplicationIds(args: {
  userId?: string;
  landlordId?: string;
  propertyId?: string;
  roomId?: string;
}): ApplicationIdsCheck {
  if (!isSupabaseUuid(args.userId)) {
    return { ok: false, reason: 'Sessão inválida. Faz logout e login novamente.' };
  }
  if (!isSupabaseUuid(args.landlordId)) {
    return {
      ok: false,
      reason: 'Este anúncio ainda não está disponível para candidatura. Pede ao senhorio para republicá-lo.',
    };
  }
  if (!args.propertyId) {
    return { ok: false, reason: 'Anúncio sem identificador. Tenta novamente.' };
  }
  if (args.userId === args.landlordId) {
    return { ok: false, reason: 'Não te podes candidatar ao teu próprio anúncio.' };
  }
  return { ok: true };
}
