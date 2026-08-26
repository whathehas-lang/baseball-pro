"""
베트맨(Betman) V3 - 우측 마킹 저장 보관함(Slip Storage Vault) & 실시간 복원 시스템 탑재
- [우측 저장 보관함]: 마킹 완료 후 [💾 내 보관함에 저장] 클릭 시 우측에 카드 형태로 영구 보관 (LocalStorage 연동)
- [슬립 원클릭 불러오기]: 보관된 슬립 클릭 시 해당 14경기 마킹 상태를 화면에 즉시 복원
- [슬립 메모 & 내역 관리]: 슬립별 조합수, 구매금액, 적중확률, 저장시간, 14경기 마킹 요약 표시 & 개별/전체 삭제
- [1~96게임 중복베팅 게이지 & 확률 분석기]: 단식/복식 분류 및 실시간 확률/당첨자 계산
"""

import sys
import os
import json
import csv
import ssl
import time
import argparse
import urllib.request
import http.cookiejar
from datetime import datetime

WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]
ALLOWED_BUYABLE_GAMES = ["프로토 승부식", "프로토 기록식", "축구토토 승무패", "야구토토 승1패"]

def create_session():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPSHandler(context=ctx),
        urllib.request.HTTPCookieProcessor(cj)
    )
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://www.betman.co.kr',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json; charset=UTF-8'
    }
    return opener, headers


def get_available_rounds(opener, headers, gm_id="G101", max_retries=3):
    url = "https://www.betman.co.kr/buyPsblGame/lotterySchedulesInq.do"
    payload = {"gmId": gm_id, "_sbmInfo": { "_sbmInfo": { "debugMode": "false" } }}
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with opener.open(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8', errors='ignore'))
                return data.get('lotterySchedulesList', [])
        except Exception as e:
            if attempt < max_retries:
                time.sleep(1)
            else:
                return []


def fetch_buyable_games(opener, headers, max_retries=3):
    url = "https://www.betman.co.kr/buyPsblGame/inqCacheBuyAbleGameInfoList.do"
    payload = {"_sbmInfo": { "_sbmInfo": { "debugMode": "false" } }}
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with opener.open(req, timeout=10) as resp:
                raw = json.loads(resp.read().decode('utf-8', errors='ignore'))
                proto_games = raw.get('protoGames', [])
                toto_games = raw.get('totoGames', [])
                all_games = proto_games + toto_games

                parsed = []
                for g in all_games:
                    master = g.get('gameMaster', {}) if isinstance(g.get('gameMaster'), dict) else {}
                    name = master.get('gameName', g.get('gameName', ''))
                    nickname = master.get('gameNickName', name)
                    gm_id = g.get('gmId', '')
                    gm_ts = g.get('gmTs', '')
                    
                    is_target = any(target in name or target in nickname for target in ALLOWED_BUYABLE_GAMES)
                    if not is_target:
                        continue

                    end_val = g.get('saleEndDate')
                    if end_val:
                        end_dt = datetime.fromtimestamp(end_val / 1000)
                        end_str = end_dt.strftime('%m-%d (%a) %H:%M').replace('Mon','월').replace('Tue','화').replace('Wed','수').replace('Thu','목').replace('Fri','금').replace('Sat','토').replace('Sun','일')
                    else:
                        end_str = '-'

                    forward_amt = g.get('forwardAmount', 0) or 0
                    forward_cnt = g.get('forwardCnt', 0) or 0
                    total_sell = g.get('totalSellAmount', 0) or 0
                    
                    sports_info = master.get('sportsItem', {}) if isinstance(master.get('sportsItem'), dict) else {}
                    sport_name = sports_info.get('sportsItemName', '기타')
                    if gm_id.startswith('G10'):
                        sport_name = '프로토'

                    parsed.append({
                        'gmId': gm_id,
                        'gmTs': str(gm_ts),
                        'gameName': name,
                        'gameNickName': nickname,
                        'sport': sport_name,
                        'endDate': end_str,
                        'forwardAmount': forward_amt,
                        'forwardCnt': forward_cnt,
                        'totalSellAmount': total_sell,
                        'isProto': gm_id.startswith('G10')
                    })
                return parsed
        except Exception as e:
            if attempt < max_retries:
                time.sleep(1)
            else:
                return []


def fetch_game_data(opener, headers, gm_id="G101", gm_ts="260098", max_retries=3):
    if str(gm_ts).isdigit() and len(str(gm_ts)) >= 4:
        ts_clean = int(str(gm_ts)[2:])
    else:
        ts_clean = int(gm_ts) if str(gm_ts).isdigit() else gm_ts
    
    init_url = f'https://www.betman.co.kr/main/mainPage/gamebuy/gameSlip.do?gmId={gm_id}&year=2026&gmTs={ts_clean}'
    req_headers = dict(headers)
    req_headers['Referer'] = init_url
    req_headers['Origin'] = 'https://www.betman.co.kr'
    
    try:
        opener.open(urllib.request.Request(init_url, headers=req_headers), timeout=10)
    except Exception:
        pass

    api_url = "https://www.betman.co.kr/buyPsblGame/gameInfoInq.do"
    
    if gm_id == "G102":
        payload = {
            "gmId": gm_id,
            "gmTs": ts_clean,
            "year": "2026",
            "_sbmInfo": { "_sbmInfo": { "debugMode": "false" } }
        }
    else:
        payload = {
            "gmId": gm_id,
            "gmTs": int(gm_ts) if str(gm_ts).isdigit() else gm_ts,
            "gameYear": "",
            "_sbmInfo": { "_sbmInfo": { "debugMode": "false" } }
        }

    for attempt in range(1, max_retries + 1):
        try:
            req_api = urllib.request.Request(api_url, data=json.dumps(payload).encode('utf-8'), headers=req_headers)
            with opener.open(req_api, timeout=12) as resp:
                text = resp.read().decode('utf-8', errors='ignore')
                if text.startswith('{'):
                    return json.loads(text)
        except Exception as e:
            if attempt < max_retries:
                time.sleep(1.5)
            else:
                print(f"[-] {gm_id} {gm_ts}회차 데이터 조회 실패: {e}")
                return None


def parse_proto_matches(raw_json, gm_ts):
    if not raw_json:
        return []

    schedules = raw_json.get('compSchedules', {})
    keys = schedules.get('keys', [])
    datas = schedules.get('datas', [])
    now_ts = time.time() * 1000

    matches = []
    for row in datas:
        m = dict(zip(keys, row))

        dt_val = m.get('gameDate')
        if dt_val:
            dt = datetime.fromtimestamp(dt_val / 1000)
            date_str = dt.strftime('%Y-%m-%d')
            time_str = dt.strftime('%H:%M')
            weekday_str = WEEKDAYS[dt.weekday()]
            full_date_str = f"{date_str} ({weekday_str}) {time_str}"
        else:
            date_str, time_str, weekday_str, full_date_str = '', '', '', ''

        match_seq = m.get('matchSeq')
        sport_code = m.get('itemCode', '')
        sport_names = {'BS': '야구', 'SC': '축구', 'BK': '농구', 'VL': '배구'}
        sport_name = sport_names.get(sport_code, sport_code)
        league_name = m.get('leagueName', '')

        home_name = m.get('homeName', '')
        away_name = m.get('awayName', '')

        bet_name = m.get('betNm', '')
        bet_type_name = m.get('betTypNm', '')

        category = "일반"
        is_proto_main = False

        if "핸디캡" in bet_type_name or "핸디캡" in bet_name:
            category = "핸디캡"
        elif "언더오버" in bet_type_name or "언더오버" in bet_name:
            category = "언더오버"
        elif "홀짝" in bet_type_name or "SUM" in bet_name:
            category = "SUM(홀짝)"
        elif "승5패" in bet_type_name or "승5패" in bet_name:
            category = "승5패"
            is_proto_main = True
        elif "승N패" in bet_type_name or "승1패" in bet_name or "승1패" in bet_type_name:
            category = "승1패"
            is_proto_main = True
        elif "승무패" in bet_type_name or "승무패" in bet_name:
            category = "승무패"
            is_proto_main = True
        elif "승패" in bet_type_name or "승패" in bet_name:
            category = "승패"
            is_proto_main = True
        else:
            is_proto_main = True

        win_handi = m.get('winHandi')
        criterion = ""
        if category == "핸디캡":
            if win_handi is not None and win_handi != 0:
                criterion = f"{win_handi:+g}" if isinstance(win_handi, (int, float)) else str(win_handi)
        elif category == "언더오버":
            if win_handi is not None and win_handi != 0:
                criterion = f"{win_handi:g}" if isinstance(win_handi, (int, float)) else str(win_handi)

        win_txt = m.get('winTxt', '승')
        draw_txt = m.get('drawTxt', '무')
        lose_txt = m.get('loseTxt', '패')

        win_allot = float(m.get('winAllot')) if m.get('winAllot') is not None else 0.0
        draw_allot = float(m.get('drawAllot')) if m.get('drawAllot') is not None else 0.0
        lose_allot = float(m.get('loseAllot')) if m.get('loseAllot') is not None else 0.0

        is_single = (m.get('sgl') == 1 or m.get('sgl') == 2)
        proto_status = m.get('protoStatus')
        mch_score = m.get('mchScore')
        game_result = m.get('gameResult')

        # 상태 및 결과 판정
        status_str = '발매중'
        status_tag = 'sale'
        winning_option = None

        if proto_status == 4 or game_result is not None:
            status_str = '적중완료'
            status_tag = 'finished'
            if game_result == 0: winning_option = 1
            elif game_result == 1: winning_option = 2
            elif game_result == 2: winning_option = 3
            elif game_result == 4: winning_option = 'cancel'
        elif proto_status == 3:
            status_str = '진행/마감'
            status_tag = 'live'
        elif proto_status == 1:
            status_str = '발매전'
            status_tag = 'before'
        else:
            if dt_val and dt_val <= now_ts:
                status_str = 'LIVE 진행중'
                status_tag = 'live'
            else:
                status_str = '발매중'
                status_tag = 'sale'

        if mch_score:
            try:
                parts = mch_score.split(':')
                if len(parts) == 2 and not winning_option:
                    h_sc = float(parts[0])
                    a_sc = float(parts[1])
                    if category in ['승무패', '승패', '일반']:
                        if h_sc > a_sc: winning_option = 1
                        elif h_sc == a_sc: winning_option = 2
                        else: winning_option = 3
            except Exception:
                pass

        matches.append({
            '게임타입': 'proto',
            '게임종류': '프로토 승부식',
            '회차': str(gm_ts),
            '번호': match_seq,
            '순번': match_seq,
            '경기일시': full_date_str,
            '날짜': date_str,
            '시간': time_str,
            '요일': weekday_str,
            '종목코드': sport_code,
            '종목': sport_name,
            '리그': league_name,
            '홈팀': home_name,
            '원정팀': away_name,
            '대진': f"{home_name} vs {away_name}",
            '대분류': category,
            '배팅타입': bet_name,
            '상세타입': bet_type_name,
            '승부식메인': is_proto_main,
            '기준값': criterion,
            '항목1_라벨': win_txt,
            '항목1_배당': f"{win_allot:.2f}" if win_allot > 0 else '',
            '항목2_라벨': draw_txt if draw_txt != '-' else '',
            '항목2_배당': f"{draw_allot:.2f}" if draw_allot > 0 else '',
            '항목3_라벨': lose_txt,
            '항목3_배당': f"{lose_allot:.2f}" if lose_allot > 0 else '',
            '단통여부': '단통가능' if is_single else '일반(2경기이상)',
            '상태': status_str,
            '상태태그': status_tag,
            '최종스코어': mch_score or '-',
            '적중항목': winning_option,
            'gameResult': game_result,
            'protoStatus': proto_status,
            'matchSeq': match_seq
        })

    matches.sort(key=lambda x: x['번호'] if isinstance(x['번호'], int) else 0)
    return matches


def parse_record_matches(raw_json, gm_ts):
    if not raw_json:
        return []

    scheds = raw_json.get('schedulesList', [])
    records = raw_json.get('protoRecordsList', [])

    matches = []
    min_len = min(len(scheds), len(records))

    for i in range(min_len):
        s = scheds[i]
        r = records[i]
        
        allots_raw = r.get('protoAllots', [])
        valid_allots = []
        for a in allots_raw:
            case_code = a.get('playCase', '')
            allot_val = a.get('playCaseAllot', a.get('allot', 0))
            if case_code and allot_val and float(allot_val) > 0:
                valid_allots.append({
                    'code': case_code,
                    'allot': f"{float(allot_val):.1f}"
                })

        if not valid_allots:
            continue

        dt_val = s.get('gameDate')
        if dt_val:
            dt = datetime.fromtimestamp(dt_val / 1000)
            date_str = dt.strftime('%Y-%m-%d')
            time_str = dt.strftime('%H:%M')
            weekday_str = WEEKDAYS[dt.weekday()]
            full_date_str = f"{date_str} ({weekday_str}) {time_str}"
        else:
            date_str, time_str, weekday_str, full_date_str = '', '', '', ''

        match_seq = s.get('matchSeq', i + 1)
        game_title = s.get('gameNameAfter') or s.get('gameName') or f"{s.get('homeName', '')} vs {s.get('awayName', '')}"
        league_name = s.get('leagueName', '')
        home_name = s.get('homeName', '')
        away_name = s.get('awayName', '')
        mch_score = s.get('mchScore', '-')

        matches.append({
            '게임타입': 'record',
            '게임종류': '프로토 기록식',
            '회차': str(gm_ts),
            '번호': match_seq,
            '순번': match_seq,
            '경기일시': full_date_str,
            '날짜': date_str,
            '시간': time_str,
            '요일': weekday_str,
            '종목': s.get('itemName', '축구'),
            '종목코드': s.get('itemCode', 'SC'),
            '리그': league_name,
            '게임명': game_title,
            '홈팀': home_name,
            '원정팀': away_name,
            '대진': f"{home_name} vs {away_name}" if home_name and away_name else game_title,
            '대분류': '기록식',
            '배팅타입': '최종스코어' if len(valid_allots) >= 30 else '기록식',
            '상세타입': '최종스코어' if len(valid_allots) >= 30 else '기록식',
            '승부식메인': True,
            '기준값': '',
            '선택지수': len(valid_allots),
            'allots': valid_allots,
            '최종스코어': mch_score,
            '상태': '발매중',
            '상태태그': 'sale',
            'matchSeq': match_seq
        })

    return matches


def parse_toto_matches(raw_json, gm_id, gm_ts, game_title):
    if not raw_json:
        return []

    sched_list = raw_json.get('schedulesList', [])
    vote_status = raw_json.get('voteStatus', {})
    home_votes = vote_status.get('homeVoteStatusList', []) if isinstance(vote_status, dict) else []
    now_ts = time.time() * 1000

    matches = []
    sport_name = "축구" if gm_id == "G011" else "야구"
    type_name = "승무패" if gm_id == "G011" else "승1패"
    draw_label = "무" if gm_id == "G011" else "1(1점차)"

    for idx, m in enumerate(sched_list):
        dt_val = m.get('gameDate')
        if dt_val:
            dt = datetime.fromtimestamp(dt_val / 1000)
            date_str = dt.strftime('%Y-%m-%d')
            time_str = dt.strftime('%H:%M')
            weekday_str = WEEKDAYS[dt.weekday()]
            full_date_str = f"{date_str} ({weekday_str}) {time_str}"
        else:
            date_str, time_str, weekday_str, full_date_str = '', '', '', ''

        match_num = idx + 1
        league_name = m.get('leagueName', '')
        home_name = m.get('homeName', '')
        away_name = m.get('awayName', '')
        mch_score = m.get('mchScore')
        proto_status = m.get('protoStatus')
        game_result = m.get('gameResult')

        status_str = '발매중'
        status_tag = 'sale'
        winning_option = None

        if proto_status == 4 or game_result is not None:
            status_str = '적중완료'
            status_tag = 'finished'
            if game_result == 0: winning_option = 1
            elif game_result == 1: winning_option = 2
            elif game_result == 2: winning_option = 3
        elif dt_val and dt_val <= now_ts:
            status_str = 'LIVE 진행중'
            status_tag = 'live'
            if mch_score:
                try:
                    hp, ap = map(int, mch_score.split(':'))
                    if gm_id == 'G011':
                        if hp > ap: winning_option = 1
                        elif hp == ap: winning_option = 2
                        else: winning_option = 3
                    else:
                        diff = abs(hp - ap)
                        if diff <= 1: winning_option = 2
                        elif hp > ap: winning_option = 1
                        else: winning_option = 3
                except Exception:
                    pass

        v_win_rate = 0.0
        v_draw_rate = 0.0
        v_lose_rate = 0.0
        cnt_win, cnt_draw, cnt_lose = 0, 0, 0

        if idx < len(home_votes):
            v_list = home_votes[idx].get('awayVoteStatusList', [])
            if len(v_list) >= 3:
                cnt_win = v_list[0].get('voteCount', 0)
                cnt_draw = v_list[1].get('voteCount', 0)
                cnt_lose = v_list[2].get('voteCount', 0)
                tot_cnt = cnt_win + cnt_draw + cnt_lose
                if tot_cnt > 0:
                    v_win_rate = (cnt_win / tot_cnt) * 100
                    v_draw_rate = (cnt_draw / tot_cnt) * 100
                    v_lose_rate = (cnt_lose / tot_cnt) * 100

        matches.append({
            '게임타입': 'toto',
            '게임종류': game_title,
            '회차': str(gm_ts),
            '번호': match_num,
            '순번': match_num,
            '경기일시': full_date_str,
            '날짜': date_str,
            '시간': time_str,
            '요일': weekday_str,
            '종목코드': 'SC' if gm_id == 'G011' else 'BS',
            '종목': sport_name,
            '리그': league_name,
            '홈팀': home_name,
            '원정팀': away_name,
            '대진': f"{home_name} vs {away_name}",
            '대분류': type_name,
            '배팅타입': f"{game_title} {match_num}번",
            '상세타입': type_name,
            '승부식메인': True,
            '기준값': '',
            '항목1_라벨': '승',
            '항목1_배당': f"{v_win_rate:.1f}%",
            '항목1_표수': cnt_win,
            '항목1_rate': v_win_rate,
            '항목2_라벨': draw_label,
            '항목2_배당': f"{v_draw_rate:.1f}%",
            '항목2_표수': cnt_draw,
            '항목2_rate': v_draw_rate,
            '항목3_라벨': '패',
            '항목3_배당': f"{v_lose_rate:.1f}%",
            '항목3_표수': cnt_lose,
            '항목3_rate': v_lose_rate,
            '최종스코어': mch_score or '-',
            '적중항목': winning_option,
            '상태': status_str,
            '상태태그': status_tag,
            'matchSeq': match_num
        })

    return matches


def export_record_to_csv(matches, filename):
    if not matches:
        return
    rows = []
    all_codes = []
    for m in matches:
        allot_dict = {a['code']: a['allot'] for a in m.get('allots', [])}
        for code in allot_dict:
            if code not in all_codes:
                all_codes.append(code)
        row = {
            '게임종류': m.get('게임종류', '프로토 기록식'),
            '회차': m.get('회차', ''),
            '번호': m.get('번호', ''),
            '경기일시': m.get('경기일시', ''),
            '종목': m.get('종목', ''),
            '리그': m.get('리그', ''),
            '게임명': m.get('게임명', ''),
            '홈팀': m.get('홈팀', ''),
            '원정팀': m.get('원정팀', ''),
            '최종스코어': m.get('최종스코어', '-'),
            '상태': m.get('상태', '발매중')
        }
        for code, val in allot_dict.items():
            row[f"배당_{code}"] = val
        rows.append(row)

    base_fields = ['게임종류', '회차', '번호', '경기일시', '종목', '리그', '게임명', '홈팀', '원정팀', '최종스코어', '상태']
    score_fields = [f"배당_{c}" for c in all_codes]
    fieldnames = base_fields + score_fields

    with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)
    print(f"[+] CSV 저장 완료: {filename} ({len(matches)}개 매치)")


def export_to_csv(matches, filename):
    if not matches:
        return
    fieldnames = [
        '게임종류', '회차', '번호', '경기일시', '종목', '리그', '홈팀', '원정팀', 
        '대분류', '배팅타입', '상세타입', '기준값', 
        '항목1_라벨', '항목1_배당', 
        '항목2_라벨', '항목2_배당', 
        '항목3_라벨', '항목3_배당', 
        '최종스코어', '적중항목', '상태'
    ]
    with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(matches)
    print(f"[+] CSV 저장 완료: {filename} ({len(matches)}개 경기)")


def export_to_html_viewer(all_games_dataset, buyable_games=None, default_key="G101_260098", filename="betman_viewer.html"):
    all_data_json = json.dumps(all_games_dataset, ensure_ascii=False)
    buyable_json = json.dumps(buyable_games or [], ensure_ascii=False)

    html_template = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>베트맨 V3 실시간 승부식 / 승무패 / 승1패 / 기록식 통합 뷰어</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f3f8; color: #1e293b; padding: 16px; }
        
        /* 2단 메인 레이아웃 (좌측 메인 컨텐츠 + 우측 마킹 저장 보관함) */
        .app-layout { display: flex; gap: 18px; max-width: 1720px; margin: 0 auto; align-items: flex-start; }
        .main-panel { flex: 1; min-width: 0; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
        
        /* 우측 저장 보관함 사이드바 */
        .vault-panel { width: 340px; flex-shrink: 0; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; position: sticky; top: 16px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; }
        
        /* 헤더 */
        .header { background: #1a3b70; color: #fff; padding: 16px 22px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        .header select { padding: 5px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; background: #fff; color: #1a3b70; border: none; cursor: pointer; }
        .header .badge { background: #ff5722; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }

        /* V3 핵심 네비게이션 탭 바 */
        .main-nav-bar { background: #0f172a; padding: 10px 22px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #2563eb; }
        .nav-tab-btn { padding: 9px 18px; border-radius: 8px; border: 1.5px solid #334155; background: #1e293b; color: #cbd5e1; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .nav-tab-btn:hover { background: #334155; color: #fff; border-color: #60a5fa; }
        .nav-tab-btn.active { background: #2563eb; color: #fff; border-color: #60a5fa; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
        .nav-tab-btn .tab-carry { background: #fef08a; color: #854d0e; font-size: 11px; padding: 2px 6px; border-radius: 10px; font-weight: 800; }

        /* 이월금액 강조 배너 */
        .carryover-hero { background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%); border-bottom: 2px solid #fde68a; padding: 12px 22px; display: flex; justify-content: space-between; align-items: center; }
        .carry-title { font-size: 15px; font-weight: 800; color: #92400e; display: flex; align-items: center; gap: 8px; }
        .carry-title b { font-size: 18px; color: #b45309; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .carry-deadline { font-size: 12px; color: #78350f; font-weight: 600; }

        /* 토토 14경기 확률 및 1등 예상 대시보드 */
        .toto-analytics-card { background: #0f172a; color: #fff; padding: 14px 22px; border-bottom: 2px solid #3b82f6; display: flex; flex-direction: column; gap: 10px; }
        .analytics-row-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .prob-badge-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .prob-box { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 6px 12px; display: flex; flex-direction: column; }
        .prob-box .lbl { font-size: 11px; color: #94a3b8; font-weight: 600; }
        .prob-box .val { font-size: 15px; font-weight: 800; color: #38bdf8; margin-top: 2px; }
        .prob-box .val.gold { color: #facc15; }
        .prob-box .val.green { color: #4ade80; }
        
        .strategy-tag { display: inline-flex; align-items: center; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; }
        .tag-monopoly { background: #ef4444; color: #fff; box-shadow: 0 0 10px rgba(239,68,68,0.5); }
        .tag-high { background: #f59e0b; color: #000; }
        .tag-fav { background: #3b82f6; color: #fff; }
        .tag-super { background: #8b5cf6; color: #fff; }

        /* 토토 컨트롤 액션 */
        .toto-banner { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .toto-info-box { display: flex; align-items: center; gap: 12px; font-size: 13px; }
        .toto-stat { background: #fff; padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
        .toto-stat b { color: #2563eb; }
        .sim-actions { display: flex; gap: 6px; }
        .sim-btn { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; transition: all 0.15s; }
        .sim-btn:hover { background: #f1f5f9; }
        .sim-btn.primary { background: #1a3b70; color: #fff; border-color: #1a3b70; }
        .sim-btn.save { background: #16a34a; color: #fff; border-color: #15803d; }
        .sim-btn.save:hover { background: #15803d; }

        /* 1게임 ~ 96게임 중복베팅 게이지 카드 */
        .dup-gauge-card { background: #ffffff; border: 2px solid #2563eb; border-radius: 10px; margin: 14px 22px 20px 22px; padding: 14px 20px; box-shadow: 0 4px 16px rgba(37,99,235,0.1); }
        .dup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .dup-title { font-size: 15px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px; }
        .dup-title span { color: #2563eb; }
        .dup-badge { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; }
        .dup-badge.normal { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .dup-badge.warning { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

        .dup-stats-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; background: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
        .dup-stat-item { display: flex; align-items: center; gap: 4px; }
        .dup-stat-item b { color: #1a3b70; font-size: 13px; }

        .gauge-container { position: relative; width: 100%; height: 22px; background: #e2e8f0; border-radius: 11px; overflow: hidden; margin-bottom: 6px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
        .gauge-fill { height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #2563eb 70%, #1d4ed8 100%); border-radius: 11px; transition: width 0.3s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: #fff; font-size: 11px; font-weight: 800; }
        .gauge-fill.over { background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%); }

        .gauge-labels { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-weight: 600; }
        .gauge-labels b { color: #0f172a; }

        /* [★ 우측 보관함 스타일] */
        .vault-header { background: #1e293b; color: #fff; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; }
        .vault-header h2 { font-size: 15px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
        .vault-clear-btn { background: transparent; border: 1px solid #64748b; color: #cbd5e1; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; }
        .vault-clear-btn:hover { background: #ef4444; color: #fff; border-color: #ef4444; }
        
        .vault-save-bar { padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 8px; }
        .vault-memo-input { width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; }
        .vault-save-btn { width: 100%; padding: 8px; background: #16a34a; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 800; cursor: pointer; transition: background 0.15s; }
        .vault-save-btn:hover { background: #15803d; }

        .vault-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .vault-empty { text-align: center; color: #94a3b8; font-size: 12px; padding: 30px 10px; }

        .vault-card { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px; transition: all 0.2s; position: relative; }
        .vault-card:hover { border-color: #2563eb; box-shadow: 0 2px 10px rgba(37,99,235,0.15); background: #fff; }
        .vault-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .vault-card-title { font-size: 13px; font-weight: 800; color: #0f172a; }
        .vault-card-time { font-size: 10px; color: #94a3b8; }
        .vault-card-memo { font-size: 11px; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 6px; font-weight: 600; }
        .vault-card-summary { font-size: 11px; color: #334155; line-height: 1.4; margin-bottom: 8px; word-break: break-all; }
        .vault-card-meta { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px; }
        .vault-card-cost { font-weight: 800; color: #2563eb; }
        .vault-card-actions { display: flex; gap: 4px; }
        .v-act-btn { padding: 3px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; }
        .v-act-btn.load { background: #2563eb; color: #fff; border-color: #2563eb; }
        .v-act-btn.del:hover { background: #fee2e2; color: #dc2626; border-color: #fecaca; }

        /* 필터 바 & 테이블 */
        .filters { padding: 10px 22px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .status-filters { display: flex; gap: 6px; margin-right: 10px; }
        .st-btn { padding: 5px 12px; border-radius: 20px; border: 1px solid #cbd5e1; background: #fff; font-size: 12px; font-weight: 700; cursor: pointer; }
        .st-btn.active { background: #1a3b70; color: #fff; border-color: #1a3b70; }
        .search-box { margin-left: auto; padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; width: 220px; }

        .table-wrap { overflow-x: auto; max-height: 700px; }
        table { width: 100%; border-collapse: collapse; text-align: center; font-size: 13px; }
        thead th { background: #2b4c7e; color: #fff; padding: 10px 6px; font-weight: 600; position: sticky; top: 0; z-index: 10; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid #eef2f6; transition: background 0.15s; }
        tbody tr:hover { background: #f1f5f9; }
        tbody tr.row-finished { background: #f0fdf4; }
        tbody tr.row-live { background: #fff7ed; }
        .seq { font-weight: bold; color: #1a3b70; font-size: 13px; }
        .date { color: #64748b; font-size: 11px; }
        
        .team-home { text-align: right; font-weight: 700; width: 170px; padding-right: 10px; font-size: 13px; }
        .team-away { text-align: left; font-weight: 700; width: 170px; padding-left: 10px; font-size: 13px; }
        .vs { color: #94a3b8; font-size: 11px; }

        .status-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800; }
        .st-finished { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .st-live { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; animation: pulse 1.5s infinite; }
        .st-sale { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .st-before { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
        }

        .score-box { display: inline-block; font-weight: 800; font-size: 13px; padding: 2px 6px; border-radius: 5px; background: #0f172a; color: #38bdf8; min-width: 50px; }

        .odds-btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 70px; padding: 4px 6px; margin: 2px; border-radius: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; font-size: 12px; }
        .odds-btn.won { background: #16a34a; color: #fff; border-color: #15803d; box-shadow: 0 2px 8px rgba(22,163,74,0.3); }
        .odds-btn.won-live { background: #ea580c; color: #fff; border-color: #c2410c; }
        .odds-btn.lost { opacity: 0.45; text-decoration: line-through; }

        .toto-mark-btn { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-width: 76px; padding: 5px 6px; margin: 2px; border-radius: 6px; background: #fff; border: 1.5px solid #cbd5e1; cursor: pointer; transition: all 0.15s; user-select: none; }
        .toto-mark-btn:hover { border-color: #2563eb; background: #eff6ff; }
        .toto-mark-btn.selected { background: #1a3b70; color: #fff; border-color: #1a3b70; }
        .toto-mark-btn.won { background: #16a34a !important; color: #fff !important; border-color: #15803d !important; font-weight: bold; }
        .toto-mark-btn .lbl { font-size: 11px; font-weight: bold; }
        .toto-mark-btn .rate { font-size: 11px; font-weight: 700; margin-top: 1px; color: #2563eb; }
        .toto-mark-btn.selected .rate, .toto-mark-btn.won .rate { color: #fed7aa; }

        .vote-bar-wrap { width: 95px; height: 9px; background: #e2e8f0; border-radius: 5px; overflow: hidden; display: inline-flex; margin: 0 auto; }
        .v-bar-win { background: #3b82f6; height: 100%; }
        .v-bar-draw { background: #94a3b8; height: 100%; }
        .v-bar-lose { background: #ef4444; height: 100%; }

        .record-card { margin: 10px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; background: #fff; text-align: left; }
        .record-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
        .record-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .record-score-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 5px; }
        .score-pill { display: flex; flex-direction: column; align-items: center; padding: 5px 3px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 11px; text-align: center; }
        .score-pill.won { background: #16a34a; color: #fff; border-color: #15803d; }
        .score-pill.won .sc-code, .score-pill.won .sc-allot { color: #fff !important; }
        .score-pill .sc-code { font-weight: 700; color: #1e293b; }
        .score-pill .sc-allot { font-weight: 800; color: #dc2626; margin-top: 1px; }

        .bet-type { display: inline-block; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 600; }
        .type-승무패, .type-승패 { background: #e0f2fe; color: #0369a1; }
        .type-승1패 { background: #ecfdf5; color: #047857; }
        .type-승5패 { background: #fef9c3; color: #a16207; }

        .footer { padding: 10px 22px; background: #f8fafc; font-size: 11px; color: #64748b; text-align: right; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
<div class="app-layout">
    <!-- 좌측 메인 패널 -->
    <div class="main-panel">
        <!-- 헤더 -->
        <div class="header">
            <h1>
                <span id="currentGameTitle">프로토 승부식</span>
                <select id="gameSelector" onchange="changeActiveKey(this.value)"></select>
            </h1>
            <span class="badge" id="matchCount">로딩 중...</span>
        </div>

        <!-- [V3 메인 네비게이션 바] 승부식 | 승무패 (축구토토 14경기) | 승1패 (야구토토 14경기) | 프로토 기록식 -->
        <div class="main-nav-bar" id="mainNavBar">
            <button class="nav-tab-btn active" id="tab-proto" onclick="selectNavTab('proto')">
                🏆 승부식
            </button>
            <button class="nav-tab-btn" id="tab-soccer" onclick="selectNavTab('soccer')">
                ⚽ 승무패 (축구토토 14경기)
                <span class="tab-carry" id="soccerCarryBadge"></span>
            </button>
            <button class="nav-tab-btn" id="tab-baseball" onclick="selectNavTab('baseball')">
                ⚾ 승1패 (야구토토 14경기)
                <span class="tab-carry" id="baseballCarryBadge"></span>
            </button>
            <button class="nav-tab-btn" id="tab-record" onclick="selectNavTab('record')">
                🎯 프로토 기록식
            </button>
        </div>

        <!-- [이월금액 강조 배너] -->
        <div class="carryover-hero" id="carryHero" style="display:none;">
            <div class="carry-title">
                🔥 <span id="carryText">이월금액 정보</span>
            </div>
            <div class="carry-deadline" id="carryDeadline">마감일시: -</div>
        </div>

        <!-- [★ 상단] 토토 14경기 조합 확률 & 1등 예상 대시보드 -->
        <div class="toto-analytics-card" id="totoAnalyticsCard" style="display:none;">
            <div class="analytics-row-top">
                <div class="prob-badge-group">
                    <div class="prob-box">
                        <span class="lbl">🎯 내 조합 적중 확률</span>
                        <span class="val" id="statProb">- %</span>
                    </div>
                    <div class="prob-box">
                        <span class="lbl">👥 1등 예상 적중 인원</span>
                        <span class="val gold" id="statWinnerCnt">- 명</span>
                    </div>
                    <div class="prob-box">
                        <span class="lbl">💰 1등 1인당 예상 수령액 (이월금 포함)</span>
                        <span class="val green" id="statEstPrize">- 원</span>
                    </div>
                </div>
                <div id="statStrategyTag"></div>
            </div>
        </div>

        <!-- [토토 전용] 14경기 마킹 시뮬레이터 배너 -->
        <div class="toto-banner" id="totoBanner" style="display: none;">
            <div class="toto-info-box">
                <span class="toto-stat">선택 경기: <b id="simSelectedCnt">0</b> / 14</span>
                <span class="toto-stat">총 조합 수: <b id="simComboCnt">0</b> 조합</span>
                <span class="toto-stat">구매 금액: <b id="simCost">0</b> 원</span>
            </div>
            <div class="sim-actions">
                <button class="sim-btn primary" onclick="autoPickTop()">⚡ 투표율 1위 선택</button>
                <button class="sim-btn" onclick="randomPick()">🎲 무작위 선택</button>
                <button class="sim-btn" onclick="clearPicks()">🔄 초기화</button>
                <button class="sim-btn save" onclick="saveCurrentSlip()">💾 보관함에 저장</button>
            </div>
        </div>
        
        <!-- [상태 필터 바] 전체 / 적중완료 / LIVE 진행중 / 발매중 -->
        <div class="filters" id="filtersArea">
            <div class="status-filters">
                <button class="st-btn active" onclick="filterStatus('ALL')">전체 상태</button>
                <button class="st-btn" onclick="filterStatus('finished')">🏆 적중완료</button>
                <button class="st-btn" onclick="filterStatus('live')">🔴 LIVE/진행중</button>
                <button class="st-btn" onclick="filterStatus('sale')">🟢 발매중</button>
            </div>
            
            <input type="text" id="searchInput" class="search-box" placeholder="번호/팀명/리그/스코어 검색..." onkeyup="searchMatches()">
        </div>

        <!-- 메인 컨텐츠 영역 -->
        <div class="table-wrap" id="mainContentArea">
            <table id="mainTable">
                <thead id="tableHead"></thead>
                <tbody id="matchTableBody"></tbody>
            </table>
            <div id="recordContentArea" style="display:none;"></div>
        </div>

        <!-- [★ 하단] 1게임 ~ 96게임 중복베팅(복식) 게이지 카드 -->
        <div class="dup-gauge-card" id="dupGaugeCard" style="display:none;">
            <div class="dup-header">
                <div class="dup-title">
                    📊 <span>중복 베팅(복식) 현황 & 1~96게임 슬립 한도 게이지</span>
                </div>
                <div id="dupLimitBadge"></div>
            </div>

            <div class="dup-stats-row">
                <div class="dup-stat-item">단식(1개 마킹): <b id="cntSingle">0</b> 경기</div>
                <div class="dup-stat-item">2복식(2개 중복): <b id="cntDouble" style="color:#2563eb;">0</b> 경기 (2픽)</div>
                <div class="dup-stat-item">3복식(3개 올마킹): <b id="cntTriple" style="color:#dc2626;">0</b> 경기 (3픽)</div>
                <div class="dup-stat-item" style="margin-left:auto;">내 베팅 규모: <b id="dupSummaryText" style="color:#0f172a; font-size:14px;">0 조합 (0원)</b></div>
            </div>

            <div class="gauge-container">
                <div class="gauge-fill" id="gaugeFill" style="width: 0%;">0 / 96 게임</div>
            </div>

            <div class="gauge-labels">
                <span>단식 <b>1게임 (1,000원)</b></span>
                <span>중간 <b>48게임 (48,000원)</b></span>
                <span>베트맨 1슬립 한도 <b>96게임 (96,000원)</b></span>
            </div>
        </div>

        <div class="footer" id="footerText"></div>
    </div>

    <!-- [★ 우측] 마킹 저장 보관함 사이드바 -->
    <div class="vault-panel" id="vaultPanel">
        <div class="vault-header">
            <h2>📁 마킹 저장 보관함</h2>
            <button class="vault-clear-btn" onclick="clearAllVault()">전체비우기</button>
        </div>
        
        <div class="vault-save-bar">
            <input type="text" id="vaultMemoInput" class="vault-memo-input" placeholder="슬립 메모/이름 입력 (예: 1차 정배조합)">
            <button class="vault-save-btn" onclick="saveCurrentSlip()">💾 현재 마킹 슬립 저장하기</button>
        </div>

        <div class="vault-list" id="vaultList">
            <!-- 저장된 슬립 카드들이 여기에 동적으로 렌더링됩니다 -->
        </div>
    </div>
</div>

<script>
    const allDataset = __ALL_DATA_JSON__;
    const buyableGames = __BUYABLE_JSON__;
    let activeKey = '__DEFAULT_KEY__';
    let currentStatus = 'ALL';
    let userPicks = {};

    const STORAGE_KEY = 'betman_v3_saved_slips';

    function init() {
        const gameKeys = Object.keys(allDataset);
        const sel = document.getElementById('gameSelector');
        sel.innerHTML = gameKeys.map(k => {
            const firstItem = allDataset[k][0] || {};
            const title = `${firstItem.게임종류 || k} (${firstItem.회차}회차)`;
            return `<option value="${k}" ${k === activeKey ? 'selected' : ''}>${title}</option>`;
        }).join('');

        const soccerGame = buyableGames.find(g => g.gmId === 'G011');
        if (soccerGame && soccerGame.forwardAmount > 0) {
            document.getElementById('soccerCarryBadge').textContent = `🔥 ${soccerGame.forwardCnt}회 이월: ${(soccerGame.forwardAmount / 100000000).toFixed(1)}억`;
        }
        const bbGame = buyableGames.find(g => g.gmId === 'G024');
        if (bbGame && bbGame.forwardAmount > 0) {
            document.getElementById('baseballCarryBadge').textContent = `🔥 ${bbGame.forwardCnt}회 이월: ${(bbGame.forwardAmount / 100000000).toFixed(1)}억`;
        }

        renderVaultList();
        selectNavTab('proto');
    }

    function selectNavTab(tabType) {
        document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
        
        let targetKey = null;
        if (tabType === 'proto') {
            document.getElementById('tab-proto').classList.add('active');
            targetKey = Object.keys(allDataset).find(k => k.startsWith('G101'));
        } else if (tabType === 'soccer') {
            document.getElementById('tab-soccer').classList.add('active');
            targetKey = Object.keys(allDataset).find(k => k.startsWith('G011'));
        } else if (tabType === 'baseball') {
            document.getElementById('tab-baseball').classList.add('active');
            targetKey = Object.keys(allDataset).find(k => k.startsWith('G024'));
        } else if (tabType === 'record') {
            document.getElementById('tab-record').classList.add('active');
            targetKey = Object.keys(allDataset).find(k => k.startsWith('G102'));
        }

        if (targetKey) {
            changeActiveKey(targetKey);
        }
    }

    function changeActiveKey(key) {
        if (!allDataset[key]) {
            alert('해당 게임 데이터를 불러오는 중입니다.');
            return;
        }
        activeKey = key;
        document.getElementById('gameSelector').value = key;
        userPicks = {};

        const isSoccer = key.startsWith('G011');
        const isBaseball = key.startsWith('G024');
        const isToto = isSoccer || isBaseball;
        const isRecord = key.startsWith('G102');
        const isProto = key.startsWith('G101');

        document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
        if (isProto) document.getElementById('tab-proto').classList.add('active');
        else if (isSoccer) document.getElementById('tab-soccer').classList.add('active');
        else if (isBaseball) document.getElementById('tab-baseball').classList.add('active');
        else if (isRecord) document.getElementById('tab-record').classList.add('active');

        const hero = document.getElementById('carryHero');
        const currGame = buyableGames.find(g => `${g.gmId}_${g.gmTs}` === key);
        if (currGame && currGame.forwardAmount > 0) {
            hero.style.display = 'flex';
            document.getElementById('carryText').innerHTML = `<b>${currGame.gameName} (${currGame.gmTs}회차)</b> 1등 적중금 ${currGame.forwardCnt}회 연속 이월: <b>${currGame.forwardAmount.toLocaleString()}원</b>`;
            document.getElementById('carryDeadline').innerHTML = `마감일시: <b>${currGame.endDate}</b>`;
        } else {
            hero.style.display = 'none';
        }

        document.getElementById('totoBanner').style.display = isToto ? 'flex' : 'none';
        document.getElementById('totoAnalyticsCard').style.display = isToto ? 'flex' : 'none';
        document.getElementById('dupGaugeCard').style.display = isToto ? 'block' : 'none';
        document.getElementById('filtersArea').style.display = isRecord ? 'none' : 'flex';
        
        document.getElementById('mainTable').style.display = isRecord ? 'none' : 'table';
        document.getElementById('recordContentArea').style.display = isRecord ? 'block' : 'none';

        renderContent();
        if (isToto) updateSimulator();
    }

    function renderContent() {
        const matches = allDataset[activeKey] || [];
        const first = matches[0] || {};
        const title = `${first.게임종류 || '게임'} (${first.회차}회차)`;
        document.getElementById('currentGameTitle').textContent = title;

        const isToto = activeKey.startsWith('G011') || activeKey.startsWith('G024');
        const isRecord = activeKey.startsWith('G102');
        const query = document.getElementById('searchInput').value.trim().toLowerCase();

        if (isRecord) {
            const container = document.getElementById('recordContentArea');
            container.innerHTML = matches.map(m => {
                const scoreCode = m.최종스코어 && m.최종스코어 !== '-' ? m.최종스코어.replace(':', '-') : '';

                const allotsHtml = m.allots.map(a => {
                    const isWon = scoreCode && a.code === scoreCode;
                    return `
                        <div class="score-pill ${isWon ? 'won' : ''}">
                            <span class="sc-code">${a.code}</span>
                            <span class="sc-allot">${a.allot}${isWon ? ' 🏆' : ''}</span>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="record-card">
                        <div class="record-card-header">
                            <div>
                                <span class="seq" style="margin-right: 8px;">${m.번호}번</span>
                                <span class="record-title">${m.게임명}</span>
                                <span class="date" style="margin-left: 10px;">${m.경기일시}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                ${m.최종스코어 && m.최종스코어 !== '-' ? `<span class="score-box">${m.최종스코어}</span>` : ''}
                                <span class="badge" style="background:#2563eb; font-size:11px;">${m.리그}</span>
                            </div>
                        </div>
                        <div class="record-score-grid">
                            ${allotsHtml}
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('matchCount').textContent = `${title} | ${matches.length}개 게임 매치`;
            document.getElementById('footerText').textContent = `${title} 36개 스코어 배당률 전체 로드 완료`;

        } else if (isToto) {
            const thead = document.getElementById('tableHead');
            const tbody = document.getElementById('matchTableBody');

            thead.innerHTML = `
                <tr>
                    <th style="width: 50px;">경기</th>
                    <th style="width: 85px;">상태</th>
                    <th style="width: 65px;">스코어</th>
                    <th style="width: 125px;">경기일시</th>
                    <th style="width: 105px;">리그</th>
                    <th style="width: 155px;">홈팀</th>
                    <th style="width: 270px;">투표율 마킹 슬립 [승 / 무(1) / 패]</th>
                    <th style="width: 155px;">원정팀</th>
                    <th style="width: 110px;">투표율 그래프</th>
                </tr>
            `;

            let filtered = matches.filter(m => {
                if (currentStatus !== 'ALL' && m.상태태그 !== currentStatus) return false;
                if (query) {
                    const searchStr = (m.번호 + ' ' + m.리그 + ' ' + m.홈팀 + ' ' + m.원정팀 + ' ' + (m.최종스코어 || '')).toLowerCase();
                    if (!searchStr.includes(query)) return false;
                }
                return true;
            });

            tbody.innerHTML = filtered.map(m => {
                const picks = userPicks[m.번호] || new Set();
                const drawLbl = m.항목2_라벨 || '무';
                const r1 = parseFloat(m.항목1_배당) || 0;
                const r2 = parseFloat(m.항목2_배당) || 0;
                const r3 = parseFloat(m.항목3_배당) || 0;

                const isWon1 = (m.적중항목 === 1);
                const isWon2 = (m.적중항목 === 2);
                const isWon3 = (m.적중항목 === 3);

                let stClass = 'st-sale';
                if (m.상태태그 === 'finished') stClass = 'st-finished';
                else if (m.상태태그 === 'live') stClass = 'st-live';

                return `
                    <tr class="row-${m.상태태그}">
                        <td class="seq">${m.번호}</td>
                        <td><span class="status-badge ${stClass}">${m.상태}</span></td>
                        <td><span class="score-box">${m.최종스코어}</span></td>
                        <td class="date">${m.경기일시}</td>
                        <td style="font-weight: 600;">${m.리그}</td>
                        <td class="team-home">${m.홈팀}</td>
                        <td>
                            <div style="display: flex; justify-content: center; gap: 3px;">
                                <button type="button" class="toto-mark-btn ${picks.has('승') ? 'selected' : ''} ${isWon1 ? 'won' : ''}" onclick="togglePick(${m.번호}, '승')">
                                    <span class="lbl">홈 승 ${isWon1 ? '🏆' : ''}</span>
                                    <span class="rate">${m.항목1_배당}</span>
                                </button>
                                <button type="button" class="toto-mark-btn ${picks.has(drawLbl) ? 'selected' : ''} ${isWon2 ? 'won' : ''}" onclick="togglePick(${m.번호}, '${drawLbl}')">
                                    <span class="lbl">${drawLbl} ${isWon2 ? '🏆' : ''}</span>
                                    <span class="rate">${m.항목2_배당}</span>
                                </button>
                                <button type="button" class="toto-mark-btn ${picks.has('패') ? 'selected' : ''} ${isWon3 ? 'won' : ''}" onclick="togglePick(${m.번호}, '패')">
                                    <span class="lbl">원정 패 ${isWon3 ? '🏆' : ''}</span>
                                    <span class="rate">${m.항목3_배당}</span>
                                </button>
                            </div>
                        </td>
                        <td class="team-away">${m.원정팀}</td>
                        <td>
                            <div class="vote-bar-wrap" title="승:${r1}% / ${drawLbl}:${r2}% / 패:${r3}%">
                                <div class="v-bar-win" style="width: ${r1}%;"></div>
                                <div class="v-bar-draw" style="width: ${r2}%;"></div>
                                <div class="v-bar-lose" style="width: ${r3}%;"></div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            document.getElementById('matchCount').textContent = `${title} | 총 ${filtered.length}개 경기`;
            document.getElementById('footerText').textContent = `${title} 14개 경기 실시간 로드 완료`;

        } else {
            const thead = document.getElementById('tableHead');
            const tbody = document.getElementById('matchTableBody');

            thead.innerHTML = `
                <tr>
                    <th style="width: 55px;">번호</th>
                    <th style="width: 85px;">상태</th>
                    <th style="width: 65px;">스코어</th>
                    <th style="width: 125px;">일시</th>
                    <th style="width: 50px;">종목</th>
                    <th style="width: 100px;">리그</th>
                    <th style="width: 75px;">유형</th>
                    <th>홈팀 vs 원정팀</th>
                    <th style="width: 90px;">항목 1</th>
                    <th style="width: 90px;">항목 2</th>
                    <th style="width: 90px;">항목 3</th>
                    <th style="width: 50px;">단통</th>
                </tr>
            `;

            let filtered = matches.filter(m => {
                if (currentStatus !== 'ALL' && m.상태태그 !== currentStatus) return false;
                if (!m.승부식메인) return false;

                if (query) {
                    const searchStr = (m.번호 + ' ' + m.리그 + ' ' + m.홈팀 + ' ' + m.원정팀 + ' ' + m.상세타입 + ' ' + (m.최종스코어 || '')).toLowerCase();
                    if (!searchStr.includes(query)) return false;
                }
                return true;
            });

            document.getElementById('matchCount').textContent = `${title} | 승부식 ${filtered.length}개 경기`;
            document.getElementById('footerText').textContent = `${title} 승부식 로드 완료 (${filtered.length}개 경기)`;

            tbody.innerHTML = filtered.map(m => {
                let stClass = 'st-sale';
                if (m.상태태그 === 'finished') stClass = 'st-finished';
                else if (m.상태태그 === 'live') stClass = 'st-live';
                else if (m.상태태그 === 'before') stClass = 'st-before';

                const isWon1 = (m.적중항목 === 1);
                const isWon2 = (m.적중항목 === 2);
                const isWon3 = (m.적중항목 === 3);

                const hasWon = isWon1 || isWon2 || isWon3;

                return `
                    <tr class="row-${m.상태태그}">
                        <td class="seq">${m.번호}</td>
                        <td><span class="status-badge ${stClass}">${m.상태}</span></td>
                        <td><span class="score-box">${m.최종스코어}</span></td>
                        <td class="date">${m.경기일시}</td>
                        <td><span class="sport-tag sport-${m.종목코드}">${m.종목}</span></td>
                        <td style="font-weight: 500;">${m.리그}</td>
                        <td><span class="bet-type type-${m.대분류}">${m.상세타입}</span></td>
                        <td>
                            <span class="team-home">${m.홈팀}</span>
                            <span class="vs">vs</span>
                            <span class="team-away">${m.원정팀}</span>
                        </td>
                        <td>
                            ${m.항목1_배당 ? `
                                <span class="odds-btn ${isWon1 ? (m.상태태그 === 'finished' ? 'won' : 'won-live') : (hasWon ? 'lost' : '')}">
                                    ${m.항목1_라벨} <b>${m.항목1_배당}</b> ${isWon1 ? '🏆' : ''}
                                </span>` : '-'}
                        </td>
                        <td>
                            ${m.항목2_배당 ? `
                                <span class="odds-btn ${isWon2 ? (m.상태태그 === 'finished' ? 'won' : 'won-live') : (hasWon ? 'lost' : '')}">
                                    ${m.항목2_라벨} <b>${m.항목2_배당}</b> ${isWon2 ? '🏆' : ''}
                                </span>` : '-'}
                        </td>
                        <td>
                            ${m.항목3_배당 ? `
                                <span class="odds-btn ${isWon3 ? (m.상태태그 === 'finished' ? 'won' : 'won-live') : (hasWon ? 'lost' : '')}">
                                    ${m.항목3_라벨} <b>${m.항목3_배당}</b> ${isWon3 ? '🏆' : ''}
                                </span>` : '-'}
                        </td>
                        <td>${m.단통여부 === '단통가능' ? '<span class="single-badge">단통</span>' : '-'}</td>
                    </tr>
                `;
            }).join('');
        }
    }

    function filterStatus(st) {
        currentStatus = st;
        document.querySelectorAll('.st-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        renderContent();
    }

    function togglePick(matchNum, val) {
        if (!userPicks[matchNum]) userPicks[matchNum] = new Set();
        if (userPicks[matchNum].has(val)) {
            userPicks[matchNum].delete(val);
            if (userPicks[matchNum].size === 0) delete userPicks[matchNum];
        } else {
            userPicks[matchNum].add(val);
        }
        renderContent();
        updateSimulator();
    }

    function updateSimulator() {
        const matches = allDataset[activeKey] || [];
        let markedGamesCount = Object.keys(userPicks).length;
        let combos = 0;

        let singleCount = 0;
        let doubleCount = 0;
        let tripleCount = 0;

        for (let k in userPicks) {
            const sz = userPicks[k].size;
            if (sz === 1) singleCount++;
            else if (sz === 2) doubleCount++;
            else if (sz >= 3) tripleCount++;
        }

        if (markedGamesCount === 14) {
            combos = 1;
            for (let i = 1; i <= 14; i++) {
                const count = userPicks[i] ? userPicks[i].size : 0;
                combos *= count;
            }
        } else if (markedGamesCount > 0) {
            combos = 1;
            for (let k in userPicks) {
                combos *= userPicks[k].size;
            }
        }

        const cost = combos * 1000;
        document.getElementById('simSelectedCnt').textContent = markedGamesCount;
        document.getElementById('simComboCnt').textContent = combos.toLocaleString();
        document.getElementById('simCost').textContent = cost.toLocaleString();

        document.getElementById('cntSingle').textContent = singleCount;
        document.getElementById('cntDouble').textContent = doubleCount;
        document.getElementById('cntTriple').textContent = tripleCount;
        document.getElementById('dupSummaryText').textContent = `${combos.toLocaleString()} 게임 (${cost.toLocaleString()} 원)`;

        const gaugeFill = document.getElementById('gaugeFill');
        const limitBadge = document.getElementById('dupLimitBadge');
        const gaugePercent = Math.min(100, (combos / 96.0) * 100.0);

        if (combos > 96) {
            gaugeFill.style.width = '100%';
            gaugeFill.className = 'gauge-fill over';
            gaugeFill.textContent = `${combos}게임 (${cost.toLocaleString()}원) - 한도 초과!`;
            limitBadge.innerHTML = `<span class="dup-badge warning">⚠️ 1슬립 한도(96게임) 초과! 슬립 ${Math.ceil(combos / 96)}장 분할 구매 필요</span>`;
        } else if (combos > 0) {
            gaugeFill.style.width = `${Math.max(8, gaugePercent)}%`;
            gaugeFill.className = 'gauge-fill';
            gaugeFill.textContent = `${combos} / 96 게임 (${cost.toLocaleString()}원)`;
            limitBadge.innerHTML = `<span class="dup-badge normal">✓ 1슬립 한도 내 정상 (${gaugePercent.toFixed(1)}% 사용)</span>`;
        } else {
            gaugeFill.style.width = '0%';
            gaugeFill.textContent = '0 / 96 게임';
            limitBadge.innerHTML = `<span class="dup-badge normal">마킹을 시작해 주세요</span>`;
        }

        const probEl = document.getElementById('statProb');
        const winnerEl = document.getElementById('statWinnerCnt');
        const prizeEl = document.getElementById('statEstPrize');
        const tagEl = document.getElementById('statStrategyTag');

        if (markedGamesCount === 14) {
            let totalProb = 1.0;
            for (let i = 1; i <= 14; i++) {
                const m = matches[i - 1] || {};
                const drawLbl = m.항목2_라벨 || '무';
                const picks = userPicks[i] || new Set();

                let sumGameRate = 0.0;
                if (picks.has('승')) sumGameRate += (parseFloat(m.항목1_배당) || 0) / 100.0;
                if (picks.has(drawLbl)) sumGameRate += (parseFloat(m.항목2_배당) || 0) / 100.0;
                if (picks.has('패')) sumGameRate += (parseFloat(m.항목3_배당) || 0) / 100.0;

                totalProb *= sumGameRate;
            }

            const probPercent = totalProb * 100.0;
            let probStr = probPercent >= 0.0001 ? `${probPercent.toFixed(4)} %` : (probPercent >= 0.000001 ? `${probPercent.toFixed(6)} %` : `${probPercent.toExponential(3)} %`);
            probEl.textContent = probStr;

            const currGame = buyableGames.find(g => `${g.gmId}_${g.gmTs}` === activeKey);
            const carryAmt = currGame ? (currGame.forwardAmount || 0) : 0;
            
            const estTotalTickets = 2000000;
            const singleProb = totalProb / combos;
            const estWinnersPerCombo = estTotalTickets * singleProb;
            const estTotalWinners = Math.max(0, estWinnersPerCombo);
            const estNetPrizePool = (estTotalTickets * 1000 * 0.25) + carryAmt;

            let winnerStr = '';
            let prizeStr = '';
            let tagHtml = '';

            if (estTotalWinners < 0.3) {
                winnerStr = '0 ~ 1명 (독식/이월 유력!)';
                prizeStr = `약 ${(estNetPrizePool / 100000000).toFixed(2)} 억원 (독식 대박)`;
                tagHtml = '<span class="strategy-tag tag-monopoly">🔥 황금 역배 (독식 노림수)</span>';
            } else if (estTotalWinners < 2.5) {
                winnerStr = `약 ${Math.round(estTotalWinners)}명 (소수 독식)`;
                prizeStr = `약 ${((estNetPrizePool / (Math.round(estTotalWinners) || 1)) / 100000000).toFixed(2)} 억원`;
                tagHtml = '<span class="strategy-tag tag-high">⚡ 고배당 알짜 조합</span>';
            } else if (estTotalWinners < 15) {
                winnerStr = `약 ${Math.round(estTotalWinners)}명`;
                prizeStr = `약 ${((estNetPrizePool / Math.round(estTotalWinners)) / 10000).toFixed(0)} 만원`;
                tagHtml = '<span class="strategy-tag tag-fav">🏆 중도 안정형 조합</span>';
            } else {
                winnerStr = `약 ${Math.round(estTotalWinners)}명 (다수 적중)`;
                prizeStr = `약 ${((estNetPrizePool / Math.round(estTotalWinners)) / 10000).toFixed(0)} 만원`;
                tagHtml = '<span class="strategy-tag tag-super">👥 정배 집중 조합</span>';
            }

            winnerEl.textContent = winnerStr;
            prizeEl.textContent = prizeStr;
            tagEl.innerHTML = tagHtml;

        } else {
            probEl.textContent = `14경기 중 ${markedGamesCount}경기 선택됨`;
            winnerEl.textContent = '14경기 마킹 시 자동 계산';
            prizeEl.textContent = '- 원';
            tagEl.innerHTML = '<span style="font-size:12px; color:#94a3b8;">14경기를 모두 선택하면 1등 확률/인원수가 산출됩니다.</span>';
        }
    }

    function autoPickTop() {
        const matches = allDataset[activeKey] || [];
        userPicks = {};
        matches.forEach(m => {
            const r1 = parseFloat(m.항목1_배당) || 0;
            const r2 = parseFloat(m.항목2_배당) || 0;
            const r3 = parseFloat(m.항목3_배당) || 0;
            const drawLbl = m.항목2_라벨 || '무';

            let topChoice = '승';
            let maxR = r1;
            if (r2 > maxR) { maxR = r2; topChoice = drawLbl; }
            if (r3 > maxR) { maxR = r3; topChoice = '패'; }

            userPicks[m.번호] = new Set([topChoice]);
        });
        renderContent();
        updateSimulator();
    }

    function randomPick() {
        const matches = allDataset[activeKey] || [];
        userPicks = {};
        matches.forEach(m => {
            const drawLbl = m.항목2_라벨 || '무';
            const opts = ['승', drawLbl, '패'];
            const randOpt = opts[Math.floor(Math.random() * opts.length)];
            userPicks[m.번호] = new Set([randOpt]);
        });
        renderContent();
        updateSimulator();
    }

    function clearPicks() {
        userPicks = {};
        renderContent();
        updateSimulator();
    }

    /* [★ 보관함 LocalStorage 저장 / 불러오기 / 삭제 로직] */
    function getStoredSlips() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveStoredSlips(slips) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slips));
        renderVaultList();
    }

    function saveCurrentSlip() {
        const markedCount = Object.keys(userPicks).length;
        if (markedCount === 0) {
            alert('저장할 마킹 내역이 없습니다. 먼저 경기를 선택해 주세요!');
            return;
        }

        const matches = allDataset[activeKey] || [];
        const first = matches[0] || {};
        const gameName = first.게임종류 || activeKey;
        const round = first.회차 || '';

        let combos = 1;
        for (let k in userPicks) {
            combos *= userPicks[k].size;
        }
        const cost = combos * 1000;

        // 마킹 요약 생성 (예: 1:승, 2:무/패, ...)
        let summaryList = [];
        for (let i = 1; i <= 14; i++) {
            if (userPicks[i] && userPicks[i].size > 0) {
                summaryList.push(`${i}번:[${Array.from(userPicks[i]).join('/')}]`);
            }
        }

        const memoInput = document.getElementById('vaultMemoInput');
        const memo = memoInput.value.trim() || `${gameName} (${round}회차) - ${combos}게임`;
        memoInput.value = '';

        const now = new Date();
        const timeStr = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        // Set 객체를 Array로 직렬화하여 저장
        const serializablePicks = {};
        for (let k in userPicks) {
            serializablePicks[k] = Array.from(userPicks[k]);
        }

        const newSlip = {
            id: Date.now(),
            gameKey: activeKey,
            gameName: gameName,
            round: round,
            memo: memo,
            time: timeStr,
            combos: combos,
            cost: cost,
            markedCount: markedCount,
            picks: serializablePicks,
            summary: summaryList.join(' ')
        };

        const slips = getStoredSlips();
        slips.unshift(newSlip); // 최신 순으로 위에 추가
        saveStoredSlips(slips);
        alert(`[저장 완료] "${memo}" 보관함에 안전하게 저장되었습니다!`);
    }

    function loadSlip(id) {
        const slips = getStoredSlips();
        const slip = slips.find(s => s.id === id);
        if (!slip) return;

        // 해당 게임으로 탭 전환
        if (slip.gameKey && slip.gameKey !== activeKey) {
            changeActiveKey(slip.gameKey);
        }

        // 마킹 복원
        userPicks = {};
        for (let k in slip.picks) {
            userPicks[k] = new Set(slip.picks[k]);
        }

        renderContent();
        updateSimulator();
        alert(`[불러오기 완료] "${slip.memo}" 마킹 상태가 복원되었습니다.`);
    }

    function deleteSlip(id) {
        if (!confirm('이 저장 슬립을 삭제하시겠습니까?')) return;
        let slips = getStoredSlips();
        slips = slips.filter(s => s.id !== id);
        saveStoredSlips(slips);
    }

    function clearAllVault() {
        if (!confirm('보관함에 저장된 모든 슬립을 비우시겠습니까?')) return;
        localStorage.removeItem(STORAGE_KEY);
        renderVaultList();
    }

    function renderVaultList() {
        const container = document.getElementById('vaultList');
        const slips = getStoredSlips();

        if (slips.length === 0) {
            container.innerHTML = `
                <div class="vault-empty">
                    📌 저장된 마킹 슬립이 없습니다.<br>
                    마킹 후 [💾 현재 마킹 슬립 저장하기]를<br>
                    누르면 여기에 보관됩니다.
                </div>
            `;
            return;
        }

        container.innerHTML = slips.map((s, idx) => {
            return `
                <div class="vault-card">
                    <div class="vault-card-top">
                        <span class="vault-card-title">#${slips.length - idx}. ${s.gameName} (${s.round}회)</span>
                        <span class="vault-card-time">${s.time}</span>
                    </div>
                    <div class="vault-card-memo">${s.memo}</div>
                    <div class="vault-card-summary">${s.summary || '14경기 마킹 내역'}</div>
                    <div class="vault-card-meta">
                        <span class="vault-card-cost">${s.combos}게임 (${s.cost.toLocaleString()}원)</span>
                        <div class="vault-card-actions">
                            <button class="v-act-btn load" onclick="loadSlip(${s.id})">불러오기</button>
                            <button class="v-act-btn del" onclick="deleteSlip(${s.id})">삭제</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function searchMatches() {
        renderContent();
    }

    init();
</script>
</body>
</html>
"""
    final_html = (html_template
                  .replace("__ALL_DATA_JSON__", all_data_json)
                  .replace("__BUYABLE_JSON__", buyable_json)
                  .replace("__DEFAULT_KEY__", str(default_key)))

    with open(filename, "w", encoding="utf-8") as f:
        f.write(final_html)
    print(f"[+] V3 통합 반응형 HTML 뷰어 생성 완료: {filename}")


def run_collection(target_rounds=None, num_recent=2, only_active=False):
    opener, headers = create_session()
    
    print("[*] [V3] 베트맨 전체 회차 목록 및 구매 가능 핵심 게임 조회 중...")
    all_schedules = get_available_rounds(opener, headers, gm_id="G101")
    buyable_games = fetch_buyable_games(opener, headers)
    
    active_rounds = [str(r['gmTs']) for r in all_schedules if r.get('saleStatus') == 'SaleProgress']
    all_round_numbers = [str(r['gmTs']) for r in all_schedules]

    print(f"[+] 구매 가능 핵심 게임 (총 {len(buyable_games)}개):")
    for g in buyable_games:
        carry = f" | {g['forwardCnt']}회 이월: {g['forwardAmount']:,}원" if g['forwardAmount'] > 0 else ""
        print(f"    - [{g['sport']}] {g['gameName']} ({g['gmTs']}회차) | 마감: {g['endDate']}{carry}")

    all_dataset = {}

    if target_rounds:
        proto_rounds_to_fetch = target_rounds
    elif only_active:
        proto_rounds_to_fetch = active_rounds if active_rounds else all_round_numbers[:1]
    else:
        proto_rounds_to_fetch = all_round_numbers[:num_recent]

    print(f"\n[*] 프로토 승부식 수집 대상: {proto_rounds_to_fetch}")
    for gm_ts in proto_rounds_to_fetch:
        key = f"G101_{gm_ts}"
        print(f"--> [프로토 승부식 {gm_ts}회차] 스코어/적중결과 수집 중...")
        raw_json = fetch_game_data(opener, headers, gm_id="G101", gm_ts=gm_ts)
        matches = parse_proto_matches(raw_json, gm_ts)
        if matches:
            all_dataset[key] = matches
            export_to_csv(matches, f"betman_proto_{gm_ts}.csv")
            fin_cnt = sum(1 for m in matches if m['상태태그'] == 'finished')
            live_cnt = sum(1 for m in matches if m['상태태그'] == 'live')
            print(f"    [OK] 프로토 승부식 {gm_ts}회차 {len(matches)}개 경기 (적중완료: {fin_cnt}개, 진행/마감: {live_cnt}개)")

    for g in buyable_games:
        gm_id = g['gmId']
        gm_ts = g['gmTs']
        key = f"{gm_id}_{gm_ts}"
        
        if gm_id == "G102":
            print(f"--> [프로토 기록식 {gm_ts}회차] 스코어 배당 데이터 수집 중...")
            raw_json = fetch_game_data(opener, headers, gm_id="G102", gm_ts=gm_ts)
            matches = parse_record_matches(raw_json, gm_ts)
            if matches:
                all_dataset[key] = matches
                export_record_to_csv(matches, f"betman_proto_record_{gm_ts}.csv")
                print(f"    [OK] 프로토 기록식 {gm_ts}회차 {len(matches)}개 매치 36개 스코어 배당 파싱 완료")

        elif gm_id == "G011":
            print(f"--> [축구토토 승무패 {gm_ts}회차] 14경기 스코어/투표율 수집 중...")
            raw_json = fetch_game_data(opener, headers, gm_id="G011", gm_ts=gm_ts)
            matches = parse_toto_matches(raw_json, "G011", gm_ts, "축구토토 승무패")
            if matches:
                all_dataset[key] = matches
                export_to_csv(matches, f"betman_toto_soccer_{gm_ts}.csv")
                print(f"    [OK] 축구토토 승무패 {gm_ts}회차 14경기 파싱 완료")

        elif gm_id == "G024":
            print(f"--> [야구토토 승1패 {gm_ts}회차] 14경기 스코어/투표율 수집 중...")
            raw_json = fetch_game_data(opener, headers, gm_id="G024", gm_ts=gm_ts)
            matches = parse_toto_matches(raw_json, "G024", gm_ts, "야구토토 승1패")
            if matches:
                all_dataset[key] = matches
                export_to_csv(matches, f"betman_toto_baseball_{gm_ts}.csv")
                print(f"    [OK] 야구토토 승1패 {gm_ts}회차 14경기 파싱 완료")

    if all_dataset:
        with open("betman_dataset_all.json", "w", encoding="utf-8") as f:
            json.dump({
                'buyableGames': buyable_games,
                'games': all_dataset
            }, f, ensure_ascii=False, indent=2)
        default_key = f"G101_{proto_rounds_to_fetch[0]}" if proto_rounds_to_fetch else list(all_dataset.keys())[0]
        export_to_html_viewer(all_dataset, buyable_games=buyable_games, default_key=default_key, filename="betman_viewer.html")
        print("\n[OK] [V3] 우측 마킹 저장 보관함 & 1~96게임 게이지 시스템 완벽 구축 완료!")


def main():
    parser = argparse.ArgumentParser(description="베트맨 V3 경기 결과 & 라이브 스코어 자동 수집기")
    parser.add_argument("rounds", nargs="*", help="수집할 특정 승부식 회차 번호들 (예: 260098 260097)")
    parser.add_argument("--active", action="store_true", help="현재 발매 중인 활성 회차만 자동 수집")
    parser.add_argument("--recent", type=int, default=2, help="최근 N개 승부식 회차 자동 수집 (기본값: 2)")
    parser.add_argument("--auto-interval", type=int, default=0, help="주기적 자동 갱신 간격 (분 단위, 0이면 1회 실행 후 종료)")

    args = parser.parse_args()

    if args.auto_interval > 0:
        print(f"[🚀] {args.auto_interval}분 간격 자동 갱신 모드로 실행합니다. (종료하려면 Ctrl+C)")
        while True:
            try:
                now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                print(f"\n==========================================")
                print(f"[*] 자동 수집 실행 시간: {now_str}")
                print(f"==========================================")
                run_collection(target_rounds=args.rounds, num_recent=args.recent, only_active=args.active)
            except Exception as e:
                print(f"[-] 에러 발생: {e}")
            print(f"[*] 다음 갱신까지 {args.auto_interval}분 대기 중...")
            time.sleep(args.auto_interval * 60)
    else:
        run_collection(target_rounds=args.rounds, num_recent=args.recent, only_active=args.active)


if __name__ == '__main__':
    main()
