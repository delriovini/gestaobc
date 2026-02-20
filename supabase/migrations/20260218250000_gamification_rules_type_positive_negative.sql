-- Permite apenas type 'positive' e 'negative' em gamification_rules (sem alterar colunas)

-- Migra valores antigos para o novo esquema
update public.gamification_rules set type = 'negative' where type = 'penalty';
update public.gamification_rules set type = 'positive' where type in ('bonus', 'neutral');

alter table public.gamification_rules drop constraint if exists gamification_rules_type_check;

alter table public.gamification_rules add constraint gamification_rules_type_check
  check (type in ('positive', 'negative'));

alter table public.gamification_rules alter column type set default 'positive';
