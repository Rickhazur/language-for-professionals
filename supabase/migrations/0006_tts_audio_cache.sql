-- Cache de audio generado por Text-to-Speech: evita volver a llamar al
-- proveedor (costo + latencia) cada vez que un estudiante reproduce la misma
-- frase de referencia. Una fila por (texto, idioma), con el audio ya subido
-- a Storage.

create table public.tts_audio_cache (
  id uuid primary key default gen_random_uuid(),
  text_hash text not null,
  text text not null,
  language language_code not null,
  audio_url text not null,
  created_at timestamptz not null default now(),
  unique (text_hash, language)
);

alter table public.tts_audio_cache enable row level security;

-- El audio de referencia no es sensible; cualquier usuario logueado puede
-- leer el cache. Solo la Edge Function (service role) escribe en esta tabla.
create policy "Authenticated users can read audio cache" on public.tts_audio_cache
  for select using (auth.uid() is not null);

-- Bucket público: el cliente reproduce el audio directo desde la URL pública,
-- sin necesidad de URLs firmadas para un archivo no sensible.
insert into storage.buckets (id, name, public)
values ('reference-audio', 'reference-audio', true)
on conflict (id) do nothing;
