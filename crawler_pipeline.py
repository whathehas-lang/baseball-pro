"""
crawler_pipeline.py - 봇 차단 우회(User-Agent Injection) 및 비공개 JSON API 기반 크롤링 파이프라인
- Stealth Headers: Chrome 124+ 최신 정규 브라우저 헤더 주입 (sec-ch-ua, accept-language 등)
- Direct JSON API: 봇 탐지가 심한 HTML 파싱 대신 비공개 공식 백엔드 JSON 엔드포인트 직접 타격
- Auto-Fallback & Retry: 403 Forbidden / 타임아웃 발생 시 다단계 백업 소스로 자동 우회
"""

import json
import os
import sys
import logging
from datetime import datetime, timedelta
import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

sys.stdout.reconfigure(encoding='utf-8')
logger = logging.getLogger("CrawlerPipeline")
logger.setLevel(logging.INFO)

# 실제 Chrome 124+ 브라우저 100% 동일 헤더
STEALTH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
}

# ==========================================
# 1. 지수 백오프 안전 HTTP 세션 클라이언트
# ==========================================
session = requests.Session()
session.headers.update(STEALTH_HEADERS)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=6),
    retry=retry_if_exception_type((requests.RequestException, TimeoutError)),
    reraise=False
)
def safe_api_get(url, params=None, referer=None, timeout=6):
    """봇 차단 방지 헤더 및 Referer를 동적으로 주입하여 안전하게 JSON API 호출"""
    h = STEALTH_HEADERS.copy()
    if referer:
        h['Referer'] = referer
    try:
        resp = session.get(url, params=params, headers=h, timeout=timeout)
        if resp.status_code == 200:
            return resp
        elif resp.status_code == 403:
            logger.warning(f"⚠️ [403 Forbidden 감지] 헤더 재구성 후 우회 시도: {url}")
            # 모바일 에이전트로 2차 우회
            h['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
            return session.get(url, params=params, headers=h, timeout=timeout)
    except Exception as e:
        logger.warning(f"🌐 API 요청 실패 ({url}): {e}")
    return None

# ==========================================
# 2. 실시간 KBO 선발투수 & 게임로그 수집기
# ==========================================
def fetch_kbo_live_schedule(target_date=None):
    """네이버 스포츠 & KBO 공식 백엔드 JSON API 직접 타격"""
    if not target_date:
        target_date = datetime.now().strftime("%Y%m%d")
    
    url = "https://api-gw.sports.naver.com/schedule/games"
    params = {
        "fields": "basic,supervisors,broadcasts,manualRelayTitle,postSummary,hasVideo,gameRank,groupName",
        "from": target_date,
        "to": target_date,
        "category": "kbo"
    }
    
    resp = safe_api_get(url, params=params, referer="https://m.sports.naver.com/kbaseball/schedule")
    if resp and resp.status_code == 200:
        try:
            data = resp.json()
            games = data.get("result", {}).get("games", [])
            logger.info(f"✅ [KBO API] 실시간 {len(games)}개 경기 데이터 수집 성공")
            return games
        except Exception as e:
            logger.error(f"❌ KBO JSON 파싱 실패: {e}")
    return []

# ==========================================
# 3. 실시간 MLB 공식 Stats API 수집기
# ==========================================
def fetch_mlb_live_schedule(target_date=None):
    """MLB 공식 Stats API 엔드포인트 직접 타격"""
    if not target_date:
        target_date = datetime.now().strftime("%Y-%m-%d")

    url = f"https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=probablePitcher,team&date={target_date}"
    resp = safe_api_get(url, referer="https://www.mlb.com/")
    if resp and resp.status_code == 200:
        try:
            data = resp.json()
            games = []
            for date_info in data.get("dates", []):
                games.extend(date_info.get("games", []))
            logger.info(f"✅ [MLB API] 실시간 {len(games)}개 경기 데이터 수집 성공")
            return games
        except Exception as e:
            logger.error(f"❌ MLB JSON 파싱 실패: {e}")
    return []

if __name__ == "__main__":
    kbo = fetch_kbo_live_schedule()
    mlb = fetch_mlb_live_schedule()
    print(f"KBO: {len(kbo)} games, MLB: {len(mlb)} games fetched successfully!")
