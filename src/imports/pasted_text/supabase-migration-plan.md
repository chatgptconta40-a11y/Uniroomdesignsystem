Objetivo:
Iniciar a migração da UniRoom para Supabase de forma controlada, sem redesenhar a aplicação e sem alterar a UI existente desnecessariamente.

Contexto:
A UniRoom é uma plataforma de alojamento universitário com 3 tipos de utilizador:
- student
- landlord
- admin

Neste momento a app usa mocks e localStorage para autenticação, perfis e dados. O objetivo deste Sprint é substituir apenas a autenticação e a base de perfis por Supabase, mantendo o resto da app funcional com os mocks atuais.

Regras obrigatórias:
1. Não redesenhar a aplicação.
2. Não remover páginas existentes.
3. Não alterar rotas existentes sem necessidade.
4. Não migrar ainda casas, quartos, mensagens, favoritos, candidaturas ou admin para Supabase.
5. Manter os mocks atuais para tudo o que não pertence a Auth/Profile.
6. Fazer mudanças pequenas, estáveis e fáceis de validar.
7. Não quebrar a navegação atual.
8. Manter os roles:
   - student
   - landlord
   - admin
9. A app deve continuar a funcionar mesmo que ainda existam dados mock noutras áreas.

Tarefa 1: configurar Supabase
Criar/configurar o cliente Supabase usando as variáveis de ambiente disponíveis no Figma Make/Supabase:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Criar um ficheiro de cliente Supabase reutilizável, por exemplo:
src/lib/supabase.ts

Tarefa 2: criar schema Supabase
Criar as tabelas necessárias para este Sprint:

Tabela profiles:
- id uuid primary key references auth.users(id) on delete cascade
- email text not null
- full_name text not null
- role text not null check role in ('student', 'landlord', 'admin')
- verified boolean default false
- onboarding_completed boolean default false
- created_at timestamp with time zone default now()
- updated_at timestamp with time zone default now()

Tabela student_profiles:
- user_id uuid primary key references profiles(id) on delete cascade
- age integer
- gender text
- course text
- institution text
- year_of_study integer
- hometown text
- bio text
- languages text[]
- bedtime text
- wakeup_time text
- schedule text
- cleanliness integer
- cleaning_frequency text
- noise_tolerance integer
- music_volume text
- guests_frequency text
- guests_acceptance integer
- smoking boolean
- pets boolean
- cooking text
- personality text
- social_preference text
- max_budget integer
- preferred_cities text[]
- max_distance_from_university numeric
- move_in_date date
- stay_duration integer
- room_type text
- amenities jsonb
- completeness jsonb
- created_at timestamp with time zone default now()
- updated_at timestamp with time zone default now()

Tabela landlord_profiles:
- user_id uuid primary key references profiles(id) on delete cascade
- phone_number text
- company_name text
- tax_number text
- verification_status text default 'pending'
- created_at timestamp with time zone default now()
- updated_at timestamp with time zone default now()

Tarefa 3: Row Level Security
Ativar RLS nas tabelas:
- profiles
- student_profiles
- landlord_profiles

Criar políticas:
- cada utilizador pode ler o seu próprio profile
- cada utilizador pode atualizar o seu próprio profile
- cada estudante pode ler/editar apenas o seu student_profile
- cada senhorio pode ler/editar apenas o seu landlord_profile
- admins podem ler todos os profiles

Se for necessário, criar uma função helper para verificar role admin com segurança.

Tarefa 4: substituir AuthContext
Atualizar AuthContext.tsx para usar Supabase Auth:
- login com email/password
- register com email/password
- logout
- sessão persistente
- recuperar user atual ao carregar a app
- carregar o profile correspondente da tabela profiles
- expor o mesmo formato de user que a aplicação já usa tanto quanto possível, para evitar quebrar componentes existentes

O AuthContext deve continuar a devolver:
- user
- loading
- login
- register
- logout
- isAuthenticated

Tarefa 5: registo
No registo:
- ao criar conta Supabase Auth, criar também linha em profiles
- se role = student, criar linha vazia em student_profiles
- se role = landlord, criar linha vazia em landlord_profiles
- depois do registo:
  - student deve ir para onboarding
  - landlord deve ir para dashboard do senhorio
  - admin deve ir para admin

Tarefa 6: onboarding
Nesta sprint, não redesenhar o onboarding.
Apenas garantir que no final do onboarding:
- os dados são guardados em student_profiles
- profiles.onboarding_completed passa para true
- a compatibilidade só deve aparecer quando onboarding_completed = true e completeness.overall >= 80

Tarefa 7: compatibilidade
Atualizar a função hasCompletedCompatibilityProfile para usar Supabase ou o estado carregado do perfil real.
Enquanto a app ainda tiver mocks de quartos, os scores mock podem continuar, mas só devem aparecer para estudantes com onboarding completo.

Tarefa 8: manter fallback seguro
Se por algum motivo o profile ainda não existir para um user autenticado, criar automaticamente um profile mínimo com:
- id
- email
- full_name
- role
- verified false
- onboarding_completed false

Tarefa 9: validação final
Depois das alterações, validar estes fluxos:
1. criar conta estudante
2. estudante é enviado para onboarding
3. completar onboarding
4. estudante vê dashboard
5. estudante vê compatibilidade apenas depois do onboarding
6. criar conta senhorio
7. senhorio entra no dashboard senhorio
8. login/logout funciona
9. rotas protegidas continuam a respeitar roles
10. páginas públicas continuam abertas:
   - /
   - /room/:id
   - /property/:id
   - /terms
   - /privacy

Importante:
Não migrar ainda propriedades, quartos, mensagens, favoritos, candidaturas ou admin para Supabase.
Este Sprint é apenas Auth + Profiles + Roles + Onboarding base.