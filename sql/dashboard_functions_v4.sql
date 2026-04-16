-- ============================================================
-- Dashboard RPC Functions v4
-- Changes:
--   • dashboard_cards: conditional date filtering based on honorario_gerado
--   • Split dashboard_horas_cobraveis into dashboard_horas_cobraveis_seguradora and dashboard_horas_cobraveis_operacao
--     using dt_inicial and dt_final for date filters.
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
    COALESCE(SUM(CASE 
        WHEN t.honorario_gerado IS TRUE 
             AND (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
             AND (p_data_fim IS NULL OR t.data_cobranca <= p_data_fim) THEN t.total_decimal
        WHEN t.honorario_gerado IS FALSE 
             AND (p_data_inicio IS NULL OR t.dt_inicial >= p_data_inicio)
             AND (p_data_fim IS NULL OR t.dt_final <= p_data_fim) THEN t.total_decimal
        ELSE 0 
    END), 0) AS total_horas,

    COALESCE(SUM(CASE 
        WHEN t.honorario_gerado IS TRUE 
             AND (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
             AND (p_data_fim IS NULL OR t.data_cobranca <= p_data_fim) THEN t.total_decimal * COALESCE(h.valor_atual, 350)
        WHEN t.honorario_gerado IS FALSE 
             AND (p_data_inicio IS NULL OR t.dt_inicial >= p_data_inicio)
             AND (p_data_fim IS NULL OR t.dt_final <= p_data_fim) THEN t.total_decimal * COALESCE(h.valor_atual, 350)
        ELSE 0 
    END), 0) AS valor_total_reais,

    COALESCE(SUM(CASE 
        WHEN t.honorario_gerado IS FALSE 
             AND (p_data_inicio IS NULL OR t.dt_inicial >= p_data_inicio)
             AND (p_data_fim IS NULL OR t.dt_final <= p_data_fim) THEN t.total_decimal 
        ELSE 0 
    END), 0) AS horas_cobraveis,

    COALESCE(SUM(CASE 
        WHEN t.honorario_gerado IS TRUE 
             AND (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
             AND (p_data_fim IS NULL OR t.data_cobranca <= p_data_fim) THEN t.total_decimal 
        ELSE 0 
    END), 0) AS horas_cobradas,

    COALESCE(SUM(CASE 
        WHEN t.honorario_gerado IS TRUE 
             AND (p_data_inicio IS NULL OR t.data_cobranca >= p_data_inicio)
             AND (p_data_fim IS NULL OR t.data_cobranca <= p_data_fim) THEN t.total_decimal * COALESCE(h.valor_atual, 350) 
        ELSE 0 
    END), 0) AS valor_horas_cobradas,

    COALESCE(SUM(CASE 
        WHEN t.honorario_gerado IS FALSE 
             AND (p_data_inicio IS NULL OR t.dt_inicial >= p_data_inicio)
             AND (p_data_fim IS NULL OR t.dt_final <= p_data_fim) THEN t.total_decimal * COALESCE(h.valor_atual, 350) 
        ELSE 0 
    END), 0) AS valor_horas_cobraveis

  FROM timesheets t
  JOIN sinistros s                    ON s.codigo_sinistro = t.codigo_sinistro
  LEFT JOIN honorarios_seguradora h   ON h.seguradora = s.seguradora
  WHERE
    (p_operacao IS NULL    OR s.operacao       = ANY(p_operacao))
    AND (p_seguradora IS NULL  OR s.seguradora     = ANY(p_seguradora))
    AND (p_perito IS NULL      OR t.regulador_prestador = ANY(p_perito));
$$;

-- ──────────────────────────────────────────────
-- 2. dashboard_horas_cobraveis_seguradora
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_horas_cobraveis_seguradora(
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
    t.honorario_gerado IS FALSE
    AND (p_data_inicio IS NULL OR t.dt_inicial >= p_data_inicio)
    AND (p_data_fim IS NULL    OR t.dt_final <= p_data_fim)
    AND (p_operacao IS NULL    OR s.operacao       = ANY(p_operacao))
    AND (p_seguradora IS NULL  OR s.seguradora     = ANY(p_seguradora))
    AND (p_perito IS NULL      OR t.regulador_prestador = ANY(p_perito))
  GROUP BY s.seguradora
  ORDER BY total_horas DESC;
$$;

-- ──────────────────────────────────────────────
-- 3. dashboard_horas_cobraveis_operacao
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_horas_cobraveis_operacao(
  p_data_inicio DATE     DEFAULT NULL,
  p_data_fim    DATE     DEFAULT NULL,
  p_operacao    TEXT[]   DEFAULT NULL,
  p_seguradora  TEXT[]   DEFAULT NULL,
  p_perito      TEXT[]   DEFAULT NULL
)
RETURNS TABLE (
  operacao    TEXT,
  total_horas NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    s.operacao,
    SUM(t.total_decimal) AS total_horas
  FROM timesheets t
  JOIN sinistros s ON s.codigo_sinistro = t.codigo_sinistro
  WHERE
    t.honorario_gerado IS FALSE
    AND (p_data_inicio IS NULL OR t.dt_inicial >= p_data_inicio)
    AND (p_data_fim IS NULL    OR t.dt_final <= p_data_fim)
    AND (p_operacao IS NULL    OR s.operacao       = ANY(p_operacao))
    AND (p_seguradora IS NULL  OR s.seguradora     = ANY(p_seguradora))
    AND (p_perito IS NULL      OR t.regulador_prestador = ANY(p_perito))
  GROUP BY s.operacao
  ORDER BY total_horas DESC;
$$;
