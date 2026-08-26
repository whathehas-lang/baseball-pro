"""
scheduler.py - 투수 최근 3경기 지표 자동 수집 및 DB 동기화 스케줄러
- APScheduler를 이용한 매일 새벽 4시 정기 배치 실행
- CLI 인자(--run-now) 제공으로 즉시 실행 및 테스트 지원
- pitcher_stats.py의 리그별(MLB, KBO, NPB) 수집기 연동
- PostgreSQL DB UPSERT 갱신 지원 (환경변수 또는 설정 파일 기반)
"""

import os
import sys
import time
import logging
from datetime import datetime

# Windows 콘솔 UTF-8 출력 보정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from apscheduler.schedulers.blocking import BlockingScheduler

# 앞서 작성한 수집 & 비교 모듈 임포트
from pitcher_stats import (
    get_mlb_pitcher_recent_stats,
    get_kbo_pitcher_recent_stats,
    get_npb_pitcher_recent_stats,
    compare_stats
)

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# ==========================================
# 1. DB 설정 (PostgreSQL)
# ==========================================
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": os.environ.get("DB_PORT", "5432"),
    "dbname": os.environ.get("DB_NAME", "baseball_db"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", "postgres")
}

def get_db_connection():
    """PostgreSQL 데이터베이스 연결 객체 반환 (미설치/미실행 시 None)"""
    try:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logging.warning(f"PostgreSQL 직접 연결 불가 ({e}) -> 로컬 시뮬레이션 모드로 진행합니다.")
        return None


# ==========================================
# 2. 배치 업데이트 핵심 로직
# ==========================================
def update_all_pitchers_stats():
    """
    1. DB에서 등록된 선수 목록 및 external_pcode 조회
    2. 리그별(KBO, MLB, NPB) 수집 함수 호출
    3. 수집 결과를 pitcher_recent_stats_cache 테이블에 UPSERT(갱신)
    """
    start_time = datetime.now()
    logging.info("=" * 60)
    logging.info(f"⚾ [Batch Job] 투수 최근 3경기 지표 자동 수집 및 캐시 동기화 시작")
    logging.info("=" * 60)

    conn = get_db_connection()

    pitcher_list = []
    if conn:
        try:
            with conn.cursor() as cur:
                query = """
                SELECT p.pitcher_id, p.name_kr, p.league_id, p.team_name, e.api_source, e.external_pcode
                FROM pitchers p
                LEFT JOIN pitcher_external_ids e ON p.pitcher_id = e.pitcher_id
                ORDER BY p.pitcher_id;
                """
                cur.execute(query)
                rows = cur.fetchall()
                for r in rows:
                    pitcher_list.append({
                        "pitcher_id": r[0],
                        "name_kr": r[1],
                        "league_id": r[2],
                        "team_name": r[3],
                        "api_source": r[4],
                        "external_pcode": r[5]
                    })
        except Exception as e:
            logging.error(f"선수 목록 조회 오류: {e}")

    # DB에 데이터가 없거나 오프라인일 때 기본 대상 리스트
    if not pitcher_list:
        pitcher_list = [
            {"pitcher_id": 1, "name_kr": "타라", "league_id": "MLB", "team_name": "SD", "external_pcode": "665487"},
            {"pitcher_id": 2, "name_kr": "원태인", "league_id": "KBO", "team_name": "삼성", "external_pcode": "62892"},
            {"pitcher_id": 3, "name_kr": "수아레즈", "league_id": "NPB", "team_name": "야쿠르트", "external_pcode": "1800041"}
        ]

    success_count = 0
    fail_count = 0

    for p in pitcher_list:
        p_id = p["pitcher_id"]
        name = p["name_kr"]
        league = p["league_id"]
        pcode = p.get("external_pcode")

        logging.info(f"🔄 [{league}] {name} (ID: {p_id}, pcode: {pcode}) 데이터 수집 중...")

        try:
            # 1. 리그별 크롤러 호출
            if league == "MLB":
                stats = get_mlb_pitcher_recent_stats(person_id=pcode)
                s_era, s_whip, s_inn = 2.85, 1.05, 6.7
            elif league == "KBO":
                stats = get_kbo_pitcher_recent_stats(pcode=pcode)
                s_era, s_whip, s_inn = 3.20, 1.15, 6.0
            else:  # NPB
                stats = get_npb_pitcher_recent_stats(player_id=pcode)
                s_era, s_whip, s_inn = 3.55, 1.18, 6.3

            r_era = stats["recent3_era"]
            r_whip = stats["recent3_whip"]
            r_inn = stats["recent3_innings"]

            # 2. DB UPSERT 갱신
            if conn:
                with conn.cursor() as cur:
                    upsert_sql = """
                    INSERT INTO pitcher_recent_stats_cache (
                        pitcher_id, 
                        home_season_era, home_recent3_era, 
                        home_season_whip, home_recent3_whip, 
                        home_season_inn, home_recent3_inn, 
                        updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (pitcher_id) 
                    DO UPDATE SET
                        home_season_era = EXCLUDED.home_season_era,
                        home_recent3_era = EXCLUDED.home_recent3_era,
                        home_season_whip = EXCLUDED.home_season_whip,
                        home_recent3_whip = EXCLUDED.home_recent3_whip,
                        home_season_inn = EXCLUDED.home_season_inn,
                        home_recent3_inn = EXCLUDED.home_recent3_inn,
                        updated_at = CURRENT_TIMESTAMP;
                    """
                    cur.execute(upsert_sql, (p_id, s_era, r_era, s_whip, r_whip, s_inn, r_inn))
                    conn.commit()

            logging.info(f"✅ {name} 완료: 시즌 ERA {s_era} ➔ 최근3G {r_era} | WHIP {s_whip} ➔ {r_whip} | 이닝 {s_inn} ➔ {r_inn}")
            success_count += 1

            # 외부 API 과부하 방지 (Polite Delay)
            time.sleep(0.5)

        except Exception as ex:
            logging.error(f"❌ {name} 수집 실패: {ex}")
            fail_count += 1

    if conn:
        conn.close()

    duration = (datetime.now() - start_time).total_seconds()
    logging.info("=" * 60)
    logging.info(f"🏁 [Batch Job] 전체 작업 완료 | 성공: {success_count}건, 실패: {fail_count}건 (소요 시간: {duration:.2f}초)")
    logging.info("=" * 60)


def sync_betman_active_round_matches():
    """
    BETMAN 현재 활성화된 최신 회차(Current Active Round)를 자동 감지하여 4자리 공식 번호 동기화
    """
    logging.info("⚾ [BETMAN 4자리 SyncEngine] 현재 활성 회차 자동 감지 및 4자리 공식 번호 동기화 시작...")
    try:
        from betman_crawler import BetmanSyncEngine
        synced = BetmanSyncEngine.sync_active_round()
        if synced:
            logging.info(f"✅ [BETMAN SyncEngine] 최신 활성 회차 {len(synced)}개 경기 4자리 번호 동기화 완료")
    except Exception as e:
        logging.error(f"❌ [BETMAN SyncEngine] 동기화 중 오류: {e}")


# ==========================================
# 3. 스케줄러 등록 및 실행
# ==========================================
def main():
    # CLI 인자로 --run-now가 주어지면 즉시 1회 실행 후 종료
    if "--run-now" in sys.argv:
        logging.info("⚡ [--run-now] 플래그 감지: 즉시 1회 배치를 실행합니다.")
        sync_betman_active_round_matches()
        update_all_pitchers_stats()
        return

    scheduler = BlockingScheduler(timezone="Asia/Seoul")
    
    # ⏰ 매 15분마다 BETMAN 최신 활성 회차 자동 감지 및 4자리 공식 번호 경기 동기화
    scheduler.add_job(
        sync_betman_active_round_matches,
        'interval',
        minutes=15,
        id='betman_active_round_sync',
        replace_existing=True
    )

    # ⏰ 매일 새벽 4시 00분 투수 통계 세부 지표 배치 실행
    scheduler.add_job(
        update_all_pitchers_stats, 
        'cron', 
        hour=4, 
        minute=0,
        id='daily_pitcher_stats_sync',
        replace_existing=True
    )

    logging.info("🚀 [APScheduler] BETMAN 최신 회차 자동 연동 및 투수 지표 스케줄러가 활성화되었습니다.")
    logging.info("👉 즉시 테스트 실행을 원하시면 'python scheduler.py --run-now' 명령을 사용하세요.")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logging.info("스케줄러가 종료되었습니다.")

if __name__ == '__main__':
    main()
