-- Une seule offre active à la fois.
-- Jusqu'ici la règle ne tenait que par la transaction dans activateOffer().
-- Postgres sait l'imposer structurellement : un index unique partiel rend
-- l'état "deux offres actives" impossible à écrire, quelle que soit la voie
-- d'écriture (app, seed, psql, migration future).
CREATE UNIQUE INDEX "Offer_one_active_at_a_time"
  ON "Offer" ("isActive")
  WHERE "isActive" = true;
