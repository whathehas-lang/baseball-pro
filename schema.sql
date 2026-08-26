-- ==========================================================
-- Baseball Pitcher & Bullpen SaberMetrics PostgreSQL Schema
-- ==========================================================

-- 1. 리그 정보 테이블
CREATE TABLE IF NOT EXISTS leagues (
    league_id VARCHAR(10) PRIMARY KEY, -- 'KBO', 'MLB', 'NPB'
    league_name VARCHAR(50) NOT NULL
);

-- 2. 투수 기본 정보 테이블
CREATE TABLE IF NOT EXISTS pitchers (
    pitcher_id SERIAL PRIMARY KEY,
    name_kr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    team_name VARCHAR(50) NOT NULL,
    league_id VARCHAR(10) REFERENCES leagues(league_id),
    role VARCHAR(20) DEFAULT '1선발', -- '1선발', '2선발', '필승조', '불펜', '마무리'
    jersey_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 외부 크롤링/API 식별자 매핑 테이블
CREATE TABLE IF NOT EXISTS pitcher_external_ids (
    pitcher_id INT REFERENCES pitchers(pitcher_id) ON DELETE CASCADE,
    league_id VARCHAR(10) REFERENCES leagues(league_id),
    api_source VARCHAR(20) NOT NULL, -- 'NAVER', 'MLB_OFFICIAL', 'YAHOO_JP', 'STATIZ'
    external_pcode VARCHAR(50) NOT NULL,
    PRIMARY KEY (pitcher_id, api_source)
);

-- 4. 최근 수집 성적 캐싱 테이블 (선발 5대 + 불펜 5대 지표 통합)
CREATE TABLE IF NOT EXISTS pitcher_recent_stats_cache (
    pitcher_id INT PRIMARY KEY REFERENCES pitchers(pitcher_id) ON DELETE CASCADE,
    
    -- [선발 투수 5대 핵심 지표 (시즌 / 최근 3경기)]
    season_era NUMERIC(4,2),
    recent3_era NUMERIC(4,2),
    season_fip NUMERIC(4,2),
    recent3_fip NUMERIC(4,2),
    season_whip NUMERIC(4,2),
    recent3_whip NUMERIC(4,2),
    season_k9 NUMERIC(4,2),
    recent3_k9 NUMERIC(4,2),
    season_bb9 NUMERIC(4,2),
    recent3_bb9 NUMERIC(4,2),
    
    -- [불펜 투수 5대 핵심 지표 (시즌 / 최근 3경기)]
    season_lob_pct NUMERIC(4,1),    -- 잔루율 (LOB%)
    recent3_lob_pct NUMERIC(4,1),
    season_irs_pct NUMERIC(4,1),    -- 승계주자 실점률 (IRS%)
    recent3_irs_pct NUMERIC(4,1),
    season_k_bb_pct NUMERIC(4,1),   -- 삼진-볼넷 비율 (K-BB%)
    recent3_k_bb_pct NUMERIC(4,1),
    recent3_days_pitches INT DEFAULT 0,  -- 최근 3일간 총 투구수
    recent3_days_innings NUMERIC(3,1) DEFAULT 0.0, -- 최근 3일간 총 소화 이닝
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_pitchers_league_role ON pitchers(league_id, role);
CREATE INDEX IF NOT EXISTS idx_cache_updated_at ON pitcher_recent_stats_cache(updated_at);

-- 시드 데이터 적재
INSERT INTO leagues (league_id, league_name) VALUES
('MLB', 'Major League Baseball'),
('KBO', 'KBO League'),
('NPB', 'Nippon Professional Baseball')
ON CONFLICT (league_id) DO NOTHING;

INSERT INTO pitchers (pitcher_id, name_kr, name_en, team_name, league_id, role) VALUES
(1, '타라', 'Sandy Alcantara', '샌디에이고', 'MLB', '1선발'),
(2, '원태인', 'Tae-in Won', '삼성', 'KBO', '1선발'),
(3, '수아레즈', 'Albert Suarez', '야쿠르트', 'NPB', '2선발')
ON CONFLICT (pitcher_id) DO NOTHING;

INSERT INTO pitcher_external_ids (pitcher_id, league_id, api_source, external_pcode) VALUES
(1, 'MLB', 'MLB_OFFICIAL', '665487'),
(2, 'KBO', 'NAVER', '62892'),
(3, 'NPB', 'YAHOO_JP', '1800041')
ON CONFLICT (pitcher_id, api_source) DO NOTHING;

INSERT INTO pitcher_recent_stats_cache (
    pitcher_id, 
    season_era, recent3_era, season_fip, recent3_fip, season_whip, recent3_whip, season_k9, recent3_k9, season_bb9, recent3_bb9,
    season_lob_pct, recent3_lob_pct, season_irs_pct, recent3_irs_pct, season_k_bb_pct, recent3_k_bb_pct, recent3_days_pitches, recent3_days_innings
) VALUES
(1, 2.85, 2.10, 3.10, 2.65, 1.05, 0.95, 8.85, 9.80, 2.10, 1.80, 76.5, 82.0, 28.0, 22.5, 18.5, 24.0, 28, 5.2),
(2, 3.20, 4.10, 3.40, 3.85, 1.15, 1.30, 8.10, 7.20, 2.30, 2.90, 72.0, 68.0, 32.0, 38.0, 15.0, 11.5, 35, 5.1),
(3, 3.55, 4.20, 3.65, 3.95, 1.18, 1.35, 8.20, 7.50, 2.45, 3.10, 71.0, 65.0, 34.0, 45.0, 14.0, 8.5, 78, 7.0)
ON CONFLICT (pitcher_id) DO NOTHING;
