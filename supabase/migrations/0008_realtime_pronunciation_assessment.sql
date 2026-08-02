-- 0007 asumía Batch Transcription (subir a Storage, Azure descarga por URL).
-- El tier gratuito de Azure Speech no soporta Batch Transcription (requiere
-- Standard/S0), así que assess-pronunciation pasó al endpoint de audio corto
-- síncrono: el cliente manda el audio en la misma petición, sin pasar por
-- Storage. La política ya no aplica (el bucket se borra aparte, vía la
-- Storage API, ya que storage.objects/buckets no aceptan DELETE por SQL).

drop policy if exists "Students manage own recordings" on storage.objects;
