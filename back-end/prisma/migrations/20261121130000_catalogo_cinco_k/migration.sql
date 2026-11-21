-- Reclassifica somente os dois modelos ativos do catalogo de demonstracao.
UPDATE tenis AS t
SET distancia = 'CINCO_K', "updatedAt" = CURRENT_TIMESTAMP
FROM marcas AS m
WHERE m.id = t."marcaId"
  AND t.ativo
  AND t.distancia = 'DEZ_K'
  AND (m.nome, t.modelo, t.foto) IN (
    ('Adidas', 'Adizero Evo SL', '/catalogo/adidas/adizero-evo-sl/01-js4487.jpg'),
    ('New Balance', 'FuelCell Rebel v5', '/catalogo/newbalance/fuelcell-rebel-v5/01-1394596.webp')
  );
