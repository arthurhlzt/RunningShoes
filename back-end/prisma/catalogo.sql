-- Running Shoes: catálogo de demonstração com 18 modelos e três cores cada.
-- A numeração de demonstração é 38–43, com cinco unidades iniciais por cor e tamanho.
-- Preços, estoque e peso de referência são dados de demonstração, não uma oferta de fornecedores.
BEGIN;

LOCK TABLE tenis IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE novo_catalogo ON COMMIT DROP AS
SELECT * FROM (VALUES
  ('Olympikus', 'Corre 5', 599.99, 'UNISSEX'::"Genero", 'ASFALTO'::"Terreno", 'DEZ_K'::"Distancia", 8, 217, '/catalogo/olympikus/corre-5/01.png', '{"Bege / preto / amarelo": "/catalogo/olympikus/corre-5/01.png", "Preto e cinza": "/catalogo/olympikus/corre-5/02.jpg", "Branco e verde": "/catalogo/olympikus/corre-5/03.jpg"}'::jsonb),
  ('Olympikus', 'Corre Turbo', 699.99, 'UNISSEX'::"Genero", 'ASFALTO'::"Terreno", 'DEZ_K'::"Distancia", 8, 234, '/catalogo/olympikus/corre-turbo/01.png', '{"Branco / preto": "/catalogo/olympikus/corre-turbo/01.png", "Preto": "/catalogo/olympikus/corre-turbo/02.jpg", "Azul royal / verde": "/catalogo/olympikus/corre-turbo/03.jpg"}'::jsonb),
  ('Olympikus', 'Corre Trilha 3', 599.99, 'UNISSEX'::"Genero", 'TRILHA'::"Terreno", 'DEZ_K'::"Distancia", 8, 260, '/catalogo/olympikus/corre-trilha-3/01.png', '{"Verde-escuro / laranja": "/catalogo/olympikus/corre-trilha-3/01.png", "Preto": "/catalogo/olympikus/corre-trilha-3/02.jpg", "Amarelo": "/catalogo/olympikus/corre-trilha-3/03.jpg"}'::jsonb),
  ('Adidas', 'Adizero Evo SL', 1099.99, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'DEZ_K'::"Distancia", 6, 224, '/catalogo/adidas/adizero-evo-sl/01-js4487.jpg', '{"Branco": "/catalogo/adidas/adizero-evo-sl/01-js4487.jpg", "Preto": "/catalogo/adidas/adizero-evo-sl/02-kj1365.jpg", "Cinza": "/catalogo/adidas/adizero-evo-sl/03-kk4478.jpg"}'::jsonb),
  ('Adidas', 'Adizero Adios Pro 4', 1699.99, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'MARATONA'::"Distancia", 6, 200, '/catalogo/adidas/adizero-adios-pro-4/01-jr1163.jpg', '{"Branco": "/catalogo/adidas/adizero-adios-pro-4/01-jr1163.jpg", "Preto": "/catalogo/adidas/adizero-adios-pro-4/02-jr6369.jpg", "Azul": "/catalogo/adidas/adizero-adios-pro-4/03-jr4797.jpg"}'::jsonb),
  ('Adidas', 'Terrex Agravic Speed 2', 999.99, 'MASCULINO'::"Genero", 'TRILHA'::"Terreno", 'DEZ_K'::"Distancia", 8, 221, '/catalogo/adidas/terrex-agravic-speed-2/01-js3536.jpg', '{"Branco": "/catalogo/adidas/terrex-agravic-speed-2/01-js3536.jpg", "Preto": "/catalogo/adidas/terrex-agravic-speed-2/02-hp7014.jpg", "Amarelo": "/catalogo/adidas/terrex-agravic-speed-2/03-hq5074.jpg"}'::jsonb),
  ('Nike', 'Vomero 18', 799.99, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'MARATONA'::"Distancia", 10, 325, '/catalogo/nike/vomero-18/01-hm6803-116.png', '{"Branco / amarelo-limão": "/catalogo/nike/vomero-18/01-hm6803-116.png", "Preto / creme": "/catalogo/nike/vomero-18/02-hm6803-016.png", "Marinho / azul": "/catalogo/nike/vomero-18/03-hm6803-406.png"}'::jsonb),
  ('Nike', 'Vaporfly 4', 1571.41, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'MARATONA'::"Distancia", 6, 190, '/catalogo/nike/vaporfly-4/01-hf6414-106.png', '{"Branco / amarelo-limão": "/catalogo/nike/vaporfly-4/01-hf6414-106.png", "Marinho / violeta": "/catalogo/nike/vaporfly-4/02-iv2873-702.png", "Azul / rosa": "/catalogo/nike/vaporfly-4/03-im8203-400.png"}'::jsonb),
  ('Nike', 'Pegasus Trail 5', 999.99, 'MASCULINO'::"Genero", 'TRILHA'::"Terreno", 'DEZ_K'::"Distancia", 9.5, 300, '/catalogo/nike/pegasus-trail-5/01-dv3864-102.png', '{"Branco / rosa / marinho": "/catalogo/nike/pegasus-trail-5/01-dv3864-102.png", "Prata / cinza / vermelho": "/catalogo/nike/pegasus-trail-5/02-dv3864-004.png", "Preto / marrom": "/catalogo/nike/pegasus-trail-5/03-dv3864-600.png"}'::jsonb),
  ('Asics', 'Novablast 5', 899.99, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'DEZ_K'::"Distancia", 8, 255, '/catalogo/asics/novablast-5/01-1011b974-500.jpg', '{"Roxo acinzentado / coral": "/catalogo/asics/novablast-5/01-1011b974-500.jpg", "Preto / cinza": "/catalogo/asics/novablast-5/02-1011b974-002.webp", "Verde musgo / laranja claro": "/catalogo/asics/novablast-5/03-1011b974-406.jpg"}'::jsonb),
  ('Asics', 'Superblast 2', 1399.99, 'UNISSEX'::"Genero", 'ASFALTO'::"Terreno", 'MARATONA'::"Distancia", 8, 250, '/catalogo/asics/superblast-2/01-1013a142-402.webp', '{"Azul / branco": "/catalogo/asics/superblast-2/01-1013a142-402.webp", "Preto / branco": "/catalogo/asics/superblast-2/02-1013a160-001.jpg", "Azul / roxo": "/catalogo/asics/superblast-2/03-1013a142-401.webp"}'::jsonb),
  ('Asics', 'Gel Trabuco 13', 899.99, 'MASCULINO'::"Genero", 'TRILHA'::"Terreno", 'DEZ_K'::"Distancia", 8, 285, '/catalogo/asics/gel-trabuco-13/01-1011b973-002.jpg', '{"Preto / creme": "/catalogo/asics/gel-trabuco-13/01-1011b973-002.jpg", "Azul atlântico / aqua": "/catalogo/asics/gel-trabuco-13/02-1011b973-400.jpg", "Verde-limão / verde": "/catalogo/asics/gel-trabuco-13/03-1011b973-300.jpg"}'::jsonb),
  ('New Balance', 'Fresh Foam X More v6', 899.99, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'MARATONA'::"Distancia", 4, 306, '/catalogo/newbalance/fresh-foam-x-more-v6/01-1315365.webp', '{"Cinza claro": "/catalogo/newbalance/fresh-foam-x-more-v6/01-1315365.webp", "Preto": "/catalogo/newbalance/fresh-foam-x-more-v6/02-mmorla6-d-07.webp", "Verde": "/catalogo/newbalance/fresh-foam-x-more-v6/03-1347786.webp"}'::jsonb),
  ('New Balance', 'FuelCell Rebel v5', 999.99, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'DEZ_K'::"Distancia", 6, 223, '/catalogo/newbalance/fuelcell-rebel-v5/01-1394596.webp', '{"Grafite / azul claro": "/catalogo/newbalance/fuelcell-rebel-v5/01-1394596.webp", "Preto / branco": "/catalogo/newbalance/fuelcell-rebel-v5/02-1314788.webp", "Verde neon / roxo escuro": "/catalogo/newbalance/fuelcell-rebel-v5/03-1347833.webp"}'::jsonb),
  ('New Balance', 'Fresh Foam X Hierro v9', 999.99, 'MASCULINO'::"Genero", 'TRILHA'::"Terreno", 'DEZ_K'::"Distancia", 4, 310, '/catalogo/newbalance/fresh-foam-x-hierro-v9/01-1394688.webp', '{"Verde claro / grafite": "/catalogo/newbalance/fresh-foam-x-hierro-v9/01-1394688.webp", "Vermelho claro / vinho": "/catalogo/newbalance/fresh-foam-x-hierro-v9/02-1394710.webp", "Marinho / vermelho claro": "/catalogo/newbalance/fresh-foam-x-hierro-v9/03-1394659.webp"}'::jsonb),
  ('Fila', 'Float Maxxi 2', 699.0, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'MARATONA'::"Distancia", 8, 275, '/catalogo/fila/float-maxxi-2/01-1242063.webp', '{"Preto / vermelho / grafite": "/catalogo/fila/float-maxxi-2/01-1242063.webp", "Branco / laranja / vermelho": "/catalogo/fila/float-maxxi-2/02-1294594.webp", "Marrom / preto / dourado": "/catalogo/fila/float-maxxi-2/03-1321217.webp"}'::jsonb),
  ('Fila', 'KR7 Pro Speed Tech', 499.9, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'CINCO_K'::"Distancia", 6, 160, '/catalogo/fila/kr7-pro-speed-tech/01-1366060.webp', '{"Branco / preto": "/catalogo/fila/kr7-pro-speed-tech/01-1366060.webp", "Verde-limão / vermelho": "/catalogo/fila/kr7-pro-speed-tech/02-1366061.webp", "Vermelho": "/catalogo/fila/kr7-pro-speed-tech/03-1325210.jpg"}'::jsonb),
  ('Fila', 'Racer Carbon 3', 1299.99, 'MASCULINO'::"Genero", 'ASFALTO'::"Terreno", 'MARATONA'::"Distancia", 8, 229, '/catalogo/fila/racer-carbon-3/01-1291533.webp', '{"Branco / vermelho / azul": "/catalogo/fila/racer-carbon-3/01-1291533.webp", "Preto / cinza": "/catalogo/fila/racer-carbon-3/02-1291543.webp", "Vermelho / preto / verde-limão": "/catalogo/fila/racer-carbon-3/03-1291541.webp"}'::jsonb)
) AS v(marca, modelo, preco, genero, terreno, distancia, drop, peso, foto, fotos_por_cor);

INSERT INTO marcas (nome)
SELECT DISTINCT marca FROM novo_catalogo
ON CONFLICT (nome) DO NOTHING;

-- Arquiva somente os produtos do seed que ainda têm a foto de demonstração.
UPDATE tenis AS t SET ativo = false, "updatedAt" = CURRENT_TIMESTAMP
FROM marcas AS m
WHERE t."marcaId" = m.id
  AND t.ativo
  AND t.foto = 'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg'
  AND (m.nome, t.modelo) IN (
    ('Adidas','Adizero SL2'), ('Asics','Trabuco 12'), ('Asics','Gel-Nimbus 26'),
    ('Fila','Float Maxxi'), ('New Balance','Fresh Foam 1080v13'),
    ('Nike','Vomero 17'), ('Nike','Pegasus 41'), ('Olympikus','Corre 3')
  );

-- Atualiza as fotos de modelos previamente cadastrados sem alterar preço ou estoque.
UPDATE tenis AS t SET foto = c.foto, "fotosPorCor" = c.fotos_por_cor, "updatedAt" = CURRENT_TIMESTAMP
FROM novo_catalogo AS c JOIN marcas AS m ON m.nome = c.marca
WHERE t."marcaId" = m.id AND t.modelo = c.modelo AND t.ativo
  AND (t.foto, t."fotosPorCor") IS DISTINCT FROM (c.foto, c.fotos_por_cor);

INSERT INTO tenis (modelo, preco, genero, terreno, distancia, drop, peso, foto, "fotosPorCor", "marcaId", "pontosFortes", "pontosFracos", "updatedAt")
SELECT c.modelo, c.preco, c.genero, c.terreno, c.distancia, c.drop, c.peso, c.foto, c.fotos_por_cor, m.id, ARRAY[]::text[], ARRAY[]::text[], CURRENT_TIMESTAMP
FROM novo_catalogo AS c JOIN marcas AS m ON m.nome = c.marca
WHERE NOT EXISTS (SELECT 1 FROM tenis t WHERE t."marcaId" = m.id AND t.modelo = c.modelo AND t.ativo);

INSERT INTO variacoes ("tenisId", cor, tamanho, quantidade)
SELECT t.id, cor.nome, tam.numero, 5
FROM novo_catalogo AS c JOIN marcas AS m ON m.nome = c.marca
JOIN tenis AS t ON t."marcaId" = m.id AND t.modelo = c.modelo AND t.ativo
CROSS JOIN LATERAL jsonb_object_keys(c.fotos_por_cor) AS cor(nome)
CROSS JOIN generate_series(38, 43) AS tam(numero)
ON CONFLICT ("tenisId", tamanho, cor) DO NOTHING;

COMMIT;
