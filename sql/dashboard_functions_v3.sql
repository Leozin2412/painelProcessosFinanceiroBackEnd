-- ============================================================
-- Dashboard RPC Functions v3
-- Changes from v2:
--   • p_mes replaced by p_data_inicio DATE + p_data_fim DATE (range)
--   • New p_perito TEXT[] filter on all functions
--   • dashboard_cards keeps valor_horas_cobradas & valor_horas_cobraveis
--   • All WHERE clauses use IS NULL guard for optional params
-- ============================================================


-- ──────────────────────────────────────────────
-- 1. dashboard_cards
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_cards(
  p_data_inicio DATE     DEFAULT NULL,
  p_data_fim    DATE     DEFAULT NULL,
  p_operacao    TEXT[]   DEFAULT NULL,
  p_seguradora  TEXT[]   DEFAULT NULL,
  p_perito      TEXT[]   DEFAULT NULL
)
RETURNS TABLE (
  total_horas            NUMERIC,
  valor_total_reais      NUMERIC,
  horas_cobraveis        NUMERIC,
  horas_cobradas         NUMERIC,
  valor_horas_cobradas   NUMERIC,
  valor_horas_cobraveis  NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    COALESCE(SUM(t.total_decimal), 0)
      AS total_horas,

    COALESCE(SUM(t.total_decimal * COALESCE(h.valor_atual, 350)), 0)
      AS valor_total_reais,

    COALESCE(SUM(CASE WHEN t.honorario_gerado IS FALSE THEN t.total_decimal ELSE 0 END), 0)
      AS horas_cobraveis,

    COALESCE(SUM(CASE WHEN t.honorario_gerado IS TRUE THEN t.total_decimal ELSE 0 END), 0)
      AS horas_cobradas,

    COALESCE(SUM(CASE WHEN t.honorario_gerado IS TRUE
      THEN t.total_decimal * COALESCE(h.valor_atual, 350) ELSE 0 END), 0)
      AS valor_horas_cobradas,

    COALESCE(SUM(CASE WHEN t.honorario_gerado IS FALSE
      THEN t.total_decimal * COALESCE(h.valor_atual, 350) ELSE 0 END), 0)
      AS valor_horas_cobraveis

  FROM timesheets t
  JOIN sinistros s                    ON s.codigo_sinistro = t.codigo_sinistro
  LEFT JOIN honorarios_seguradora h   ON h.seguradora = s.seguradora
  WHERE
    (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
    AND (p_data_fim IS NULL    OR t.data_cobranca <= p_data_fim)
    AND (p_operacao IS NULL    OR s.operacao       = ANY(p_operacao))
    AND (p_seguradora IS NULL  OR s.seguradora     = ANY(p_seguradora))
    AND (p_perito IS NULL      OR t.regulador_prestador = ANY(p_perito));
$$;


-- ──────────────────────────────────────────────
-- 2. dashboard_horas_produzidas
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_horas_produzidas(
  p_data_inicio DATE     DEFAULT NULL,
  p_data_fim    DATE     DEFAULT NULL,
  p_operacao    TEXT[]   DEFAULT NULL,
  p_seguradora  TEXT[]   DEFAULT NULL,
  p_perito      TEXT[]   DEFAULT NULL
)
RETURNS TABLE (
  mes                 TEXT,
  operacao            TEXT,
  regulador_prestador TEXT,
  seguradora          TEXT,
  total_horas         NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    TO_CHAR(t.data_cobranca, 'YYYY-MM') AS mes,
    s.operacao,
    t.regulador_prestador,
    s.seguradora,
    SUM(t.total_decimal) AS total_horas
  FROM timesheets t
  JOIN sinistros s ON s.codigo_sinistro = t.codigo_sinistro
  WHERE
    (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
    AND (p_data_fim IS NULL    OR t.data_cobranca <= p_data_fim)
    AND (p_operacao IS NULL    OR s.operacao       = ANY(p_operacao))
    AND (p_seguradora IS NULL  OR s.seguradora     = ANY(p_seguradora))
    AND (p_perito IS NULL      OR t.regulador_prestador = ANY(p_perito))
  GROUP BY mes, s.operacao, t.regulador_prestador, s.seguradora
  ORDER BY mes;
$$;


-- ──────────────────────────────────────────────
-- 3. dashboard_horas_cobraveis
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_horas_cobraveis(
  p_data_inicio DATE     DEFAULT NULL,
  p_data_fim    DATE     DEFAULT NULL,
  p_operacao    TEXT[]   DEFAULT NULL,
  p_seguradora  TEXT[]   DEFAULT NULL,
  p_perito      TEXT[]   DEFAULT NULL
)
RETURNS TABLE (
  operacao    TEXT,
  seguradora  TEXT,
  total_horas NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    s.operacao,
    s.seguradora,
    SUM(t.total_decimal) AS total_horas
  FROM timesheets t
  JOIN sinistros s ON s.codigo_sinistro = t.codigo_sinistro
  WHERE
    t.honorario_gerado IS FALSE
    AND (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
    AND (p_data_fim IS NULL    OR t.data_cobranca <= p_data_fim)
    AND (p_operacao IS NULL    OR s.operacao       = ANY(p_operacao))
    AND (p_seguradora IS NULL  OR s.seguradora     = ANY(p_seguradora))
    AND (p_perito IS NULL      OR t.regulador_prestador = ANY(p_perito))
  GROUP BY s.operacao, s.seguradora
  ORDER BY total_horas DESC;
$$;


-- ──────────────────────────────────────────────
-- 4. dashboard_pizza_seguradoras
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_pizza_seguradoras(
  p_data_inicio DATE     DEFAULT NULL,
  p_data_fim    DATE     DEFAULT NULL,
  p_operacao    TEXT[]   DEFAULT NULL,
  p_seguradora  TEXT[]   DEFAULT NULL,
  p_perito      TEXT[]   DEFAULT NULL
)
RETURNS TABLE (
  seguradora  TEXT,
  total_horas NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    s.seguradora,
    SUM(t.total_decimal) AS total_horas
  FROM timesheets t
  JOIN sinistros s ON s.codigo_sinistro = t.codigo_sinistro
  WHERE
    t.cobranca IS TRUE
    AND (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
    AND (p_data_fim IS NULL    OR t.data_cobranca <= p_data_fim)
    AND (p_operacao IS NULL    OR s.operacao       = ANY(p_operacao))
    AND (p_seguradora IS NULL  OR s.seguradora     = ANY(p_seguradora))
    AND (p_perito IS NULL      OR t.regulador_prestador = ANY(p_perito))
  GROUP BY s.seguradora
  ORDER BY total_horas DESC;
$$;


-- ──────────────────────────────────────────────
-- 5. dashboard_barras_faturado_periodo
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_barras_faturado_periodo(
  p_data_inicio DATE     DEFAULT NULL,
  p_data_fim    DATE     DEFAULT NULL,
  p_operacao    TEXT[]   DEFAULT NULL,
  p_seguradora  TEXT[]   DEFAULT NULL,
  p_perito      TEXT[]   DEFAULT NULL
)
RETURNS TABLE (
  mes         TEXT,
  total_horas NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    TO_CHAR(t.data_cobranca, 'YYYY-MM') AS mes,
    SUM(t.total_decimal) AS total_horas
  FROM timesheets t
  JOIN sinistros s ON s.codigo_sinistro = t.codigo_sinistro
  WHERE
    t.cobranca IS TRUE
    AND (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
    AND (p_data_fim IS NULL    OR t.data_cobranca <= p_data_fim)
    AND (p_operacao IS NULL    OR s.operacao       = ANY(p_operacao))
    AND (p_seguradora IS NULL  OR s.seguradora     = ANY(p_seguradora))
    AND (p_perito IS NULL      OR t.regulador_prestador = ANY(p_perito))
  GROUP BY mes
  ORDER BY mes;
$$;
