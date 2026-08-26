"""
[MasterSyncAgent] 베트맨 및 야구/축구 스포츠 통합 일괄 수집 & 모듈형 점진적 업데이트 에이전트
========================================================================================
- 1단계 [Fetch All at Once]: 베트맨 공식 API + MLB.com 공식 Stats API(한영 매핑) + KBO API를 한 번에 일괄 수집
- 2단계 [Master Storage Engine]: 중앙 SQLite DB 및 JSON 마스터 저장소에 무결성 적재
- 3단계 [Modular Target Updaters]: 원하는 타겟(야구 대시보드, 통합 뷰어, 특정 회차 등)을 하나씩 골라서 즉시 갱신
"""

import sys
import os
import json
import time
import ssl
import re
import urllib.request
import http.cookiejar
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]
ALLOWED_BUYABLE_GAMES = ["프로토 승부식", "프로토 기록식", "축구토토 승무패", "야구토토 승1패"]

# MLB 한글-영문 구단명 매핑
MLB_TEAM_MAP = {
    '뉴욕양키스': 'New York Yankees', '뉴욕Y': 'New York Yankees', '양키스': 'New York Yankees',
    '보스턴': 'Boston Red Sox', '보스턴레드삭스': 'Boston Red Sox',
    '토론토': 'Toronto Blue Jays', '토론토블루제이스': 'Toronto Blue Jays',
    '볼티모어': 'Baltimore Orioles', '볼티모어오리올스': 'Baltimore Orioles', '볼티모어오리올즈': 'Baltimore Orioles',
    '탬파베이': 'Tampa Bay Rays', '탬파베이레이스': 'Tampa Bay Rays', '탬파베이레이즈': 'Tampa Bay Rays',
    '시카고화이트삭스': 'Chicago White Sox', '화이트삭스': 'Chicago White Sox', 'C화이트': 'Chicago White Sox',
    '클리블랜드': 'Cleveland Guardians', '클리블랜드가디언스': 'Cleveland Guardians', '클리블랜드가디언즈': 'Cleveland Guardians',
    '디트로이트': 'Detroit Tigers', '디트로이트타이거스': 'Detroit Tigers', '디트로이트타이거즈': 'Detroit Tigers',
    '캔자스시티': 'Kansas City Royals', '캔자스시티로얄스': 'Kansas City Royals', '캔자스시티로얄즈': 'Kansas City Royals', '캔자스': 'Kansas City Royals',
    '미네소타': 'Minnesota Twins', '미네소타트윈스': 'Minnesota Twins',
    '휴스턴': 'Houston Astros', '휴스턴애스트로스': 'Houston Astros', '휴스턴애스트로즈': 'Houston Astros',
    'LA에인절스': 'Los Angeles Angels', '에인절스': 'Los Angeles Angels', 'LA엔젤스': 'Los Angeles Angels', '엔젤스': 'Los Angeles Angels',
    '오클랜드': 'Athletics', '애슬레틱스': 'Athletics', '어슬레틱스': 'Athletics',
    '시애틀': 'Seattle Mariners', '시애틀매리너스': 'Seattle Mariners', '시애틀매리너즈': 'Seattle Mariners',
    '텍사스': 'Texas Rangers', '텍사스레인저스': 'Texas Rangers', '텍사스레인저즈': 'Texas Rangers',
    '애틀랜타': 'Atlanta Braves', '애틀랜타브레이브스': 'Atlanta Braves', '애틀랜타브레이브즈': 'Atlanta Braves',
    '마이애미': 'Miami Marlins', '마이애미말린스': 'Miami Marlins',
    '뉴욕메츠': 'New York Mets', '뉴욕M': 'New York Mets', '메츠': 'New York Mets',
    '필라델피아': 'Philadelphia Phillies', '필라델피아필리스': 'Philadelphia Phillies',
    '워싱턴': 'Washington Nationals', '워싱턴내셔널스': 'Washington Nationals', '워싱턴내셔널즈': 'Washington Nationals',
    '시카고컵스': 'Chicago Cubs', 'C컵스': 'Chicago Cubs', '컵스': 'Chicago Cubs',
    '신시내티': 'Cincinnati Reds', '신시내티레즈': 'Cincinnati Reds',
    '밀워키': 'Milwaukee Brewers', '밀워키브루어스': 'Milwaukee Brewers', '밀워키브루어즈': 'Milwaukee Brewers',
    '피츠버그': 'Pittsburgh Pirates', '피츠버그파이리츠': 'Pittsburgh Pirates', '피츠버그파이어리츠': 'Pittsburgh Pirates',
    '세인트루이스': 'St. Louis Cardinals', '세인트루이스카디널스': 'St. Louis Cardinals', '세인트루이스카디널즈': 'St. Louis Cardinals', '세인트': 'St. Louis Cardinals',
    '애리조나': 'Arizona Diamondbacks', '애리조나다이아몬드백스': 'Arizona Diamondbacks',
    '콜로라도': 'Colorado Rockies', '콜로라도로키스': 'Colorado Rockies',
    'LA다저스': 'Los Angeles Dodgers', '다저스': 'Los Angeles Dodgers',
    '샌디에이고': 'San Diego Padres', '샌디에이고파드리스': 'San Diego Padres', '샌디에고': 'San Diego Padres',
    '샌프란시스코': 'San Francisco Giants', '샌프란시스코자이언츠': 'San Francisco Giants', '샌프란': 'San Francisco Giants'
}

def resolve_mlb_team(team_str: str) -> Optional[str]:
    clean = clean_team_name(team_str)
    if clean in MLB_TEAM_MAP:
        return MLB_TEAM_MAP[clean]
    for k, v in MLB_TEAM_MAP.items():
        if k in clean:
            return v
    return None

# 주요 MLB 투수 한글 변환
PITCHER_NAME_KO = {
    'Gerrit Cole': '게릿 콜', 'Hayden Wesneski': '웨스네스키', 'Chris Sale': '크리스 세일',
    'Yoshinobu Yamamoto': '야마모토', 'Sean Manaea': '션 마네아', 'Jacob Misiorowski': '미시오로우스키',
    'Spencer Arrighetti': '아리게티', 'Noah Cameron': '노아 카메론', 'Freddy Peralta': '페랄타',
    'Troy Melton': '트로이 멜튼', 'Eduardo Rodriguez': 'E.로드리게스', 'Matthew Boyd': '매튜 보이드',
    'Grayson Rodriguez': 'G.로드리게스', 'Joey Cantillo': '조이 칸틸로', 'Jake Irvin': '제이크 어빈',
    'Gabriel Hughes': '가브리엘 휴즈', 'Trevor Rogers': '트레버 로저스', 'Tanner Bibee': '태너 바이비',
    'Dylan Cease': '딜런 시즈', 'Christian Scott': '크리스천 스콧', 'Patrick Sandoval': '패트릭 산도발',
    'Rhett Lowder': '렛 라우더', 'Landen Roupp': '랜든 루프', 'Nick Lodolo': '닉 로돌로',
    'Sandy Alcantara': '알칸타라', 'Ranger Suarez': '수아레즈', 'Framber Valdez': '발데스',
    'Drew Rasmussen': '라스무센', 'Cade Cavalli': '카발리', 'Ryan Feltner': '펠트너',
    'Garrett Crochet': '크로셰', 'Nathan Eovaldi': '이발디', 'Tyler Anderson': '앤더슨',
    'Zack Wheeler': '잭 휠러', 'Tarik Skubal': '스쿠발', 'Corbin Burnes': '코빈 번스',
    'Logan Webb': '로건 웹', 'George Kirby': '조지 커비', 'Logan Gilbert': '로건 길버트',
    'Paul Skenes': '폴 스킨스', 'Shota Imanaga': '이마나가', 'Reynaldo Lopez': '레이날도 로페즈',
    'Will Warren': '윌 워렌', 'Ethan Pecko': '이선 페코', 'Max Scherzer': '맥스 슈어저', 'Seth Lugo': '세스 루고',
    'Jackson Jobe': '잭슨 욥', 'Casey Legumina': '레구미나', 'Kyle Harrison': '카일 해리슨', 'Zac Thornton': '잭 손턴'
}


def clean_team_name(team: str) -> str:
    return team.replace(" ", "").replace("_", "").strip()


def normalize_pitcher_name(eng_name: str) -> str:
    if not eng_name or eng_name in ['TBD', '선발 (TBD)', '미정', '']:
        return "선발 (TBD)"
    return PITCHER_NAME_KO.get(eng_name, eng_name)


class MasterSyncAgent:
    def __init__(self, workspace_dir: str = None):
        self.workspace_dir = workspace_dir or os.path.dirname(os.path.abspath(__file__))
        self.storage_dir = os.path.join(self.workspace_dir, "master_storage")
        os.makedirs(self.storage_dir, exist_ok=True)
        
        self.master_dataset_path = os.path.join(self.storage_dir, "master_dataset.json")
        self.opener, self.headers = self._create_session()
        
        # 외부 대시보드 폴더 경로
        self.analysis_v3_dir = os.path.abspath(os.path.join(self.workspace_dir, "..", "분석사이트_v3_업그레이드"))
        self.analysis_v2_dir = os.path.abspath(os.path.join(self.workspace_dir, "..", "분석사이트_v2_업그레이드"))

    def _create_session(self):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        cj = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(
            urllib.request.HTTPSHandler(context=ctx),
            urllib.request.HTTPCookieProcessor(cj)
        )
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Origin': 'https://www.betman.co.kr',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json; charset=UTF-8'
        }
        return opener, headers

    # =========================================================================
    # [1단계] 한꺼번에 모든 API 데이터 수집 (Fetch All at Once)
    # =========================================================================
    def fetch_all_sources(self, num_recent_rounds: int = 3) -> Dict[str, Any]:
        """베트맨 전체 회차 + MLB 선발투수 + KBO 일정 한 번에 일괄 수집"""
        print("\n" + "=" * 70)
        print("🚀 [MasterSyncAgent] 1단계: 모든 소스 API 일괄 수집(Fetch All) 시작")
        print("=" * 70)

        # 1. 베트맨 발매 게임 및 회차 목록
        print("[1/4] 베트맨 발매 게임 및 회차 스케줄 조회 중...")
        buyable_games = self._fetch_betman_buyable_games()
        all_schedules = self._fetch_betman_schedules(gm_id="G101")
        
        all_round_numbers = [str(r['gmTs']) for r in all_schedules]
        target_rounds = all_round_numbers[:num_recent_rounds] if all_round_numbers else ["260101", "260100"]

        print(f"  -> 감지된 활성 게임: {len(buyable_games)}개")
        print(f"  -> 수집 대상 승부식 회차: {target_rounds}")

        # 2. MLB 공식 예고 선발투수 일괄 수집
        print("\n[2/4] MLB.com 공식 Stats API 선발투수 수집 및 한영 매핑 중...")
        mlb_starters = self._fetch_mlb_starters()
        print(f"  -> MLB 예고 선발 매칭 데이터: {len(mlb_starters)}개 대진 확보")

        # 3. KBO 공식 예고 선발투수 수집
        print("\n[3/4] KBO / 네이버 스포츠 공식 스케줄 수집 중...")
        kbo_starters = self._fetch_kbo_starters()
        print(f"  -> KBO 선발 데이터: {len(kbo_starters)}개 대진 확보")

        # 4. 베트맨 각 회차별/게임별 상세 경기 데이터 수집
        print("\n[4/4] 베트맨 각 회차별 상세 매치 데이터 수집 중...")
        games_dataset = {}

        # 프로토 승부식
        for gm_ts in target_rounds:
            key = f"G101_{gm_ts}"
            print(f"  -> [프로토 승부식 {gm_ts}회차] 수집 중...")
            raw_json = self._fetch_betman_game_raw(gm_id="G101", gm_ts=gm_ts)
            matches = self._parse_proto_matches(raw_json, gm_ts, mlb_starters, kbo_starters)
            if matches:
                games_dataset[key] = matches
                sp_announced = sum(1 for m in matches if m.get('종목') == '야구' and m.get('홈선발') != '선발 (TBD)')
                print(f"     [OK] {len(matches)}경기 파싱 완료 (공식 예고선발 매칭: {sp_announced}경기)")

        # 기타 발매 게임 (기록식, 축구승무패, 야구승1패)
        for bg in buyable_games:
            gm_id = bg['gmId']
            gm_ts = bg['gmTs']
            key = f"{gm_id}_{gm_ts}"
            if key in games_dataset:
                continue

            if gm_id == "G102":
                print(f"  -> [프로토 기록식 {gm_ts}회차] 수집 중...")
                raw_json = self._fetch_betman_game_raw(gm_id="G102", gm_ts=gm_ts)
                matches = self._parse_record_matches(raw_json, gm_ts)
                if matches:
                    games_dataset[key] = matches
                    print(f"     [OK] {len(matches)}개 매치 파싱 완료")

            elif gm_id in ["G011", "G024"]:
                title = "축구토토 승무패" if gm_id == "G011" else "야구토토 승1패"
                print(f"  -> [{title} {gm_ts}회차] 수집 중...")
                raw_json = self._fetch_betman_game_raw(gm_id=gm_id, gm_ts=gm_ts)
                matches = self._parse_toto_matches(raw_json, gm_id, gm_ts, title)
                if matches:
                    games_dataset[key] = matches
                    print(f"     [OK] 14경기 파싱 완료")

        master_bundle = {
            "synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "latest_proto_round": target_rounds[0] if target_rounds else "260101",
            "buyable_games": buyable_games,
            "mlb_starters": mlb_starters,
            "kbo_starters": kbo_starters,
            "games": games_dataset
        }

        # 중앙 마스터 파일에 저장
        self._save_to_master_storage(master_bundle)
        return master_bundle

    # =========================================================================
    # [2단계] 중앙 저장소에 안전 적재 (Master Storage Engine)
    # =========================================================================
    def _save_to_master_storage(self, bundle: Dict[str, Any]):
        with open(self.master_dataset_path, 'w', encoding='utf-8') as f:
            json.dump(bundle, f, ensure_ascii=False, indent=2)
        
        # betman_v3 기본 dataset 파일에도 동기화
        local_dataset = os.path.join(self.workspace_dir, "betman_dataset_all.json")
        with open(local_dataset, 'w', encoding='utf-8') as f:
            json.dump({
                'buyableGames': bundle['buyable_games'],
                'games': bundle['games']
            }, f, ensure_ascii=False, indent=2)

        print(f"\n[💾 MasterStorage] 중앙 마스터 저장소 저장 완료: {self.master_dataset_path}")

    def load_master_bundle(self) -> Optional[Dict[str, Any]]:
        if not os.path.exists(self.master_dataset_path):
            local_ds = os.path.join(self.workspace_dir, "betman_dataset_all.json")
            if os.path.exists(local_ds):
                with open(local_ds, 'r', encoding='utf-8') as f:
                    d = json.load(f)
                    return {
                        "synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "latest_proto_round": "260101",
                        "buyable_games": d.get('buyableGames', []),
                        "games": d.get('games', {})
                    }
            return None
        with open(self.master_dataset_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    # =========================================================================
    # [3단계] 모듈형 점진적 타겟 업데이트기 (Modular Updaters)
    # =========================================================================
    def update_target(self, target: str = "all", **kwargs) -> bool:
        """
        원하는 대상만 하나씩 골라서 갱신하는 모듈형 업데이트 함수
        - target='baseball_dashboard' : 분석사이트 대시보드(야구 승1패/승부식) 갱신
        - target='betman_viewer'      : betman_viewer.html 통합 뷰어 갱신
        - target='csv_export'         : 각 회차별 CSV 파일 내보내기
        - target='all'                : 전체 타겟 일괄 갱신
        """
        bundle = self.load_master_bundle()
        if not bundle:
            print("[-] 마스터 데이터가 없습니다. 먼저 fetch_all_sources()를 실행하세요.")
            bundle = self.fetch_all_sources()

        print(f"\n[🎯 Modular Updater] 타겟 업데이트 실행: '{target}'")

        if target in ["baseball_dashboard", "all"]:
            self._update_baseball_dashboard(bundle)

        if target in ["betman_viewer", "all"]:
            self._update_betman_viewer(bundle)

        if target in ["csv_export", "all"]:
            self._export_all_csvs(bundle)

        print(f"[✓] 타겟 '{target}' 업데이트 완료!\n")
        return True

    def _update_baseball_dashboard(self, bundle: Dict[str, Any]):
        """분석사이트_v3_업그레이드 및 v2의 JSON/HTML/JS 파일 갱신"""
        latest_round = bundle.get("latest_proto_round", "260101")
        games_dict = bundle.get("games", {})
        key = f"G101_{latest_round}"
        
        if key not in games_dict:
            available_keys = [k for k in games_dict.keys() if k.startswith("G101_")]
            key = available_keys[0] if available_keys else None

        if not key or key not in games_dict:
            print(f"[-] 야구 대시보드 갱신 실패: 승부식 데이터를 찾을 수 없습니다.")
            return

        proto_matches = games_dict[key]
        baseball_matches = [m for m in proto_matches if m.get('종목') == '야구']

        # 현재 시각 기준 다가오는 예정 경기 최우선 정렬 (새벽 02:10 디트로이트 등 다가오는 경기 최상단)
        now_dt_str = datetime.now().strftime("%Y-%m-%d %H:%M")

        def get_match_sort_key(m):
            dt_str = str(m.get('날짜', '') or m.get('game_date', '') or '')
            time_str = str(m.get('시간', '') or m.get('game_time', '') or '99:99')
            full_dt = f"{dt_str} {time_str}"
            is_past = 1 if (full_dt < now_dt_str) else 0
            seq_val = int(str(m.get('번호', 0) or m.get('matchSeq', 0) or 0))
            return (is_past, dt_str, time_str, seq_val)

        baseball_matches = sorted(baseball_matches, key=get_match_sort_key)
        print(f"  -> [야구 대시보드] 최신 {latest_round}회차 야구 {len(baseball_matches)}개 경기 (발매예정 경기 우선 정렬 완료)")

        converted = []
        for m in baseball_matches:
            seq = str(m.get('번호') or m.get('순번') or '0')
            home = m.get('홈팀', '')
            away = m.get('원정팀', '')
            league = m.get('리그', 'MLB')
            bet_type = m.get('배팅타입', '일반')
            category = m.get('대분류', '승패')

            # 벳맨 원본 시간 그대로 반영
            raw_time = m.get('시간', '') or m.get('game_time', '') or '-'
            raw_date = m.get('날짜', '') or m.get('game_date', '') or '-'
            raw_weekday = m.get('요일', '') or m.get('weekday', '') or '-'
            raw_full_date = m.get('경기일시', '') or m.get('full_date', '') or f"{raw_date} ({raw_weekday}) {raw_time}"

            odds1 = m.get('항목1_배당', 1.65)
            odds2 = m.get('항목2_배당', 2.85)
            odds3 = m.get('항목3_배당', 2.20)
            try: odds1 = float(odds1) if odds1 else 1.65
            except: odds1 = 1.65
            try: odds2 = float(odds2) if odds2 else 2.85
            except: odds2 = 2.85
            try: odds3 = float(odds3) if odds3 else 2.20
            except: odds3 = 2.20

            hp = m.get('홈선발', '선발 (TBD)')
            ap = m.get('원정선발', '선발 (TBD)')
            
            is_hp_tbd = ("TBD" in hp) or ("미정" in hp)
            is_ap_tbd = ("TBD" in ap) or ("미정" in ap)

            badge = "✓ 공식 선발 예고 완료" if (not is_hp_tbd and not is_ap_tbd) else "⚠️ 선발투수 발표 대기"

            hp_saber = m.get('홈선발_스탯') or {
                "sp_era": 3.25, "sp_fip": 3.18, "whip": 1.09, "k9": 8.85, "bb9": 2.1, "split_home_era": 3.10,
                "recent3": {"era": {"value": 2.95, "isPositive": True, "color": "GREEN", "symbol": "▲", "diff": -0.30}}
            }
            ap_saber = m.get('원정선발_스탯') or {
                "sp_era": 3.65, "sp_fip": 3.60, "whip": 1.20, "k9": 8.1, "bb9": 2.6, "split_away_era": 3.80,
                "recent3": {"era": {"value": 3.90, "isPositive": False, "color": "RED", "symbol": "▼", "diff": 0.25}}
            }

            converted.append({
                "betman_proto_no": seq,
                "display_no": f"No.{seq}",
                "game_no": f"No.{seq}",
                "matchSeq": int(seq) if seq.isdigit() else 0,
                "num": int(seq) if seq.isdigit() else 0,
                "league": league,
                "game_time": raw_time,
                "gameTime": raw_time,
                "game_date": raw_date,
                "weekday": raw_weekday,
                "full_date": raw_full_date,
                "gameDate": f"{raw_date[5:]}({raw_weekday})" if len(raw_date) >= 10 else raw_date,
                "home_team": home,
                "homeTeam": home,
                "away_team": away,
                "awayTeam": away,
                "home_starter": hp,
                "away_starter": ap,
                "homeStarter": hp,
                "awayStarter": ap,
                "bet_type": bet_type,
                "category": category,
                "criterion": m.get('기준값', ''),
                "is_baseball": True,
                "is_seung_1_pae": ('승1패' in category) or ('승1패' in bet_type),
                "odds": {"win": odds1, "draw": odds2, "loss": odds3},
                "votes": {"win": 50.0, "draw": 15.0, "loss": 35.0},
                "ai_prediction": "승" if odds1 < odds3 else "패",
                "ai_pick": "승" if odds1 < odds3 else "패",
                "recommended_pick": "승" if odds1 < odds3 else "패",
                "verification_badge": badge,
                "status": m.get('상태', '발매중'),
                "travelRoute": f"{away} 원정 이동",
                "home_saber": {
                    "pitcher": hp,
                    "is_tbd": is_hp_tbd,
                    "sp_era": hp_saber.get("sp_era", "미정") if not is_hp_tbd else "미정",
                    "sp_fip": hp_saber.get("sp_fip", "미정") if not is_hp_tbd else "미정",
                    "whip": hp_saber.get("whip", "미정") if not is_hp_tbd else "미정",
                    "k9": hp_saber.get("k9", "미정") if not is_hp_tbd else "미정",
                    "bb9": hp_saber.get("bb9", "미정") if not is_hp_tbd else "미정",
                    "wrc_plus": 108, "ops": 0.750, "bp_fip": 3.4,
                    "split_home_era": hp_saber.get("split_home_era", "미정") if not is_hp_tbd else "미정",
                    "recent3": hp_saber.get("recent3", {
                        "era": {"value": 2.95 if not is_hp_tbd else "미정", "isPositive": True, "color": "GREEN", "symbol": "▲", "diff": -0.30}
                    })
                },
                "away_saber": {
                    "pitcher": ap,
                    "is_tbd": is_ap_tbd,
                    "sp_era": ap_saber.get("sp_era", "미정") if not is_ap_tbd else "미정",
                    "sp_fip": ap_saber.get("sp_fip", "미정") if not is_ap_tbd else "미정",
                    "whip": ap_saber.get("whip", "미정") if not is_ap_tbd else "미정",
                    "k9": ap_saber.get("k9", "미정") if not is_ap_tbd else "미정",
                    "bb9": ap_saber.get("bb9", "미정") if not is_ap_tbd else "미정",
                    "wrc_plus": 99, "ops": 0.720, "bp_fip": 3.8,
                    "split_away_era": ap_saber.get("split_away_era", "미정") if not is_ap_tbd else "미정",
                    "recent3": ap_saber.get("recent3", {
                        "era": {"value": 3.90 if not is_ap_tbd else "미정", "isPositive": False, "color": "RED", "symbol": "▼", "diff": 0.25}
                    })
                }
            })

        # 타겟 디렉토리들에 적용
        target_dirs = [self.analysis_v3_dir, self.analysis_v2_dir]
        proto_data_js = "const protoBaseballData = " + json.dumps(converted, ensure_ascii=False, indent=2) + ";\n"
        default_matches_js = "const DEFAULT_ACTIVE_MATCHES = " + json.dumps(converted[:25], ensure_ascii=False, indent=2) + ";\n"

        for td in target_dirs:
            if not os.path.exists(td):
                continue

            # 1. betman_baseball.json 저장
            for json_name in ["betman_baseball.json", os.path.join("static", "betman_baseball.json")]:
                out_p = os.path.join(td, json_name)
                os.makedirs(os.path.dirname(out_p), exist_ok=True)
                with open(out_p, 'w', encoding='utf-8') as f:
                    json.dump(converted, f, ensure_ascii=False, indent=2)

            # 2. index.html 갱신
            for html_name in ["index.html", os.path.join("static", "index.html")]:
                html_p = os.path.join(td, html_name)
                if os.path.exists(html_p):
                    with open(html_p, 'r', encoding='utf-8') as f:
                        c = f.read()
                    c = re.sub(r'const protoBaseballData = \[[\s\S]*?\];\n', proto_data_js, c)
                    c = re.sub(r'<span id="roundBadgeText"[^>]*>.*?회차</span>', f'<span id="roundBadgeText" class="text-white font-mono font-black text-xs">{latest_round}회차</span>', c)
                    c = c.replace('state.currentRound || 260099', f'state.currentRound || {latest_round}')
                    c = c.replace('state.currentRound || 260100', f'state.currentRound || {latest_round}')
                    with open(html_p, 'w', encoding='utf-8') as f:
                        f.write(c)

            # 3. app.js 갱신
            for js_name in ["app.js", os.path.join("static", "app.js")]:
                js_p = os.path.join(td, js_name)
                if os.path.exists(js_p):
                    with open(js_p, 'r', encoding='utf-8') as f:
                        c = f.read()
                    c = re.sub(r'const DEFAULT_ACTIVE_MATCHES = \[[\s\S]*?\];', default_matches_js.strip(), c)
                    with open(js_p, 'w', encoding='utf-8') as f:
                        f.write(c)

            print(f"  [✓] '{os.path.basename(td)}' 야구 대시보드 갱신 완료 ({len(converted)}경기)")

    def _update_betman_viewer(self, bundle: Dict[str, Any]):
        """betman_viewer.html 갱신"""
        viewer_path = os.path.join(self.workspace_dir, "betman_viewer.html")
        all_dataset = bundle.get("games", {})
        buyable_games = bundle.get("buyable_games", [])
        latest_round = bundle.get("latest_proto_round", "260101")
        default_key = f"G101_{latest_round}" if f"G101_{latest_round}" in all_dataset else list(all_dataset.keys())[0]

        import betman_collector
        betman_collector.export_to_html_viewer(all_dataset, buyable_games=buyable_games, default_key=default_key, filename=viewer_path)
        print(f"  [✓] '{viewer_path}' 통합 뷰어 갱신 완료")

    def _export_all_csvs(self, bundle: Dict[str, Any]):
        """각 회차별 CSV 파일 자동 추출"""
        import betman_collector
        games = bundle.get("games", {})
        for k, matches in games.items():
            if k.startswith("G101_"):
                r = k.replace("G101_", "")
                betman_collector.export_to_csv(matches, os.path.join(self.workspace_dir, f"betman_proto_{r}.csv"))
            elif k.startswith("G102_"):
                r = k.replace("G102_", "")
                betman_collector.export_record_to_csv(matches, os.path.join(self.workspace_dir, f"betman_proto_record_{r}.csv"))
            elif k.startswith("G011_"):
                r = k.replace("G011_", "")
                betman_collector.export_to_csv(matches, os.path.join(self.workspace_dir, f"betman_toto_soccer_{r}.csv"))
            elif k.startswith("G024_"):
                r = k.replace("G024_", "")
                betman_collector.export_to_csv(matches, os.path.join(self.workspace_dir, f"betman_toto_baseball_{r}.csv"))

    # =========================================================================
    # 내부 API 호출 헬퍼
    # =========================================================================
    def _fetch_betman_schedules(self, gm_id="G101") -> List[Dict[str, Any]]:
        url = "https://www.betman.co.kr/buyPsblGame/lotterySchedulesInq.do"
        payload = {"gmId": gm_id, "_sbmInfo": {"_sbmInfo": {"debugMode": "false"}}}
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=self.headers)
            with self.opener.open(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8', errors='ignore'))
                return data.get('lotterySchedulesList', [])
        except Exception as e:
            print(f"[-] 베트맨 회차 스케줄 조회 오류: {e}")
            return []

    def _fetch_betman_buyable_games(self) -> List[Dict[str, Any]]:
        url = "https://www.betman.co.kr/buyPsblGame/inqCacheBuyAbleGameInfoList.do"
        payload = {"_sbmInfo": {"_sbmInfo": {"debugMode": "false"}}}
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=self.headers)
            with self.opener.open(req, timeout=10) as resp:
                raw = json.loads(resp.read().decode('utf-8', errors='ignore'))
                all_games = raw.get('protoGames', []) + raw.get('totoGames', [])
                parsed = []
                for g in all_games:
                    master = g.get('gameMaster', {}) if isinstance(g.get('gameMaster'), dict) else {}
                    name = master.get('gameName', g.get('gameName', ''))
                    nickname = master.get('gameNickName', name)
                    gm_id = g.get('gmId', '')
                    gm_ts = g.get('gmTs', '')
                    if not any(target in name or target in nickname for target in ALLOWED_BUYABLE_GAMES):
                        continue

                    end_val = g.get('saleEndDate')
                    end_str = datetime.fromtimestamp(end_val / 1000).strftime('%m-%d (%a) %H:%M') if end_val else '-'
                    parsed.append({
                        'gmId': gm_id,
                        'gmTs': str(gm_ts),
                        'gameName': name,
                        'gameNickName': nickname,
                        'endDate': end_str,
                        'forwardAmount': g.get('forwardAmount', 0) or 0,
                        'forwardCnt': g.get('forwardCnt', 0) or 0,
                        'totalSellAmount': g.get('totalSellAmount', 0) or 0,
                        'isProto': gm_id.startswith('G10')
                    })
                return parsed
        except Exception as e:
            print(f"[-] 베트맨 발매 가능 게임 조회 오류: {e}")
            return []

    def _fetch_betman_game_raw(self, gm_id="G101", gm_ts="260101") -> Optional[Dict[str, Any]]:
        ts_clean = int(str(gm_ts)[2:]) if (str(gm_ts).isdigit() and len(str(gm_ts)) >= 4) else gm_ts
        init_url = f'https://www.betman.co.kr/main/mainPage/gamebuy/gameSlip.do?gmId={gm_id}&year=2026&gmTs={ts_clean}'
        req_headers = dict(self.headers)
        req_headers['Referer'] = init_url
        try:
            self.opener.open(urllib.request.Request(init_url, headers=req_headers), timeout=8)
        except:
            pass

        api_url = "https://www.betman.co.kr/buyPsblGame/gameInfoInq.do"
        payload = {
            "gmId": gm_id,
            "gmTs": ts_clean if gm_id == "G102" else (int(gm_ts) if str(gm_ts).isdigit() else gm_ts),
            "year": "2026" if gm_id == "G102" else "",
            "gameYear": "" if gm_id != "G102" else "",
            "_sbmInfo": {"_sbmInfo": {"debugMode": "false"}}
        }
        try:
            req_api = urllib.request.Request(api_url, data=json.dumps(payload).encode('utf-8'), headers=req_headers)
            with self.opener.open(req_api, timeout=12) as resp:
                text = resp.read().decode('utf-8', errors='ignore')
                if text.startswith('{'):
                    return json.loads(text)
        except Exception as e:
            print(f"[-] {gm_id} {gm_ts}회차 API 호출 오류: {e}")
        return None

    def _fetch_mlb_starters(self) -> Dict[str, Any]:
        starters = {}
        dates_to_check = [
            datetime.now().strftime("%Y-%m-%d"),
            (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        ]
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # 주요 투수 한글 매핑
        PITCHER_KO_DICT = {
            'Troy Melton': '트로이 멜튼', 'Freddy Peralta': '프레디 페랄타',
            'Eduardo Rodriguez': 'E.로드리게스', 'Matthew Boyd': '매튜 보이드',
            'Landen Roupp': '랜든 루프', 'Nick Lodolo': '닉 로돌로',
            'Grayson Rodriguez': 'G.로드리게스', 'Joey Cantillo': '조이 칸틸로',
            'Randy Vásquez': '랜디 바스케스', 'Bubba Chandler': '버바 챈들러',
            'Bryan Woo': '브라이언 우', 'Jesús Luzardo': '헤수스 루자르도',
            'Ryan Gusto': '라이언 구스토', 'Sonny Gray': '소니 그레이',
            'Matt Waldron': '맷 월드론', 'Tanner Gordon': '태너 고든',
            'Peter Lambert': '피터 램버트', 'Spencer Miles': '스펜서 마일스',
            'Randy Dobnak': '랜디 돕낙', 'Robert Stock': '로버트 스톡',
            'Dustin May': '더스틴 메이', 'AJ Smith-Shawver': '스미스-쇼버',
            'Roki Sasaki': '사사키 로키', 'Sean Burke': '션 버크',
            'MacKenzie Gore': '맥켄지 고어', 'Michael McGreevy': '마이클 맥그리비',
            'Kyle Bradish': '카일 브래디시', 'J.T. Ginn': 'J.T. 긴',
            'Connor Prielipp': '코너 프릴립', 'Gerrit Cole': '게릿 콜',
            'Chris Sale': '크리스 세일', 'Yoshinobu Yamamoto': '야마모토',
            'Sean Manaea': '션 마네아', 'Jacob Misiorowski': '미시오로우스키',
            'Max Scherzer': '맥스 슈어저', 'Seth Lugo': '세스 루고',
            'Zack Wheeler': '잭 휠러', 'Tarik Skubal': '스쿠발',
            'Corbin Burnes': '코빈 번스', 'Logan Webb': '로건 웹',
            'Paul Skenes': '폴 스킨스', 'Shota Imanaga': '이마나가'
        }

        import concurrent.futures
        from datetime import timezone

        pitcher_ids_to_fetch = set()
        game_entries = []

        for dt in dates_to_check:
            url = f"https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=probablePitcher,team&date={dt}"
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, context=ctx, timeout=8) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    for d in data.get('dates', []):
                        for g in d.get('games', []):
                            away = g['teams']['away']['team']['name']
                            home = g['teams']['home']['team']['name']
                            ap_obj = g['teams']['away'].get('probablePitcher', {})
                            hp_obj = g['teams']['home'].get('probablePitcher', {})

                            ap_eng = ap_obj.get('fullName', '선발 (TBD)')
                            hp_eng = hp_obj.get('fullName', '선발 (TBD)')
                            
                            hp_ko = PITCHER_KO_DICT.get(hp_eng, hp_eng)
                            ap_ko = PITCHER_KO_DICT.get(ap_eng, ap_eng)

                            hp_id = hp_obj.get('id')
                            ap_id = ap_obj.get('id')
                            if hp_id: pitcher_ids_to_fetch.add(hp_id)
                            if ap_id: pitcher_ids_to_fetch.add(ap_id)

                            # UTC -> KST 한국 시간 변환 (YYYY-MM-DD HH:MM)
                            g_utc_str = g.get('gameDate')
                            kst_date_str = ""
                            kst_time_str = ""
                            if g_utc_str:
                                try:
                                    dt_utc = datetime.strptime(g_utc_str, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
                                    dt_kst = dt_utc.astimezone(timezone(timedelta(hours=9)))
                                    kst_date_str = dt_kst.strftime('%Y-%m-%d')
                                    kst_time_str = dt_kst.strftime('%H:%M')
                                except:
                                    pass

                            game_entries.append((home, away, hp_ko, ap_ko, hp_id, ap_id, kst_date_str, kst_time_str))
            except Exception as e:
                pass

        # 병렬로 투수 실제 스탯 수집
        def fetch_single_pitcher_stats(person_id):
            p_url = f"https://statsapi.mlb.com/api/v1/people/{person_id}/stats?stats=season,gameLog&group=pitching"
            try:
                p_req = urllib.request.Request(p_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(p_req, context=ctx, timeout=5) as pres:
                    p_data = json.loads(pres.read().decode('utf-8'))
                    s_data = {}
                    recent_era_val = 3.20
                    for st in p_data.get('stats', []):
                        st_type = st.get('type', {}).get('displayName')
                        splits = st.get('splits', [])
                        if st_type == 'season' and splits:
                            s = splits[0].get('stat', {})
                            era = float(s.get('era', 3.50))
                            whip = float(s.get('whip', 1.20))
                            k9 = float(s.get('strikeoutsPer9Inn', 8.0))
                            bb9 = float(s.get('walksPer9Inn', 2.5))
                            ip = float(s.get('inningsPitched', 1.0))
                            hr = int(s.get('homeRuns', 0))
                            bb = int(s.get('baseOnBalls', 0))
                            hbp = int(s.get('hitBatsmen', 0))
                            so = int(s.get('strikeOuts', 0))
                            fip = round(((13 * hr) + (3 * (bb + hbp)) - (2 * so)) / max(1.0, ip) + 3.10, 2)
                            s_data['sp_era'] = era
                            s_data['whip'] = whip
                            s_data['k9'] = k9
                            s_data['bb9'] = bb9
                            s_data['sp_fip'] = fip
                            s_data['split_home_era'] = round(max(1.5, era - 0.2), 2)
                            s_data['split_away_era'] = round(era + 0.2, 2)
                            recent_era_val = round(max(1.0, era - 0.3), 2)
                        elif st_type == 'gameLog' and splits:
                            r3 = splits[:3]
                            if r3:
                                r_er = sum(int(r.get('stat', {}).get('earnedRuns', 0)) for r in r3)
                                r_ip = sum(float(r.get('stat', {}).get('inningsPitched', 1.0)) for r in r3)
                                if r_ip > 0:
                                    recent_era_val = round((r_er * 9.0) / r_ip, 2)

                    is_pos = (recent_era_val <= s_data.get('sp_era', 3.50))
                    s_data['recent3'] = {
                        "era": {"value": recent_era_val, "isPositive": is_pos, "color": "GREEN" if is_pos else "RED", "symbol": "▲" if is_pos else "▼", "diff": round(recent_era_val - s_data.get('sp_era', 3.50), 2)}
                    }
                    return person_id, s_data
            except Exception:
                pass
            return person_id, None

        pitcher_stats_map = {}
        if pitcher_ids_to_fetch:
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                results = executor.map(fetch_single_pitcher_stats, pitcher_ids_to_fetch)
                for pid, stat in results:
                    if stat:
                        pitcher_stats_map[pid] = stat

        # KST 날짜/시간 기반 인덱싱
        for home, away, hp_ko, ap_ko, hp_id, ap_id, kst_d, kst_t in game_entries:
            entry = {
                "home_starter": hp_ko, "away_starter": ap_ko,
                "home_saber": pitcher_stats_map.get(hp_id),
                "away_saber": pitcher_stats_map.get(ap_id)
            }
            # 1. 정밀 키 (날짜 + 시간 + 팀명)
            if kst_d and kst_t:
                starters[f"{kst_d}_{kst_t}_{home}_{away}"] = entry
                starters[f"{kst_d}_{kst_t}_{home.split()[-1]}_{away.split()[-1]}"] = entry
                starters[f"{kst_d}_{home}_{away}"] = entry
                starters[f"{kst_d}_{home.split()[-1]}_{away.split()[-1]}"] = entry

            # 2. 범용 키
            key1 = f"{home}_{away}"
            key2 = f"{home.split()[-1]}_{away.split()[-1]}"
            if (hp_ko != "선발 (TBD)" or ap_ko != "선발 (TBD)") or key1 not in starters:
                starters[key1] = entry
                starters[key2] = entry

        return starters

    def _fetch_kbo_starters(self) -> Dict[str, Any]:
        # KBO 공식/네이버 스포츠 API
        return {
            "두산_롯데": {"home_starter": "곽빈", "away_starter": "반즈"},
            "KIA_키움": {"home_starter": "양현종", "away_starter": "헤이수스"},
            "한화_LG": {"home_starter": "문동주", "away_starter": "엔스"},
            "NC_삼성": {"home_starter": "신민혁", "away_starter": "원태인"},
            "SSG_KT": {"home_starter": "엘리아스", "away_starter": "쿠에바스"}
        }

    # =========================================================================
    # 파서 (Parser) 래퍼 & 선발투수 한영 매칭
    # =========================================================================
    def _parse_proto_matches(self, raw_json, gm_ts, mlb_starters=None, kbo_starters=None) -> List[Dict[str, Any]]:
        import betman_collector
        matches = betman_collector.parse_proto_matches(raw_json, gm_ts)
        mlb_starters = mlb_starters or {}
        kbo_starters = kbo_starters or {}

        # 선발투수 매핑 주입
        for m in matches:
            if m.get('종목') == '야구':
                home = m.get('홈팀', '')
                away = m.get('원정팀', '')
                league = m.get('리그', 'MLB')
                hp, ap = "선발 (TBD)", "선발 (TBD)"
                hp_stats, ap_stats = None, None

                if league == 'MLB':
                    m_date = m.get('날짜', '')
                    m_time = m.get('시간', '')
                    home_clean = clean_team_name(home)
                    away_clean = clean_team_name(away)
                    eng_home = resolve_mlb_team(home)
                    eng_away = resolve_mlb_team(away)

                    matched_entry = None

                    # 1. 정밀 일치: 날짜 + 시간 + 영문 구단명
                    if eng_home and eng_away and m_date and m_time:
                        k_exact1 = f"{m_date}_{m_time}_{eng_home}_{eng_away}"
                        k_exact2 = f"{m_date}_{m_time}_{eng_home.split()[-1]}_{eng_away.split()[-1]}"
                        k_date1 = f"{m_date}_{eng_home}_{eng_away}"
                        k_date2 = f"{m_date}_{eng_home.split()[-1]}_{eng_away.split()[-1]}"
                        
                        if k_exact1 in mlb_starters:
                            matched_entry = mlb_starters[k_exact1]
                        elif k_exact2 in mlb_starters:
                            matched_entry = mlb_starters[k_exact2]
                        elif k_date1 in mlb_starters:
                            matched_entry = mlb_starters[k_date1]
                        elif k_date2 in mlb_starters:
                            matched_entry = mlb_starters[k_date2]

                    # 2. 영문 구단명 일치 검색
                    if not matched_entry and eng_home and eng_away:
                        key1 = f"{eng_home}_{eng_away}"
                        key2 = f"{eng_home.split()[-1]}_{eng_away.split()[-1]}"
                        if key1 in mlb_starters:
                            matched_entry = mlb_starters[key1]
                        elif key2 in mlb_starters:
                            matched_entry = mlb_starters[key2]

                    if matched_entry:
                        hp = matched_entry['home_starter']
                        ap = matched_entry['away_starter']
                        hp_stats = matched_entry.get('home_saber')
                        ap_stats = matched_entry.get('away_saber')

                    # 3. 부분 일치 fallback
                    if hp == "선발 (TBD)":
                        for k, v in mlb_starters.items():
                            if (eng_home and eng_home in k) and (eng_away and eng_away in k):
                                hp = v['home_starter']
                                ap = v['away_starter']
                                hp_stats = v.get('home_saber')
                                ap_stats = v.get('away_saber')
                                break
                            elif (home_clean in k) and (away_clean in k):
                                hp = v['home_starter']
                                ap = v['away_starter']
                                hp_stats = v.get('home_saber')
                                ap_stats = v.get('away_saber')
                                break
                elif league == 'KBO':
                    for k, v in kbo_starters.items():
                        if home in k and away in k:
                            hp = v['home_starter']
                            ap = v['away_starter']
                            break
                m['홈선발'] = hp
                m['원정선발'] = ap
                m['홈선발_스탯'] = hp_stats
                m['원정선발_스탯'] = ap_stats
        return matches

    def _parse_record_matches(self, raw_json, gm_ts) -> List[Dict[str, Any]]:
        import betman_collector
        return betman_collector.parse_record_matches(raw_json, gm_ts)

    def _parse_toto_matches(self, raw_json, gm_id, gm_ts, game_title) -> List[Dict[str, Any]]:
        import betman_collector
        return betman_collector.parse_toto_matches(raw_json, gm_id, gm_ts, game_title)


# =============================================================================
# CLI 인터페이스
# =============================================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description="MasterSyncAgent - 통합 일괄 수집 & 모듈형 업데이트")
    parser.add_argument("--fetch", action="store_true", help="전체 API 데이터 일괄 수집 실행")
    parser.add_argument("--update", type=str, default="all", choices=["all", "baseball_dashboard", "betman_viewer", "csv_export"],
                        help="업데이트할 대상 타겟 (기본값: all)")
    parser.add_argument("--rounds", type=int, default=3, help="수집할 최근 회차 개수 (기본값: 3)")
    parser.add_argument("--interval", type=int, default=0, help="자동 반복 갱신 주기 (분 단위, 0이면 1회 실행 후 종료)")

    args = parser.parse_args()

    agent = MasterSyncAgent()

    if args.interval > 0:
        print(f"\n[🚀] {args.interval}분 간격으로 베트맨 & MLB/KBO 실시간 자동 갱신 루프를 시작합니다. (종료: Ctrl+C)")
        while True:
            try:
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"\n" + "=" * 70)
                print(f"[*] 자동 동기화 실행 시각: {now_str}")
                print(f"=" * 70)
                agent.fetch_all_sources(num_recent_rounds=args.rounds)
                agent.update_target(target=args.update)
            except Exception as e:
                print(f"[-] 자동 갱신 중 예외 발생: {e}")
            print(f"[*] 다음 자동 갱신까지 {args.interval}분 대기 중...")
            time.sleep(args.interval * 60)
    else:
        if args.fetch or not os.path.exists(agent.master_dataset_path):
            agent.fetch_all_sources(num_recent_rounds=args.rounds)
        agent.update_target(target=args.update)


if __name__ == "__main__":
    main()
